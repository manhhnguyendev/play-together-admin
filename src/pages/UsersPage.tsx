import {
  Avatar,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Switch,
  Table,
  Tag,
} from 'antd'
import type { TableProps } from 'antd'
import { useState } from 'react'
import { adminService } from '@/api/admin'
import { adminKeys } from '@/api/keys'
import {
  USER_ROLES,
  USER_STATUSES,
  type Role,
  type UserStatus,
  type UserSummary,
} from '@/api/types'
import { PageHeader } from '@/components/PageHeader'
import { QueryError } from '@/components/QueryError'
import { StatusTag } from '@/components/StatusTag'
import { useApiMutation } from '@/hooks/useApiMutation'
import { usePagedQuery } from '@/hooks/usePagedQuery'
import { formatDateTime, formatMoney, formatNumber } from '@/lib/format'

const ROLE_COLORS: Record<Role, string> = { USER: 'blue', ADMIN: 'purple', CHARITY: 'magenta' }
const ROLE_OPTIONS = USER_ROLES.map((value) => ({ value, label: value }))
const STATUS_OPTIONS = USER_STATUSES.map((value) => ({ value, label: value }))

interface EditForm {
  role: Role
  status: UserStatus
  isPlayer: boolean
  isActive: boolean
}

interface BehaviorForm {
  points: number
  satisfaction: number
  note?: string
}

