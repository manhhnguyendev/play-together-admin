import { ArrowLeftOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { Alert, Button, Card, Descriptions, Progress, Space, Table, Tag, Typography } from 'antd'
import type { TableProps } from 'antd'
import { Link, useParams } from 'react-router-dom'
import { opsService } from '@/api/admin'
import { opsKeys } from '@/api/keys'
import type { AdminOrderRowDto, BehaviorHistoryItemDto } from '@/api/types'
import { PageHeader } from '@/components/PageHeader'
import { QueryError } from '@/components/QueryError'
import { StatusTag } from '@/components/StatusTag'
import { canOpenSection, tierOf } from '@/auth/permissions'
import { useAdminStore } from '@/auth/store'
import { formatDateTime, formatMoney, formatNumber } from '@/lib/format'
import {
  BEHAVIOR_EVENT_LABELS,
  CLOSE_REASON_LABELS,
  USER_ROLE_LABELS,
  adminTierLabel,
  formatBasisPoints,
  labelOf,
} from '@/lib/labels'

export default function UserDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const tier = tierOf(useAdminStore((state) => state.user))

  const query = useQuery({
    queryKey: opsKeys.user(id),
    queryFn: () => opsService.user(id),
    enabled: id.length > 0,
    retry: false,
  })

  if (query.error) {
    return (
      <>
        <PageHeader title="Tài khoản" extra={<BackToUsers />} />
        <QueryError error={query.error} />
      </>
    )
  }

  if (!query.data) return <Card loading={query.isLoading} />

  const { account, behavior, wallet, orders, moderation } = query.data

  return (
    <>
      <PageHeader
        title={account.name}
        description={`${account.email ?? 'Không có email'} · tham gia ${formatDateTime(account.createdAt)}`}
        extra={<BackToUsers />}
      />

      {!account.isActive ? (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          title="Tài khoản đang bị khoá"
          description="Người này không thể đăng nhập; các phiên còn dở của họ đã bị dừng."
        />
      ) : null}

      <Card style={{ marginBottom: 16 }}>
        <Descriptions
          column={2}
          size="small"
          items={[
            {
              key: 'role',
              label: 'Vai trò',
              children: <Tag>{labelOf(USER_ROLE_LABELS, account.role)}</Tag>,
            },
            {
              key: 'tier',
              label: 'Quyền vận hành',
              children: account.role === 'ADMIN' ? adminTierLabel(account.adminRole) : '—',
            },
            {
              key: 'presence',
              label: 'Trạng thái',
              children: (
                <Space size={4}>
                  <StatusTag status={account.status} />
                  {account.isActive ? null : <Tag color="red">Đã khoá</Tag>}
                </Space>
              ),
            },
            {
              key: 'playerMode',
              label: 'Nhận thuê',
              children: account.isPlayer ? 'Bật' : 'Tắt',
            },
            {
              key: 'city',
              label: 'Khu vực',
              children: account.city ?? '—',
            },
            {
              key: 'price',
              label: 'Giá mỗi giờ',
              children: formatMoney(account.pricePerHour),
            },
            {
              key: 'rating',
              label: 'Đánh giá trung bình',
              children: `${account.rating.toFixed(1)}/5 (${formatNumber(account.ratingCount)})`,
            },
            {
              key: 'ranking',
              label: 'Điểm xếp hạng',
              children: formatNumber(account.rankingPoints),
            },
            {
              key: 'id',
              label: 'Mã tài khoản',
              children: (
                <Typography.Text copyable style={{ fontSize: 12 }}>
                  {account.id}
                </Typography.Text>
              ),
            },
          ]}
        />
      </Card>

      <Card title="Điểm hành vi" style={{ marginBottom: 16 }}>
        <Space size={40} wrap style={{ marginBottom: 16 }}>
          <BehaviourBar label="Điểm hành vi" value={behavior.points} />
          <BehaviourBar label="Điểm hài lòng" value={behavior.satisfaction} />
        </Space>
        <Table<BehaviorHistoryItemDto>
          rowKey="id"
          size="small"
          pagination={false}
          dataSource={behavior.history}
          locale={{ emptyText: 'Chưa có biến động điểm nào' }}
          columns={[
            {
              title: 'Sự kiện',
              dataIndex: 'event',
              render: (value: string) => labelOf(BEHAVIOR_EVENT_LABELS, value),
            },
            {
              title: 'Loại điểm',
              dataIndex: 'pointType',
              width: 140,
              render: (value: string) => (value === 'POINTS' ? 'Hành vi' : 'Hài lòng'),
            },
            {
              title: 'Thay đổi',
              dataIndex: 'amount',
              width: 110,
              align: 'right',
              render: (value: number, row) => (
                <span style={{ color: row.operation === 'SUB' ? '#cf1322' : '#389e0d' }}>
                  {row.operation === 'SUB' ? '−' : '+'}
                  {value}
                </span>
              ),
            },
            { title: 'Ghi chú', dataIndex: 'note', render: (value: string | null) => value ?? '—' },
            { title: 'Lúc', dataIndex: 'createdAt', width: 170, render: (value: string) => formatDateTime(value) },
          ]}
        />
      </Card>

      <Card title="Tiền" style={{ marginBottom: 16 }}>
        {wallet ? (
          <Descriptions
            column={2}
            size="small"
            items={[
              {
                key: 'available',
                label: 'Dùng được',
                children: formatMoney(wallet.availableBalance),
              },
              {
                key: 'pending',
                label: 'Chưa tới hạn nhả',
                children: `${formatMoney(wallet.pendingAmount)} (${wallet.pendingCount} khoản)`,
              },
              {
                key: 'updated',
                label: 'Cập nhật lúc',
                children: formatDateTime(wallet.updatedAt),
              },
              {
                key: 'withdrawals',
                label: 'Yêu cầu rút đang chờ',
                children: `${moderation.pendingWithdrawals} yêu cầu · ${formatMoney(moderation.pendingWithdrawalAmount)}`,
              },
            ]}
          />
        ) : (
          <Alert type="info" showIcon title="Tài khoản này chưa có ví" />
        )}
      </Card>

      <Card
        title="Đơn thuê"
        style={{ marginBottom: 16 }}
        extra={
          canOpenSection(tier, '/orders') ? (
            <Space size={8}>
              <Link to={`/orders?hirerId=${account.id}`}>Xem đơn đã thuê</Link>
              <Link to={`/orders?playerId=${account.id}`}>Xem đơn đã chơi</Link>
            </Space>
          ) : null
        }
      >
        <Space size={32} wrap style={{ marginBottom: 16 }}>
          <Typography.Text>Đã thuê: {formatNumber(orders.asHirer)}</Typography.Text>
          <Typography.Text>Đã chơi: {formatNumber(orders.asPlayer)}</Typography.Text>
          <Typography.Text>Còn mở: {formatNumber(orders.open)}</Typography.Text>
        </Space>
        <Table<AdminOrderRowDto>
          rowKey="id"
          size="small"
          pagination={false}
          dataSource={orders.recent}
          locale={{ emptyText: 'Tài khoản này chưa có đơn nào' }}
          columns={[
            {
              title: 'Bên còn lại',
              dataIndex: ['hirer', 'name'],
              render: (_, row) => (row.hirer.id === account.id ? row.player.name : row.hirer.name),
            },
            {
              title: 'Game',
              dataIndex: 'games',
              render: (_, row) => row.games.map((game) => game.name).join(', ') || '—',
            },
            {
              title: 'Trạng thái',
              dataIndex: 'status',
              width: 160,
              render: (_, row) => (
                <Space size={4} direction="vertical">
                  <StatusTag status={row.status} />
                  {row.closeReason ? (
                    <small style={{ color: '#8c8c8c' }}>{labelOf(CLOSE_REASON_LABELS, row.closeReason)}</small>
                  ) : null}
                </Space>
              ),
            },
            {
              title: 'Khách trả',
              dataIndex: 'totalPrice',
              width: 140,
              align: 'right',
              render: (value: number, row) => (
                <Space size={4} direction="vertical">
                  <span>{formatMoney(value)}</span>
                  <small style={{ color: '#8c8c8c' }}>phí {formatBasisPoints(row.feeBps)}</small>
                </Space>
              ),
            },
            {
              title: 'Tạo lúc',
              dataIndex: 'createdAt',
              width: 170,
              render: (value: string) => formatDateTime(value),
            },
            {
              title: '',
              key: 'actions',
              width: 100,
              render: (_, row) =>
                canOpenSection(tier, '/orders') ? (
                  <Link to={`/orders/${row.id}`}>
                    <Button size="small">Chi tiết</Button>
                  </Link>
                ) : null,
            },
          ] satisfies TableProps<AdminOrderRowDto>['columns']}
        />
      </Card>

      <Card title="Nội dung đang chờ kiểm duyệt">
        <Descriptions
          column={2}
          size="small"
          items={[
            {
              key: 'openReports',
              label: 'Báo cáo nhắm vào tài khoản',
              children: formatNumber(moderation.openReportsAgainst),
            },
            {
              key: 'filed',
              label: 'Báo cáo tài khoản này đã gửi',
              children: formatNumber(moderation.reportsFiled),
            },
            {
              key: 'flagged',
              label: 'Đánh giá nhận đang bị gắn cờ',
              children: formatNumber(moderation.flaggedRatings),
            },
            {
              key: 'orders',
              label: 'Đơn chưa chốt tiền',
              children: formatNumber(orders.open),
            },
          ]}
        />
      </Card>
    </>
  )
}

function BehaviourBar({ label, value }: { label: string; value: number }) {
  return (
    <Space size={6} direction="vertical">
      <Typography.Text type="secondary">{label}</Typography.Text>
      <Progress
        percent={value}
        showInfo
        status={value < 50 ? 'exception' : 'normal'}
        strokeColor={value < 50 ? '#cf1322' : '#52c41a'}
        style={{ width: 220 }}
      />
    </Space>
  )
}

function BackToUsers() {
  const tier = tierOf(useAdminStore((state) => state.user))
  // The list of every account is the moderator's page; a finance operator who
  // arrived from an order or a payout has somewhere else to go back to.
  if (!canOpenSection(tier, '/users')) return null

  return (
    <Link to="/users">
      <Button icon={<ArrowLeftOutlined />}>Danh sách tài khoản</Button>
    </Link>
  )
}
