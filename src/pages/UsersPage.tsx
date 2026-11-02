import { Avatar, Button, Card, Form, Input, InputNumber, Modal, Select, Space, Switch, Table, Tag } from 'antd'
import type { TableProps } from 'antd'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { adminService } from '@/api/admin'
import { adminKeys } from '@/api/keys'
import {
  ADMIN_TIERS,
  USER_ROLES,
  USER_STATUSES,
  type AdminTier,
  type Role,
  type UserStatus,
  type UserSummary,
} from '@/api/types'
import { ConfirmReasonModal } from '@/components/ConfirmReasonModal'
import { PageHeader } from '@/components/PageHeader'
import { QueryError } from '@/components/QueryError'
import { StatusTag } from '@/components/StatusTag'
import { canOpenDossier, tierOf } from '@/auth/permissions'
import { useAdminStore } from '@/auth/store'
import { useApiMutation } from '@/hooks/useApiMutation'
import { usePagedQuery } from '@/hooks/usePagedQuery'
import { formatDateTime, formatMoney, formatNumber } from '@/lib/format'
import { ADMIN_TIER_LABELS, USER_ROLE_LABELS, adminTierLabel, optionsFor, statusOptions } from '@/lib/labels'

const FILTERS = ['q', 'role', 'active', 'player'] as const

const ROLE_OPTIONS = optionsFor(USER_ROLES, USER_ROLE_LABELS)
const PRESENCE_OPTIONS = statusOptions(USER_STATUSES)
const TIER_OPTIONS = [
  { value: '', label: 'Không giao quyền vận hành' },
  ...optionsFor(ADMIN_TIERS, ADMIN_TIER_LABELS),
]

interface EditForm {
  role: Role
  adminRole: AdminTier | ''
  status: UserStatus
  isPlayer: boolean
  isActive: boolean
  reason: string
}

interface BehaviorForm {
  points: number
  satisfaction: number
  note: string
}

interface LockTarget {
  user: UserSummary
  next: boolean
}

