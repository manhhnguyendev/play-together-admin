import { ReloadOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { Button, Card, Col, Radio, Row, Space, Statistic, Table, Typography } from 'antd'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { adminService, opsService } from '@/api/admin'
import { adminKeys, opsKeys } from '@/api/keys'
import type { PlatformOverview } from '@/api/types'
import { PageHeader } from '@/components/PageHeader'
import { QueryError } from '@/components/QueryError'
import { StatusTag } from '@/components/StatusTag'
import { canOpenSection, tierOf } from '@/auth/permissions'
import { useAdminStore } from '@/auth/store'
import { formatMoney, formatNumber } from '@/lib/format'
import { formatBasisPoints } from '@/lib/labels'

type OrderRow = { status: string; count: number }

const PERIODS = [
  { value: 'today', label: 'Hôm nay', days: 0 },
  { value: 'week', label: '7 ngày qua', days: 6 },
  { value: 'month', label: '30 ngày qua', days: 29 },
] as const

/** Inclusive lower bound, snapped to local midnight so a day is never cut in half. */
const periodFrom = (days: number): string => {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - days).toISOString()
}

export default function DashboardPage() {
  const [period, setPeriod] = useState<(typeof PERIODS)[number]['value']>('today')
  const tier = tierOf(useAdminStore((state) => state.user))

  const query = useQuery({
    queryKey: adminKeys.stats,
    queryFn: adminService.stats,
    refetchInterval: 60_000,
  })

  const days = PERIODS.find((item) => item.value === period)?.days ?? 0
  const kpis = useQuery({
    queryKey: [...opsKeys.kpis, { period }],
    queryFn: () => opsService.kpis({ from: periodFrom(days) }),
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

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} xl={16}>
          <Card
            title="Trong kỳ"
            loading={kpis.isLoading}
            extra={
              <Radio.Group
                size="small"
                optionType="button"
                value={period}
                onChange={(event) => setPeriod(event.target.value)}
                options={PERIODS.map(({ value, label }) => ({ value, label }))}
              />
            }
          >
            <QueryError error={kpis.error} />
            <Row gutter={[16, 16]}>
              <Col xs={12} md={6}>
                <Statistic
                  title="Đơn tạo mới"
                  value={kpis.data?.orders.created ?? 0}
                  formatter={(value) => formatNumber(Number(value))}
                />
                <Typography.Text type="secondary">
                  {formatNumber(kpis.data?.orders.settled ?? 0)} hoàn tất ·{' '}
                  {formatNumber(kpis.data?.orders.endedEarly ?? 0)} kết thúc sớm (
                  {formatBasisPoints(kpis.data?.orders.endedEarlyRateBps ?? 0)})
                </Typography.Text>
              </Col>
              <Col xs={12} md={6}>
                <Statistic
                  title="Trả cho người chơi"
                  value={kpis.data?.money.playerPayouts ?? 0}
                  formatter={(value) => formatMoney(Number(value))}
                />
                <Typography.Text type="secondary">
                  Phí nền tảng {formatMoney(kpis.data?.money.platformFees ?? 0)}
                </Typography.Text>
              </Col>
              <Col xs={12} md={6}>
                <Statistic
                  title="Hoàn cho người thuê"
                  value={kpis.data?.money.refunds ?? 0}
                  formatter={(value) => formatMoney(Number(value))}
                />
                <Typography.Text type="secondary">
                  Nạp thành công {formatMoney(kpis.data?.money.depositsSucceeded ?? 0)}
                </Typography.Text>
              </Col>
              <Col xs={12} md={6}>
                <Statistic
                  title="Đánh giá trung bình"
                  value={kpis.data?.people.averageRating ?? 0}
                  precision={2}
                />
                <Typography.Text type="secondary">
                  {formatNumber(kpis.data?.people.ratingsCreated ?? 0)} đánh giá mới ·{' '}
                  {formatNumber(kpis.data?.people.activePlayers ?? 0)} người chơi hoạt động
                </Typography.Text>
              </Col>
            </Row>
            <Typography.Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0 }}>
              {kpis.data
                ? `Tính từ ${new Date(kpis.data.from).toLocaleString('vi-VN')} đến ${new Date(kpis.data.to).toLocaleString('vi-VN')}.`
                : ''}
            </Typography.Paragraph>
          </Card>
        </Col>

        <Col xs={24} xl={8}>
          <Card title="Việc cần làm ngay">
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              {canOpenSection(tier, '/orders') ? (
                <Link to="/orders?status=DISPUTED">
                  <Button block>
                    Đơn chờ đối soát: {formatNumber(stats?.orders.byStatus.DISPUTED ?? 0)}
                  </Button>
                </Link>
              ) : null}
              {canOpenSection(tier, '/reports') ? (
                <Link to="/reports?status=PENDING">
                  <Button block>
                    {formatNumber(stats?.moderation.pendingReports ?? 0)} báo cáo chờ xử lý
                  </Button>
                </Link>
              ) : null}
              {canOpenSection(tier, '/ratings') ? (
                <Link to="/ratings?status=FLAGGED">
                  <Button block>
                    {formatNumber(stats?.moderation.flaggedRatings ?? 0)} đánh giá bị gắn cờ
                  </Button>
                </Link>
              ) : null}
              {canOpenSection(tier, '/withdrawals') ? (
                <Link to="/withdrawals">
                  <Button block>
                    {formatNumber(stats?.money.pendingUserWithdrawals ?? 0)} yêu cầu rút tiền chờ duyệt
                  </Button>
                </Link>
              ) : null}
              {canOpenSection(tier, '/money') ? (
                <Link to="/money?tab=escrows&status=HELD">
                  <Button block>Tiền đang giữ hộ: {formatMoney(kpis.data?.queue.escrowHeld ?? 0)}</Button>
                </Link>
              ) : null}
              {canOpenSection(tier, '/audit') ? (
                <Link to="/audit">
                  <Button block>Nhật ký thao tác gần đây</Button>
                </Link>
              ) : null}
            </Space>
          </Card>
        </Col>
      </Row>
    </>
  )
}
