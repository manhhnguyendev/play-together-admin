import { ReloadOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { Button, Card, Col, Row, Statistic, Table, Typography } from 'antd'
import { adminService } from '@/api/admin'
import { adminKeys } from '@/api/keys'
import type { PlatformOverview } from '@/api/types'
import { PageHeader } from '@/components/PageHeader'
import { QueryError } from '@/components/QueryError'
import { StatusTag } from '@/components/StatusTag'
import { formatMoney, formatNumber } from '@/lib/format'

type OrderRow = { status: string; count: number }

export default function DashboardPage() {
  const query = useQuery({
    queryKey: adminKeys.stats,
    queryFn: adminService.stats,
    refetchInterval: 60_000,
  })

  const stats: PlatformOverview | undefined = query.data
  const orderRows: OrderRow[] = Object.entries(stats?.orders.byStatus ?? {})
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count)

  return (
    <>
      <PageHeader
        title="Tổng quan nền tảng"
        description="Số liệu làm mới mỗi phút"
        extra={
          <Button icon={<ReloadOutlined />} onClick={() => void query.refetch()} loading={query.isFetching}>
            Làm mới
          </Button>
        }
      />

      <QueryError error={query.error} />

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} xl={6}>
          <Card loading={query.isLoading} title="Người dùng">
            <Statistic value={stats?.users.total ?? 0} formatter={(value) => formatNumber(Number(value))} />
            <Typography.Text type="secondary" style={{ display: 'block' }}>
              {formatNumber(stats?.users.active ?? 0)} hoạt động · {formatNumber(stats?.users.players ?? 0)} người chơi
            </Typography.Text>
            <Typography.Text type="secondary" style={{ display: 'block' }}>
              {formatNumber(stats?.users.charities ?? 0)} tổ chức từ thiện ·{' '}
              {formatNumber(stats?.users.admins ?? 0)} quản trị viên
            </Typography.Text>
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card loading={query.isLoading} title="Đơn thuê">
            <Statistic value={stats?.orders.total ?? 0} formatter={(value) => formatNumber(Number(value))} />
            <Typography.Text type="secondary">
              {formatNumber(stats?.orders.active ?? 0)} đang chạy · {formatNumber(stats?.orders.completed ?? 0)} hoàn thành
            </Typography.Text>
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card loading={query.isLoading} title="Dòng tiền">
            <Statistic
              value={stats?.money.escrowHeld ?? 0}
              formatter={(value) => formatMoney(Number(value))}
            />
            <Typography.Text type="secondary">
              Phí nền tảng {formatMoney(stats?.money.platformFees ?? 0)} · Quyên góp{' '}
              {formatMoney(stats?.money.donations ?? 0)}
            </Typography.Text>
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card loading={query.isLoading} title="Hàng chờ xử lý">
            <Statistic
              value={(stats?.moderation.pendingReports ?? 0) + (stats?.moderation.pendingFeedback ?? 0)}
            />
            <Typography.Text type="secondary">
              {formatNumber(stats?.moderation.pendingReports ?? 0)} báo cáo ·{' '}
              {formatNumber(stats?.moderation.pendingFeedback ?? 0)} feedback ·{' '}
              {formatNumber(stats?.moderation.flaggedRatings ?? 0)} đánh giá gắn cờ
            </Typography.Text>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} xl={12}>
          <Card title="Chi trả đang chờ" loading={query.isLoading}>
            <Statistic
              title="Người dùng"
              value={stats?.money.pendingUserWithdrawals ?? 0}
              formatter={(value) => formatNumber(Number(value))}
            />
            <Statistic
              title="Tổ chức từ thiện"
              value={stats?.money.pendingCharityWithdrawals ?? 0}
              formatter={(value) => formatNumber(Number(value))}
            />
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card title="Đơn theo trạng thái" loading={query.isLoading}>
            <Table<OrderRow>
              size="small"
              rowKey="status"
              dataSource={orderRows}
              pagination={false}
              columns={[
                { title: 'Trạng thái', dataIndex: 'status', render: (value: string) => <StatusTag status={value} /> },
                {
                  title: 'Số đơn',
                  dataIndex: 'count',
                  align: 'right',
                  render: (value: number) => formatNumber(value),
                },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </>
  )
}