export default function UsersPage() {
  const [q, setQ] = useState('')
  const [role, setRole] = useState<Role | undefined>()
  const [active, setActive] = useState<'true' | 'false' | undefined>()
  const [player, setPlayer] = useState<'true' | 'false' | undefined>()

  const [editing, setEditing] = useState<UserSummary | null>(null)
  const [behaviorTarget, setBehaviorTarget] = useState<UserSummary | null>(null)
  const [editForm] = Form.useForm<EditForm>()
  const [behaviorForm] = Form.useForm<BehaviorForm>()

  const { query, pagination, resetPage } = usePagedQuery<UserSummary>({
    key: [...adminKeys.users, { q, role, active, player }],
    fetcher: ({ page, pageSize }) =>
      adminService.users({
        page,
        pageSize,
        q: q || undefined,
        role,
        isActive: active,
        isPlayer: player,
      }),
    totalLabel: (total) => `${formatNumber(total)} tài khoản`,
  })

  const updateMutation = useApiMutation({
    mutationFn: (input: { id: string; body: EditForm }) => adminService.updateUser(input.id, input.body),
    successMessage: 'Đã cập nhật tài khoản',
    invalidate: [adminKeys.users, adminKeys.stats],
    onSuccess: () => setEditing(null),
  })

  const behaviorMutation = useApiMutation({
    mutationFn: (input: { id: string; body: BehaviorForm }) =>
      adminService.adjustBehavior(input.id, input.body),
    successMessage: 'Đã điều chỉnh điểm',
    invalidate: [adminKeys.users],
    onSuccess: () => setBehaviorTarget(null),
  })

  const updatingId = updateMutation.isPending ? updateMutation.variables?.id : undefined

  const columns: TableProps<UserSummary>['columns'] = [
    {
      title: 'Người dùng',
      dataIndex: 'name',
      render: (_, user) => (
        <Space>
          <Avatar src={user.avatarUrl ?? undefined}>{user.name.slice(0, 1)}</Avatar>
          <span>
            <div>{user.name}</div>
            <small style={{ color: '#8c8c8c' }}>{user.email ?? '—'}</small>
          </span>
        </Space>
      ),
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      width: 110,
      render: (value: Role) => <Tag color={ROLE_COLORS[value]}>{value}</Tag>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 140,
      render: (value: string, user) => (
        <Space size={4}>
          <StatusTag status={value} />
          {user.isActive ? null : <Tag color="red">Đã khoá</Tag>}
        </Space>
      ),
    },
    {
      title: 'Người chơi',
      dataIndex: 'isPlayer',
      width: 100,
      render: (value: boolean) => (value ? <Tag color="green">Player</Tag> : '—'),
    },
    {
      title: 'Giá/giờ',
      dataIndex: 'pricePerHour',
      width: 110,
      align: 'right',
      render: (value: number) => formatMoney(value),
    },
    {
      title: 'Đánh giá',
      dataIndex: 'rating',
      width: 100,
      align: 'right',
      render: (value: number, user) => `${value.toFixed(1)} (${user.ratingCount})`,
    },
    {
      title: 'Đơn',
      dataIndex: 'ordersCount',
      width: 90,
      align: 'right',
      render: (value: number) => formatNumber(value),
    },
    {
      title: 'Tham gia',
      dataIndex: 'createdAt',
      width: 150,
      render: (value: string) => formatDateTime(value),
    },
    {
      title: '',
      key: 'actions',
      width: 210,
      render: (_, user) => (
        <Space>
          <Button
            size="small"
            onClick={() => {
              setEditing(user)
              editForm.setFieldsValue(editValuesOf(user))
            }}
          >
            Sửa
          </Button>
          <Button
            size="small"
            onClick={() => {
              setBehaviorTarget(user)
              behaviorForm.setFieldsValue({ points: 0, satisfaction: 0, note: '' })
            }}
          >
            Điểm
          </Button>
          <Button
            size="small"
            danger={user.isActive}
            loading={updatingId === user.id}
            onClick={() =>
              updateMutation.mutate({ id: user.id, body: { ...editValuesOf(user), isActive: !user.isActive } })
            }
          >
            {user.isActive ? 'Khoá' : 'Mở khoá'}
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <>
      <PageHeader title="Người dùng" description="Tìm kiếm, phân quyền và khoá tài khoản" />

      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input.Search
            allowClear
            placeholder="Tên hoặc email"
            style={{ width: 260 }}
            onSearch={(value) => {
              setQ(value.trim())
              resetPage()
            }}
          />
          <Select
            allowClear
            placeholder="Vai trò"
            style={{ width: 140 }}
            value={role}
            onChange={(value) => {
              setRole(value)
              resetPage()
            }}
            options={ROLE_OPTIONS}
          />
          <Select
            allowClear
            placeholder="Kích hoạt"
            style={{ width: 140 }}
            value={active}
            onChange={(value) => {
              setActive(value)
              resetPage()
            }}
            options={[
              { value: 'true', label: 'Đang hoạt động' },
              { value: 'false', label: 'Đã khoá' },
            ]}
          />
          <Select
            allowClear
            placeholder="Người chơi"
            style={{ width: 150 }}
            value={player}
            onChange={(value) => {
              setPlayer(value)
              resetPage()
            }}
            options={[
              { value: 'true', label: 'Có bật player' },
              { value: 'false', label: 'Không phải player' },
            ]}
          />
        </Space>
      </Card>

      <QueryError error={query.error} />

      <Card>
        <Table<UserSummary>
          rowKey="id"
          loading={query.isLoading}
          dataSource={query.data?.items ?? []}
          columns={columns}
          scroll={{ x: 1100 }}
          pagination={pagination}
        />
      </Card>

      <Modal
        title={`Cập nhật ${editing?.name ?? ''}`}
        open={editing !== null}
        onCancel={() => setEditing(null)}
        onOk={() => {
          void editForm.validateFields().then((values) => {
            if (editing) updateMutation.mutate({ id: editing.id, body: values })
          })
        }}
        confirmLoading={updateMutation.isPending}
        destroyOnHidden
      >
        <Form<EditForm> form={editForm} layout="vertical" preserve={false}>
          <Form.Item name="role" label="Vai trò" rules={[{ required: true }]}>
            <Select options={ROLE_OPTIONS} />
          </Form.Item>
          <Form.Item name="status" label="Trạng thái hiện diện" rules={[{ required: true }]}>
            <Select options={STATUS_OPTIONS} />
          </Form.Item>
          <Form.Item name="isPlayer" label="Bật chế độ người chơi" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="isActive" label="Tài khoản hoạt động" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`Điều chỉnh điểm · ${behaviorTarget?.name ?? ''}`}
        open={behaviorTarget !== null}
        onCancel={() => setBehaviorTarget(null)}
        onOk={() => {
          void behaviorForm.validateFields().then((values) => {
            if (behaviorTarget) behaviorMutation.mutate({ id: behaviorTarget.id, body: values })
          })
        }}
        confirmLoading={behaviorMutation.isPending}
        destroyOnHidden
      >
        <Form<BehaviorForm> form={behaviorForm} layout="vertical" preserve={false}>
          <Form.Item name="points" label="Điểm hành vi (-100..100)" rules={[{ required: true }]}>
            <InputNumber min={-100} max={100} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="satisfaction" label="Điểm hài lòng (-100..100)" rules={[{ required: true }]}>
            <InputNumber min={-100} max={100} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="note" label="Ghi chú">
            <Input.TextArea rows={3} maxLength={500} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

function editValuesOf(user: UserSummary): EditForm {
  return { role: user.role, status: user.status, isPlayer: user.isPlayer, isActive: user.isActive }
}
