import { EditOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd'
import type { TableProps } from 'antd'
import { useState } from 'react'
import { adminService } from '@/api/admin'
import { adminKeys, publicConfigKey } from '@/api/keys'
import type { ResolvedConfig } from '@/api/types'
import { PageHeader } from '@/components/PageHeader'
import { QueryError } from '@/components/QueryError'
import { useApiMutation } from '@/hooks/useApiMutation'
import { trimOrUndefined } from '@/lib/forms'
import { formatDateTime, formatNumber } from '@/lib/format'

interface ConfigForm {
  title: string
  value: number
  description?: string
}

interface CreateConfigForm extends ConfigForm {
  key: string
  no: number
}

const CONFIG_KEYS = [adminKeys.configs, publicConfigKey]

export default function ConfigsPage() {
  const [editing, setEditing] = useState<ResolvedConfig | null>(null)
  const [creating, setCreating] = useState(false)
  const [editForm] = Form.useForm<ConfigForm>()
  const [createForm] = Form.useForm<CreateConfigForm>()

  const query = useQuery({ queryKey: adminKeys.configs, queryFn: adminService.configs })

  const updateMutation = useApiMutation({
    mutationFn: (input: { id: string; values: ConfigForm }) =>
      adminService.updateConfig(input.id, {
        title: input.values.title.trim(),
        value: input.values.value,
        description: trimOrUndefined(input.values.description),
      }),
    successMessage: 'Đã cập nhật cấu hình',
    invalidate: CONFIG_KEYS,
    onSuccess: () => setEditing(null),
  })

  const createMutation = useApiMutation({
    mutationFn: (values: CreateConfigForm) =>
      adminService.createConfig({
        key: values.key.trim(),
        no: values.no,
        title: values.title.trim(),
        value: values.value,
        description: trimOrUndefined(values.description),
      }),
    successMessage: 'Đã thêm cấu hình',
    invalidate: CONFIG_KEYS,
    onSuccess: () => setCreating(false),
  })

  const deleteMutation = useApiMutation({
    mutationFn: (id: string) => adminService.deleteConfig(id),
    successMessage: 'Đã xoá cấu hình',
    invalidate: CONFIG_KEYS,
  })

  const deletingId = deleteMutation.isPending ? deleteMutation.variables : undefined

  const startCreate = (row?: ResolvedConfig) => {
    setCreating(true)
    createForm.resetFields()
    createForm.setFieldsValue(
      row
        ? {
            key: row.key,
            title: row.title,
            value: row.value,
            description: row.description ?? '',
          }
        : { value: 0 },
    )
  }

  const columns: TableProps<ResolvedConfig>['columns'] = [
    {
      title: 'Khoá',
      dataIndex: 'key',
      width: 260,
      render: (value: string) => <Typography.Text code>{value}</Typography.Text>,
    },
    {
      title: 'Cấu hình',
      dataIndex: 'title',
      render: (_, row) => (
        <span>
          <div>{row.title}</div>
          <small style={{ color: '#8c8c8c' }}>{row.description ?? '—'}</small>
        </span>
      ),
    },
    {
      title: 'Giá trị',
      dataIndex: 'value',
      width: 110,
      align: 'right',
      render: (value: number) => <Typography.Text strong>{formatNumber(value)}</Typography.Text>,
    },
    {
      title: 'Nguồn',
      dataIndex: 'id',
      width: 130,
      render: (value: string | null) => (value ? <Tag color="blue">Bản ghi</Tag> : <Tag>Mặc định</Tag>),
    },
    {
      title: 'Cập nhật',
      dataIndex: 'updatedAt',
      width: 150,
      render: (value: string, row) => (row.id ? formatDateTime(value) : '—'),
    },
    {
      title: '',
      key: 'actions',
      width: 150,
      render: (_, row) =>
        row.id ? (
          <Space>
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                setEditing(row)
                editForm.setFieldsValue({
                  title: row.title,
                  value: row.value,
                  description: row.description ?? '',
                })
              }}
            />
            <Popconfirm
              title="Xoá cấu hình này?"
              description="Cấu hình lõi không thể xoá, chỉ có thể sửa."
              okText="Xoá"
              cancelText="Huỷ"
              okButtonProps={{ danger: true }}
              onConfirm={() => deleteMutation.mutate(row.id as string)}
            >
              <Button size="small" danger loading={deletingId === row.id}>
                Xoá
              </Button>
            </Popconfirm>
          </Space>
        ) : (
          <Button size="small" icon={<PlusOutlined />} onClick={() => startCreate(row)}>
            Tạo bản ghi
          </Button>
        ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Cấu hình"
        description="Giá trị vận hành của hệ thống. Bật/tắt bảo trì nhanh ở trang Bảo trì."
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => startCreate()}
          >
            Thêm cấu hình
          </Button>
        }
      />

      <QueryError error={query.error} />

      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Button icon={<ReloadOutlined />} onClick={() => void query.refetch()} loading={query.isFetching}>
            Làm mới
          </Button>
          <Typography.Text type="secondary">
            Cấu hình lõi được tạo sẵn bởi seed; có thể chỉnh sửa giá trị nhưng không xoá được.
          </Typography.Text>
        </Space>

        <Table<ResolvedConfig>
          rowKey="key"
          loading={query.isLoading}
          dataSource={query.data ?? []}
          columns={columns}
          pagination={false}
          scroll={{ x: 960 }}
        />
      </Card>

      <Modal
        title={`Cập nhật ${editing?.key ?? ''}`}
        open={editing !== null}
        onCancel={() => setEditing(null)}
        onOk={() => {
          void editForm.validateFields().then((values) => {
            if (editing?.id) updateMutation.mutate({ id: editing.id, values })
          })
        }}
        confirmLoading={updateMutation.isPending}
        destroyOnHidden
      >
        <Form<ConfigForm> form={editForm} layout="vertical" preserve={false}>
          <Form.Item name="title" label="Tiêu đề" rules={[{ required: true, min: 2, max: 150 }]}>
            <Input maxLength={150} />
          </Form.Item>
          <Form.Item name="value" label="Giá trị" rules={[{ required: true, message: 'Nhập giá trị' }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} maxLength={1000} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Thêm cấu hình"
        open={creating}
        onCancel={() => setCreating(false)}
        onOk={() => {
          void createForm.validateFields().then((values) => createMutation.mutate(values))
        }}
        confirmLoading={createMutation.isPending}
        destroyOnHidden
      >
        <Form<CreateConfigForm> form={createForm} layout="vertical" preserve={false}>
          <Form.Item
            name="key"
            label="Khoá"
            rules={[
              { required: true, message: 'Nhập khoá' },
              {
                pattern: /^[a-z][a-z0-9_.]{2,99}$/,
                message: 'Chữ thường, cách nhau bằng dấu chấm',
              },
            ]}
            extra="Ví dụ: order.reminder_minutes"
          >
            <Input maxLength={100} />
          </Form.Item>
          <Form.Item
            name="no"
            label="Thứ tự"
            rules={[{ required: true, message: 'Nhập thứ tự' }]}
            extra="Chọn số thứ tự chưa dùng (1–1000)"
          >
            <InputNumber min={1} max={1000} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="title" label="Tiêu đề" rules={[{ required: true, min: 2, max: 150 }]}>
            <Input maxLength={150} />
          </Form.Item>
          <Form.Item name="value" label="Giá trị" rules={[{ required: true, message: 'Nhập giá trị' }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} maxLength={1000} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
