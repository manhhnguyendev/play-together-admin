import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import {
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
import { adminKeys } from '@/api/keys'
import type { CharityView } from '@/api/types'
import { PageHeader } from '@/components/PageHeader'
import { QueryError } from '@/components/QueryError'
import { useApiMutation } from '@/hooks/useApiMutation'
import { usePagedQuery } from '@/hooks/usePagedQuery'
import { trimOrUndefined } from '@/lib/forms'
import { formatDateTime, formatMoney, formatNumber } from '@/lib/format'

interface CharityForm {
  organizationName: string
  information?: string
  address?: string
  contactEmail?: string
  phone?: string
  avatarUrl?: string
}

interface CreateCharityForm extends CharityForm {
  email: string
  password: string
}

interface EditCharityForm extends CharityForm {
  isActive: boolean
}

function profilePayload(values: CharityForm) {
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
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState<CharityView | null>(null)
  const [creating, setCreating] = useState(false)
  const [createForm] = Form.useForm<CreateCharityForm>()
  const [editForm] = Form.useForm<EditCharityForm>()

  const { query, pagination, resetPage } = usePagedQuery<CharityView>({
    key: [...adminKeys.charities, { q }],
    fetcher: ({ page, pageSize }) => adminService.charities({ page, pageSize, q: q || undefined }),
    totalLabel: (total) => `${formatNumber(total)} tổ chức`,
  })

  const createMutation = useApiMutation({
    mutationFn: (values: CreateCharityForm) =>
      adminService.createCharity({
        email: values.email.trim(),
        password: values.password,
        ...profilePayload(values),
      }),
    successMessage: 'Đã tạo tài khoản tổ chức từ thiện',
    invalidate: [adminKeys.charities],
    onSuccess: () => setCreating(false),
  })

  const updateMutation = useApiMutation({
    mutationFn: (input: { id: string; values: EditCharityForm }) =>
      adminService.updateCharity(input.id, {
        ...profilePayload(input.values),
        isActive: input.values.isActive,
      }),
    successMessage: 'Đã cập nhật tổ chức',
    invalidate: [adminKeys.charities],
    onSuccess: () => setEditing(null),
  })

  const toggleMutation = useApiMutation({
    mutationFn: (charity: CharityView) =>
      adminService.updateCharity(charity.id, { isActive: !charity.isActive }),
    successMessage: 'Đã cập nhật trạng thái',
    invalidate: [adminKeys.charities],
  })

  const togglingId = toggleMutation.isPending ? toggleMutation.variables?.id : undefined

  const openEdit = (charity: CharityView) => {
    setEditing(charity)
    editForm.setFieldsValue({
      organizationName: charity.organizationName,
      information: charity.information ?? '',
      address: charity.address ?? '',
      contactEmail: charity.email ?? '',
      phone: charity.phone ?? '',
      avatarUrl: charity.avatarUrl ?? '',
      isActive: charity.isActive,
    })
  }

  const openCreate = () => {
    setCreating(true)
    createForm.resetFields()
  }

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
          <Button size="small" onClick={() => openEdit(row)}>
            Sửa
          </Button>
          <Popconfirm
            title={row.isActive ? 'Khoá tổ chức này?' : 'Mở khoá tổ chức này?'}
            okText="Đồng ý"
            cancelText="Huỷ"
            onConfirm={() => toggleMutation.mutate(row)}
          >
            <Button size="small" danger={row.isActive} loading={togglingId === row.id}>
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
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
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
              resetPage()
            }}
          />
          <Button icon={<ReloadOutlined />} onClick={() => void query.refetch()} loading={query.isFetching}>
            Làm mới
          </Button>
        </Space>
      </Card>

      <QueryError error={query.error} />

      <Card>
        <Table<CharityView>
          rowKey="id"
          loading={query.isLoading}
          dataSource={query.data?.items ?? []}
          columns={columns}
          scroll={{ x: 1100 }}
          pagination={pagination}
        />
      </Card>

      <Modal
        title="Thêm tổ chức từ thiện"
        open={creating}
        onCancel={() => setCreating(false)}
        onOk={() => {
          void createForm.validateFields().then((values) => createMutation.mutate(values))
        }}
        confirmLoading={createMutation.isPending}
        destroyOnHidden
        width={560}
      >
        <Form<CreateCharityForm> form={createForm} layout="vertical" preserve={false}>
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
          <CharityProfileFields />
        </Form>
      </Modal>

      <Modal
        title={`Cập nhật ${editing?.organizationName ?? ''}`}
        open={editing !== null}
        onCancel={() => setEditing(null)}
        onOk={() => {
          void editForm.validateFields().then((values) => {
            if (editing) updateMutation.mutate({ id: editing.id, values })
          })
        }}
        confirmLoading={updateMutation.isPending}
        destroyOnHidden
        width={560}
      >
        <Form<EditCharityForm> form={editForm} layout="vertical" preserve={false}>
          <CharityProfileFields />
          <Form.Item name="isActive" label="Đang hoạt động" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

function CharityProfileFields() {
  return (
    <>
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
      <Form.Item
        name="contactEmail"
        label="Email liên hệ"
        rules={[{ type: 'email', message: 'Email không hợp lệ' }]}
      >
        <Input maxLength={255} />
      </Form.Item>
      <Form.Item name="phone" label="Số điện thoại">
        <Input maxLength={20} />
      </Form.Item>
      <Form.Item
        name="avatarUrl"
        label="Ảnh đại diện (URL)"
        rules={[{ type: 'url', message: 'URL không hợp lệ' }]}
      >
        <Input maxLength={1000} />
      </Form.Item>
    </>
  )
}
