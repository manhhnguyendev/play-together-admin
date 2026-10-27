import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  App,
  Avatar,
  Button,
  Card,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
} from 'antd'
import type { TableProps } from 'antd'
import { useState } from 'react'
import { adminService } from '@/api/admin'
import { toApiError } from '@/api/client'
import type { CharityView } from '@/api/types'
import { PageHeader } from '@/components/PageHeader'
import { formatDateTime, formatMoney, formatNumber } from '@/lib/format'

interface CharityForm {
  email?: string
  password?: string
  organizationName: string
  information?: string
  address?: string
  contactEmail?: string
  phone?: string
  avatarUrl?: string
  isActive?: boolean
}

function trimOrUndefined(value?: string): string | undefined {
  const next = value?.trim()
  return next ? next : undefined
}

function toPayload(values: CharityForm) {
  return {
    organizationName: values.organizationName.trim(),
    information: trimOrUndefined(values.information),
    address: trimOrUndefined(values.address),
    contactEmail: trimOrUndefined(values.contactEmail),
    phone: trimOrUndefined(values.phone),
    avatarUrl: trimOrUndefined(values.avatarUrl),
  }
}

export default function CharitiesPage() {
  const { message } = App.useApp()
  const queryClient = useQueryClient()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState<CharityView | null>(null)
  const [creating, setCreating] = useState(false)
  const [form] = Form.useForm<CharityForm>()

  const params = { page, pageSize, q: q || undefined }
  const query = useQuery({
    queryKey: ['admin', 'charities', params],
    queryFn: () => adminService.charities(params),
    placeholderData: keepPreviousData,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'charities'] })

  const createMutation = useMutation({
    mutationFn: (values: CharityForm) =>
      adminService.createCharity({
        email: values.email?.trim() ?? '',
        password: values.password ?? '',
        ...toPayload(values),
      }),
    onSuccess: () => {
      message.success('Đã tạo tài khoản tổ chức từ thiện')
      setCreating(false)
      void invalidate()
    },
    onError: (error) => message.error(toApiError(error).message),
  })

  const updateMutation = useMutation({
    mutationFn: (input: { id: string; values: CharityForm }) =>
      adminService.updateCharity(input.id, {
        ...toPayload(input.values),
        isActive: input.values.isActive,
      }),
    onSuccess: () => {
      message.success('Đã cập nhật tổ chức')
      setEditing(null)
      void invalidate()
    },
    onError: (error) => message.error(toApiError(error).message),
  })

  const toggleMutation = useMutation({
    mutationFn: (charity: CharityView) =>
      adminService.updateCharity(charity.id, { isActive: !charity.isActive }),
    onSuccess: () => {
      message.success('Đã cập nhật trạng thái')
      void invalidate()
    },
    onError: (error) => message.error(toApiError(error).message),
  })

  const columns: TableProps<CharityView>['columns'] = [
    {
      title: 'Tổ chức',
      dataIndex: 'organizationName',
      render: (_, row) => (
        <Space>
          <Avatar src={row.avatarUrl ?? undefined} shape="square">
            {row.organizationName.slice(0, 1)}
          </Avatar>
          <span>
            <div>{row.organizationName}</div>
            <small style={{ color: '#8c8c8c' }}>{row.address ?? '—'}</small>
          </span>
        </Space>
      ),
    },
    {
      title: 'Liên hệ',
      key: 'contact',
      render: (_, row) => (
        <span>
          <div>{row.email ?? row.account?.email ?? '—'}</div>
          <small style={{ color: '#8c8c8c' }}>{row.phone ?? '—'}</small>
        </span>
      ),
    },
    {
      title: 'Số dư',
      dataIndex: 'balance',
      width: 130,
      align: 'right',
      render: (value: number) => formatMoney(value),
    },
    {
      title: 'Đã quyên góp',
      key: 'stats',
      width: 200,
      render: (_, row) => (
        <span>
          <div>{formatMoney(row.stats.raised)}</div>
          <small style={{ color: '#8c8c8c' }}>
            {formatNumber(row.stats.donations)} lượt · {formatNumber(row.stats.donors)} người
          </small>
        </span>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      width: 130,
      render: (value: boolean) =>
        value ? <Tag color="green">Hoạt động</Tag> : <Tag color="red">Đã khoá</Tag>,
    },
    {
      title: 'Tạo lúc',
      dataIndex: 'createdAt',
      width: 150,
      render: (value: string) => formatDateTime(value),
    },
    {
      title: '',
      key: 'actions',
      width: 150,
      render: (_, row) => (
        <Space>
          <Button
            size="small"
            onClick={() => {
              setEditing(row)
              form.setFieldsValue({
                organizationName: row.organizationName,
                information: row.information ?? '',
                address: row.address ?? '',
                contactEmail: row.email ?? '',
                phone: row.phone ?? '',
                avatarUrl: row.avatarUrl ?? '',
                isActive: row.isActive,
              })
            }}
          >
            Sửa
          </Button>
          <Popconfirm
            title={row.isActive ? 'Khoá tổ chức này?' : 'Mở khoá tổ chức này?'}
            okText="Đồng ý"
            cancelText="Huỷ"
            onConfirm={() => toggleMutation.mutate(row)}
          >
            <Button size="small" danger={row.isActive}>
              {row.isActive ? 'Khoá' : 'Mở khoá'}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Tổ chức từ thiện"
        description="Tạo tài khoản tổ chức, cập nhật hồ sơ và trạng thái hoạt động"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setCreating(true)
              form.resetFields()
              form.setFieldsValue({ isActive: true })
            }}
          >
            Thêm tổ chức
          </Button>
        }
      />

      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input.Search
            allowClear
            placeholder="Tên hoặc mô tả"
            style={{ width: 280 }}
            onSearch={(value) => {
              setQ(value.trim())
              setPage(1)
            }}
          />
          <Button icon={<ReloadOutlined />} onClick={() => void query.refetch()} loading={query.isFetching}>
            Làm mới
          </Button>
        </Space>
      </Card>

      {query.isError ? (
        <Alert type="error" showIcon title={toApiError(query.error).message} style={{ marginBottom: 16 }} />
      ) : null}

      <Card>
        <Table<CharityView>
          rowKey="id"
          loading={query.isLoading}
          dataSource={query.data?.items ?? []}
          columns={columns}
          scroll={{ x: 1100 }}
          pagination={{
            current: query.data?.meta.page ?? page,
            pageSize: query.data?.meta.pageSize ?? pageSize,
            total: query.data?.meta.total ?? 0,
            showSizeChanger: true,
            showTotal: (total) => `${formatNumber(total)} tổ chức`,
            onChange: (nextPage, nextSize) => {
              setPage(nextPage)
              setPageSize(nextSize)
            },
          }}
        />
      </Card>

      <Modal
        title="Thêm tổ chức từ thiện"
        open={creating}
        onCancel={() => setCreating(false)}
        onOk={() => {
          void form.validateFields().then((values) => createMutation.mutate(values))
        }}
        confirmLoading={createMutation.isPending}
        destroyOnHidden
        width={560}
      >
        <Form<CharityForm> form={form} layout="vertical" preserve={false}>
          <Typography.Text type="secondary">
            Tài khoản đăng nhập sẽ được tạo cùng hồ sơ tổ chức.
          </Typography.Text>
          <Form.Item
            name="email"
            label="Email đăng nhập"
            rules={[
              { required: true, message: 'Nhập email' },
              { type: 'email', message: 'Email không hợp lệ' },
            ]}
            style={{ marginTop: 12 }}
          >
            <Input placeholder="charity@playtogether.local" autoComplete="off" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[
              { required: true, message: 'Nhập mật khẩu' },
              { min: 8, message: 'Ít nhất 8 ký tự' },
              {
                pattern: /^(?=.*[A-Za-z])(?=.*\d).+$/,
                message: 'Phải có cả chữ và số',
              },
            ]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Form.Item
            name="organizationName"
            label="Tên tổ chức"
            rules={[{ required: true, min: 2, max: 150, message: 'Nhập tên tổ chức' }]}
          >
            <Input maxLength={150} />
          </Form.Item>
          <Form.Item name="information" label="Giới thiệu">
            <Input.TextArea rows={3} maxLength={5000} />
          </Form.Item>
          <Form.Item name="address" label="Địa chỉ">
            <Input maxLength={200} />
          </Form.Item>
          <Form.Item name="contactEmail" label="Email liên hệ" rules={[{ type: 'email', message: 'Email không hợp lệ' }]}>
            <Input maxLength={255} />
          </Form.Item>
          <Form.Item name="phone" label="Số điện thoại">
            <Input maxLength={20} />
          </Form.Item>
          <Form.Item name="avatarUrl" label="Ảnh đại diện (URL)" rules={[{ type: 'url', message: 'URL không hợp lệ' }]}>
            <Input maxLength={1000} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`Cập nhật ${editing?.organizationName ?? ''}`}
        open={editing !== null}
        onCancel={() => setEditing(null)}
        onOk={() => {
          void form.validateFields().then((values) => {
            if (editing) updateMutation.mutate({ id: editing.id, values })
          })
        }}
        confirmLoading={updateMutation.isPending}
        destroyOnHidden
        width={560}
      >
        <Form<CharityForm> form={form} layout="vertical" preserve={false}>
          <Form.Item
            name="organizationName"
            label="Tên tổ chức"
            rules={[{ required: true, min: 2, max: 150, message: 'Nhập tên tổ chức' }]}
          >
            <Input maxLength={150} />
          </Form.Item>
          <Form.Item name="information" label="Giới thiệu">
            <Input.TextArea rows={3} maxLength={5000} />
          </Form.Item>
          <Form.Item name="address" label="Địa chỉ">
            <Input maxLength={200} />
          </Form.Item>
          <Form.Item name="contactEmail" label="Email liên hệ" rules={[{ type: 'email', message: 'Email không hợp lệ' }]}>
            <Input maxLength={255} />
          </Form.Item>
          <Form.Item name="phone" label="Số điện thoại">
            <Input maxLength={20} />
          </Form.Item>
          <Form.Item name="avatarUrl" label="Ảnh đại diện (URL)" rules={[{ type: 'url', message: 'URL không hợp lệ' }]}>
            <Input maxLength={1000} />
          </Form.Item>
          <Form.Item name="isActive" label="Đang hoạt động" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