export default function UsersPage() {
  const viewer = useAdminStore((state) => state.user)
  const viewerTier = tierOf(viewer)

  const [editing, setEditing] = useState<UserSummary | null>(null)
  const [behaviorTarget, setBehaviorTarget] = useState<UserSummary | null>(null)
  const [lockTarget, setLockTarget] = useState<LockTarget | null>(null)
  const [editForm] = Form.useForm<EditForm>()
  const [behaviorForm] = Form.useForm<BehaviorForm>()

  const { query, pagination, filters, setFilter, clearFilters } = usePagedQuery<
    UserSummary,
    (typeof FILTERS)[number]
  >({
    key: [...adminKeys.users],
    filterNames: FILTERS,
    fetcher: ({ page, pageSize, filters: f }) =>
      adminService.users({
        page,
        pageSize,
        q: f.q,
        role: f.role as Role | undefined,
        isActive: f.active as 'true' | 'false' | undefined,
        isPlayer: f.player as 'true' | 'false' | undefined,
      }),
    totalLabel: (total) => `${formatNumber(total)} tài khoản`,
  })

  // The search box holds its own text so typing does not fire a request per keystroke.
  const [keyword, setKeyword] = useState(filters.q ?? '')

  const updateMutation = useApiMutation({
    mutationFn: (input: { id: string; body: EditForm }) =>
      adminService.updateUser(input.id, {
        role: input.body.role,
        status: input.body.status,
        isPlayer: input.body.isPlayer,
        isActive: input.body.isActive,
        // An empty choice clears the tier; a non-admin never carries one.
        adminRole: input.body.role === 'ADMIN' ? (input.body.adminRole || null) : null,
        reason: input.body.reason.trim(),
      }),
    successMessage: 'Đã cập nhật tài khoản',
    invalidate: [adminKeys.users, adminKeys.stats],
    onSuccess: () => setEditing(null),
  })

  const lockMutation = useApiMutation({
    mutationFn: (input: { user: UserSummary; reason: string }) =>
      adminService.updateUser(input.user.id, {
        // Only the lock moves; the roles and the presence state stay as they are.
        isActive: !input.user.isActive,
        reason: input.reason,
      }),
    successMessage: 'Đã đổi trạng thái khoá',
    invalidate: [adminKeys.users, adminKeys.stats],
    onSuccess: () => setLockTarget(null),
  })

  const behaviorMutation = useApiMutation({
    mutationFn: (input: { id: string; body: BehaviorForm }) =>
      adminService.adjustBehavior(input.id, { ...input.body, note: input.body.note.trim() }),
    successMessage: 'Đã điều chỉnh điểm',
    invalidate: [adminKeys.users],
    onSuccess: () => setBehaviorTarget(null),
  })

  const editingRole = Form.useWatch('role', editForm)

  const columns: TableProps<UserSummary>['columns'] = [
    {
      title: 'Người dùng',
      dataIndex: 'name',
      render: (_, user) => (
        <Space>
          <Avatar src={user.avatarUrl ?? undefined}>{user.name.slice(0, 1)}</Avatar>
          <span>
            <div>
              {canOpenDossier(viewerTier) ? <Link to={`/users/${user.id}`}>{user.name}</Link> : user.name}
            </div>
            <small style={{ color: '#8c8c8c' }}>{user.email ?? '—'}</small>
          </span>
        </Space>
      ),
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      width: 130,
      render: (value: Role) => <Tag>{USER_ROLE_LABELS[value]}</Tag>,
    },
    {
      title: 'Quyền vận hành',
      dataIndex: 'adminRole',
      width: 150,
      render: (value: AdminTier | null | undefined, user) =>
        user.role === 'ADMIN' ? adminTierLabel(value) : '—',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 150,
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
      width: 110,
      render: (value: boolean) => (value ? <Tag color="green">Có</Tag> : '—'),
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
      width: 230,
      fixed: 'right',
      render: (_, user) => (
        <Space>
          <Button
            size="small"
            onClick={() => {
              setEditing(user)
            }}
          >
            Sửa
          </Button>
          <Button
            size="small"
            onClick={() => {
              setBehaviorTarget(user)
            }}
          >
            Điểm
          </Button>
          <Button
            size="small"
            danger={user.isActive}
            disabled={user.id === viewer?.id}
            title={user.id === viewer?.id ? 'Bạn không tự khoá được tài khoản của mình' : undefined}
            onClick={() => setLockTarget({ user, next: !user.isActive })}
          >
            {user.isActive ? 'Khoá' : 'Mở khoá'}
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <>
      <PageHeader title="Tài khoản" description="Tìm kiếm, phân quyền vận hành và khoá tài khoản" />

      <Card style={{ marginBottom: 16 }}>
        <Space wrap size={12}>
          <Input.Search
            allowClear
            placeholder="Tên hoặc email"
            style={{ width: 260 }}
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            onSearch={(value) => setFilter('q', value.trim() || null)}
          />
          <Select
            allowClear
            placeholder="Vai trò"
            style={{ width: 160 }}
            value={filters.role}
            onChange={(value) => setFilter('role', value)}
            options={ROLE_OPTIONS}
          />
          <Select
            allowClear
            placeholder="Kích hoạt"
            style={{ width: 160 }}
            value={filters.active}
            onChange={(value) => setFilter('active', value)}
            options={[
              { value: 'true', label: 'Đang hoạt động' },
              { value: 'false', label: 'Đã khoá' },
            ]}
          />
          <Select
            allowClear
            placeholder="Chế độ người chơi"
            style={{ width: 180 }}
            value={filters.player}
            onChange={(value) => setFilter('player', value)}
            options={[
              { value: 'true', label: 'Đang nhận thuê' },
              { value: 'false', label: 'Không nhận thuê' },
            ]}
          />
          <Button type="text" onClick={clearFilters}>
            Xoá bộ lọc
          </Button>
        </Space>
      </Card>

      <QueryError error={query.error} />

      <Card>
        <Table<UserSummary>
          rowKey="id"
          loading={query.isLoading}
          dataSource={query.data?.items ?? []}
          columns={columns}
          scroll={{ x: 1300 }}
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
        <Form<EditForm>
          form={editForm}
          layout="vertical"
          preserve={false}
          initialValues={editing ? editValuesOf(editing) : undefined}
        >
          <Form.Item
            name="role"
            label="Vai trò"
            rules={[{ required: true }]}
            extra={
              viewerTier === 'SUPER_ADMIN'
                ? 'Đổi sang Quản trị để tài khoản này vào được bảng điều khiển.'
                : 'Chỉ người có quyền cao nhất mới đổi được vai trò tài khoản.'
            }
          >
            <Select options={ROLE_OPTIONS} disabled={viewerTier !== 'SUPER_ADMIN'} />
          </Form.Item>
          {editingRole === 'ADMIN' ? (
            <Form.Item
              name="adminRole"
              label="Quyền vận hành"
              rules={[{ required: true, message: 'Chọn quyền vận hành' }]}
              extra={
                viewerTier === 'SUPER_ADMIN'
                  ? 'Chỉ người có quyền cao nhất mới đổi được ô này; API sẽ từ chối nếu không.'
                  : 'Bạn không có quyền đổi phân quyền.'
              }
            >
              <Select options={TIER_OPTIONS} disabled={viewerTier !== 'SUPER_ADMIN'} />
            </Form.Item>
          ) : null}
          <Form.Item name="status" label="Trạng thái hiện diện" rules={[{ required: true }]}>
            <Select options={PRESENCE_OPTIONS} />
          </Form.Item>
          <Form.Item name="isPlayer" label="Cho phép nhận thuê" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="isActive" label="Tài khoản hoạt động" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item
            name="reason"
            label="Lý do thay đổi"
            rules={[{ required: true, min: 3, max: 500, message: 'Nêu lý do từ 3 đến 500 ký tự' }]}
            extra="Nhật ký thao tác lưu lại lý do này kèm tên người sửa."
          >
            <Input.TextArea rows={2} maxLength={500} showCount placeholder="Khách hàng khiếu nại, đã xác minh" />
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
        <Form<BehaviorForm>
          form={behaviorForm}
          layout="vertical"
          preserve={false}
          initialValues={{ points: 0, satisfaction: 0, note: '' }}
        >
          <Form.Item
            name="points"
            label="Điểm hành vi (-100..100)"
            rules={[{ required: true, type: 'number', message: 'Nhập 0 nếu bạn không đổi điểm hành vi' }]}
            extra="Số điểm cộng thêm; dùng số âm để trừ."
          >
            <InputNumber min={-100} max={100} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="satisfaction"
            label="Điểm hài lòng (-100..100)"
            rules={[{ required: true, type: 'number', message: 'Nhập 0 nếu bạn không đổi điểm hài lòng' }]}
          >
            <InputNumber min={-100} max={100} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="note"
            label="Ghi chú"
            rules={[{ required: true, min: 3, max: 500, message: 'Cần ghi rõ lý do điều chỉnh điểm' }]}
            extra="Cộng trừ điểm thủ công luôn cần lý do để đối chiếu sau này."
          >
            <Input.TextArea rows={3} maxLength={500} showCount />
          </Form.Item>
        </Form>
      </Modal>

      <ConfirmReasonModal
        open={lockTarget !== null}
        title={lockTarget?.next ? `Mở khoá ${lockTarget?.user.name ?? ''}?` : `Khoá ${lockTarget?.user.name ?? ''}?`}
        danger={!lockTarget?.next}
        loading={lockMutation.isPending}
        okText={lockTarget?.next ? 'Mở khoá' : 'Khoá tài khoản'}
        reasonLabel="Lý do"
        placeholder={
          lockTarget?.next ? 'Đã xác minh khiếu nại, cho hoạt động lại' : 'Nhiều báo cáo vi phạm, tạm khoá chờ xử lý'
        }
        description={
          lockTarget?.next ? (
            <span>
              Tài khoản sẽ đăng nhập lại được. Các phiên đang chạy của họ vẫn phải được mở bằng tay nếu cần.
            </span>
          ) : (
            <span>
              Khoá tài khoản khiến người này không đăng nhập được và mọi phiên đang chờ hoặc đang chạy sẽ bị dừng.
            </span>
          )
        }
        onCancel={() => setLockTarget(null)}
        onConfirm={(reason) => {
          if (lockTarget) lockMutation.mutate({ user: lockTarget.user, reason })
        }}
      />
    </>
  )
}

function editValuesOf(user: UserSummary): EditForm {
  return {
    role: user.role,
    adminRole: user.adminRole ?? '',
    status: user.status,
    isPlayer: user.isPlayer,
    isActive: user.isActive,
    reason: '',
  }
}
