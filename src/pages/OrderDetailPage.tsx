import { ArrowLeftOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { Alert, Button, Card, Descriptions, Space, Table, Tag, Timeline, Typography } from 'antd'
import type { TableProps } from 'antd'
import { Link, useParams } from 'react-router-dom'
import { opsService } from '@/api/admin'
import { opsKeys } from '@/api/keys'
import type { AdminOrderLedgerDto, AdminOrderRatingDto, AdminOrderReportDto } from '@/api/types'
import { PageHeader } from '@/components/PageHeader'
import { PartyLink } from '@/components/PartyLink'
import { QueryError } from '@/components/QueryError'
import { StatusTag } from '@/components/StatusTag'
import { formatDateTime, formatMoney, formatNumber } from '@/lib/format'
import {
  ACCOUNT_TYPE_LABELS,
  CLOSE_REASON_LABELS,
  DIRECTION_LABELS,
  LEDGER_TYPE_LABELS,
  ORDER_PARTY_LABELS,
  formatBasisPoints,
  labelOf,
  statusLabel,
} from '@/lib/labels'

export default function OrderDetailPage() {
  const { id = '' } = useParams<{ id: string }>()

  const query = useQuery({
    queryKey: opsKeys.order(id),
    queryFn: () => opsService.order(id),
    enabled: id.length > 0,
    retry: false,
  })

  if (query.error) {
    return (
      <>
        <PageHeader title="Đơn thuê" extra={<BackToList />} />
        <QueryError error={query.error} />
      </>
    )
  }

  if (!query.data) return <Card loading={query.isLoading} />

  const detail = query.data
  const { order } = detail

  return (
    <>
      <PageHeader
        title={`${order.hirer.name} thuê ${order.player.name}`}
        description={`${formatNumber(order.hours)} giờ · tạo lúc ${formatDateTime(order.createdAt)}`}
        extra={<BackToList />}
      />

      {detail.disputeClosesAt ? (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="Đang trong cửa sổ khiếu nại"
          description={`Tiền vẫn được giữ cho tới ${formatDateTime(detail.disputeClosesAt)} (${detail.disputeWindowHours} giờ sau khi phiên kết thúc).`}
        />
      ) : null}

      <Card style={{ marginBottom: 16 }}>
        <Descriptions column={2} size="small" items={[
          { key: 'status', label: 'Trạng thái', children: <StatusTag status={order.status} /> },
          {
            key: 'close',
            label: 'Vì sao kết thúc',
            children: order.closeReason ? labelOf(CLOSE_REASON_LABELS, order.closeReason) : '—',
          },
          {
            key: 'hirer',
            label: 'Người thuê',
            children: <PartyLink id={order.hirer.id} name={order.hirer.name} />,
          },
          {
            key: 'player',
            label: 'Người chơi',
            children: <PartyLink id={order.player.id} name={order.player.name} />,
          },
          {
            key: 'games',
            label: 'Game',
            children: (
              <Space size={4} wrap>
                {order.games.map((game) => (
                  <Tag key={game.id}>{game.name}</Tag>
                ))}
              </Space>
            ),
          },
          { key: 'starts', label: 'Bắt đầu', children: formatDateTime(order.startsAt) },
          { key: 'ends', label: 'Kết thúc theo lịch', children: formatDateTime(order.scheduledEndAt) },
          { key: 'endedAt', label: 'Kết thúc thực tế', children: formatDateTime(order.endedAt) },
          { key: 'rate', label: 'Giá mỗi giờ', children: formatMoney(order.hourlyRate) },
          { key: 'total', label: 'Khách trả', children: formatMoney(order.totalPrice) },
          { key: 'fee', label: 'Phí nền tảng', children: formatBasisPoints(order.feeBps) },
          {
            key: 'payout',
            label: 'Thợ nhận',
            children: order.playerPayout === null ? 'Chưa chốt' : formatMoney(order.playerPayout),
          },
          {
            key: 'early',
            label: 'Bên yêu cầu kết thúc sớm',
            children: order.endedEarlyBy ? labelOf(ORDER_PARTY_LABELS, order.endedEarlyBy) : '—',
          },
          {
            key: 'id',
            label: 'Mã đơn',
            children: (
              <Typography.Text copyable style={{ fontSize: 12 }}>
                {order.id}
              </Typography.Text>
            ),
          },
        ]} />
      </Card>

      <Card title="Nội dung hai bên đã ghi" style={{ marginBottom: 16 }}>
        <Typography.Paragraph style={{ marginBottom: detail.reason ? 8 : 0 }}>
          <strong>Lời nhắn khi đặt: </strong>
          {detail.message || '—'}
        </Typography.Paragraph>
        {detail.reason ? (
          <Typography.Paragraph style={{ marginBottom: 0 }}>
            <strong>Lý do kết thúc: </strong>
            {detail.reason}
          </Typography.Paragraph>
        ) : null}
      </Card>

      <Card title="Diễn biến đơn" style={{ marginBottom: 16 }}>
        <Timeline
          items={detail.history.map((item) => ({
            children: (
              <Space size={4} direction="vertical">
                <span>
                  <StatusTag status={item.toStatus} />
                  {item.fromStatus ? (
                    <Typography.Text type="secondary" style={{ marginLeft: 8 }}>
                      từ {statusLabel(item.fromStatus)}
                    </Typography.Text>
                  ) : null}
                </span>
                <small style={{ color: '#8c8c8c' }}>
                  {formatDateTime(item.createdAt)}
                  {item.actor ? ` · ${item.actor.name}` : ' · hệ thống'}
                </small>
                {item.reason ? <small>{item.reason}</small> : null}
              </Space>
            ),
          }))}
        />
      </Card>

      <Card title="Tiền của đơn" style={{ marginBottom: 16 }}>
        {detail.escrow ? (
          <Descriptions
            column={2}
            size="small"
            style={{ marginBottom: 16 }}
            items={[
              { key: 'escrowStatus', label: 'Lô giữ tiền', children: <StatusTag status={detail.escrow.status} domain="escrow" /> },
              { key: 'amount', label: 'Tổng được giữ', children: formatMoney(detail.escrow.amount) },
              { key: 'settled', label: 'Đã trả cho thợ', children: formatMoney(detail.escrow.settledAmount) },
              { key: 'refunded', label: 'Đã hoàn cho khách', children: formatMoney(detail.escrow.refundedAmount) },
              { key: 'held', label: 'Vẫn đang giữ', children: formatMoney(detail.escrow.heldAmount) },
              { key: 'updated', label: 'Cập nhật lúc', children: formatDateTime(detail.escrow.updatedAt) },
            ]}
          />
        ) : (
          <Alert type="info" showIcon message="Đơn này chưa tạo lô giữ tiền" />
        )}

        <Table<AdminOrderLedgerDto>
          rowKey="id"
          size="small"
          pagination={false}
          dataSource={detail.ledger}
          columns={[
            {
              title: 'Loại bút toán',
              dataIndex: 'type',
              render: (value: string) => labelOf(LEDGER_TYPE_LABELS, value),
            },
            {
              title: 'Chiều',
              dataIndex: 'direction',
              width: 110,
              render: (value: string) => labelOf(DIRECTION_LABELS, value),
            },
            {
              title: 'Tài khoản',
              dataIndex: 'accountType',
              width: 180,
              render: (value: string) => labelOf(ACCOUNT_TYPE_LABELS, value),
            },
            { title: 'Số tiền', dataIndex: 'amount', width: 140, align: 'right', render: (v: number) => formatMoney(v) },
            { title: 'Ghi chú', dataIndex: 'note', render: (value: string | null) => value ?? '—' },
            { title: 'Lúc', dataIndex: 'createdAt', width: 160, render: (value: string) => formatDateTime(value) },
          ]}
        />

        {detail.pendingCredits.length > 0 ? (
          <Table
            rowKey="id"
            size="small"
            style={{ marginTop: 16 }}
            pagination={false}
            dataSource={detail.pendingCredits}
            columns={[
              {
                title: 'Tiền chờ nhả',
                dataIndex: 'amount',
                align: 'right',
                render: (value: number) => formatMoney(value),
              },
              {
                title: 'Dùng được từ',
                dataIndex: 'availableAt',
                render: (value: string) => formatDateTime(value),
              },
              {
                title: 'Đã nhả chưa',
                dataIndex: 'releasedAt',
                render: (value: string | null) => (value ? formatDateTime(value) : 'Chưa nhả'),
              },
            ] satisfies TableProps<(typeof detail.pendingCredits)[number]>['columns']}
          />
        ) : null}
      </Card>

      <Card title="Đánh giá trong đơn" style={{ marginBottom: 16 }}>
        <Table<AdminOrderRatingDto>
          rowKey="id"
          size="small"
          pagination={false}
          dataSource={detail.ratings}
          locale={{ emptyText: 'Chưa có đánh giá nào' }}
          columns={[
            {
              title: 'Người đánh giá',
              dataIndex: ['rater', 'name'],
              render: (_, row) => <PartyLink id={row.rater.id} name={row.rater.name} />,
            },
            {
              title: 'Người được đánh giá',
              dataIndex: ['ratee', 'name'],
              render: (_, row) => <PartyLink id={row.ratee.id} name={row.ratee.name} />,
            },
            { title: 'Sao', dataIndex: 'rate', width: 80, align: 'right', render: (value: number) => `${value}/5` },
            { title: 'Nhận xét', dataIndex: 'comment', render: (value: string | null) => value ?? '—' },
            {
              title: 'Kiểm duyệt',
              dataIndex: 'violationStatus',
              width: 140,
              render: (value: string) => <StatusTag status={value} />,
            },
            {
              title: 'Còn hiển thị',
              dataIndex: 'isActive',
              width: 110,
              render: (value: boolean) => (value ? 'Có' : 'Không'),
            },
          ]}
        />
      </Card>

      <Card title="Báo cáo liên quan">
        <Table<AdminOrderReportDto>
          rowKey="id"
          size="small"
          pagination={false}
          dataSource={detail.reports}
          locale={{ emptyText: 'Không có báo cáo nào cho đơn này' }}
          columns={[
            {
              title: 'Người báo cáo',
              dataIndex: ['reporter', 'name'],
              render: (_, row) => <PartyLink id={row.reporter.id} name={row.reporter.name} />,
            },
            {
              title: 'Người bị báo cáo',
              dataIndex: ['target', 'name'],
              render: (_, row) => <PartyLink id={row.target.id} name={row.target.name} />,
            },
            { title: 'Nội dung', dataIndex: 'message' },
            { title: 'Trạng thái', dataIndex: 'status', width: 130, render: (value: string) => <StatusTag status={value} /> },
            {
              title: 'Kết luận',
              dataIndex: 'resolutionNote',
              render: (value: string | null) => value ?? '—',
            },
          ]}
        />
      </Card>
    </>
  )
}

function BackToList() {
  return (
    <Link to="/orders">
      <Button icon={<ArrowLeftOutlined />}>Danh sách đơn</Button>
    </Link>
  )
}
