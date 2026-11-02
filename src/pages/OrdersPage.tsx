import { ReloadOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Input, Select, Space, Table, Tag } from 'antd'
import type { TableProps } from 'antd'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { opsService } from '@/api/admin'
import { opsKeys } from '@/api/keys'
import {
  ORDER_STATUSES,
  type AdminOrderRowDto,
  type ListOpsOrdersParams,
} from '@/api/types'
import { PartyLink } from '@/components/PartyLink'
import { PageHeader } from '@/components/PageHeader'
import { QueryError } from '@/components/QueryError'
import { DateRangeFilter } from '@/components/DateRangeFilter'
import { StatusTag } from '@/components/StatusTag'
import { usePagedQuery } from '@/hooks/usePagedQuery'
import { formatDateTime, formatMoney, formatNumber } from '@/lib/format'
import { CLOSE_REASON_LABELS, ORDER_PARTY_LABELS, formatBasisPoints, labelOf, statusOptions } from '@/lib/labels'

const FILTERS = ['status', 'q', 'from', 'to', 'hirerId', 'playerId'] as const

export default function OrdersPage() {
  const navigate = useNavigate()
  const { query, pagination, filters, setFilter, setFilters, clearFilters, onTableChange, sortOrderOf } =
    usePagedQuery<AdminOrderRowDto, (typeof FILTERS)[number]>({
      key: opsKeys.orders,
      filterNames: FILTERS,
      initialPageSize: 20,
      fetcher: ({ page, pageSize, sort, filters }) =>
        opsService.orders({
          page,
          pageSize,
          sort: sort as ListOpsOrdersParams['sort'],
          status: filters.status as ListOpsOrdersParams['status'],
          q: filters.q,
          from: filters.from,
          to: filters.to,
          hirerId: filters.hirerId,
          playerId: filters.playerId,
        }),
      totalLabel: (total) => `${formatNumber(total)} đơn thuê`,
    })

  // The box keeps its own text so typing does not fire a request per keystroke.
  const [keyword, setKeyword] = useState(filters.q ?? '')
  const filtered = FILTERS.some((name) => filters[name] !== undefined)

  // The address bar carries the account id; the operator should see a name.
  const partyId = filters.playerId ?? filters.hirerId ?? null
  const partyCaption = filters.playerId
    ? labelOf(ORDER_PARTY_LABELS, 'PLAYER')
    : labelOf(ORDER_PARTY_LABELS, 'HIRER')
  const partyName =
    query.data?.items.find((row) => row.hirer.id === partyId)?.hirer.name ??
    query.data?.items.find((row) => row.player.id === partyId)?.player.name ??
    'Tài khoản đang lọc'

  const columns: TableProps<AdminOrderRowDto>['columns'] = [
    {
      title: 'Người thuê',
      dataIndex: ['hirer', 'name'],
      width: 180,
      render: (_, row) => <PartyLink id={row.hirer.id} name={row.hirer.name} />,
    },
    {
      title: 'Người chơi',
      dataIndex: ['player', 'name'],
      width: 180,
      render: (_, row) => <PartyLink id={row.player.id} name={row.player.name} />,
    },
    {
      title: 'Game',
      dataIndex: 'games',
      render: (_, row) => (
        <Space size={4} wrap>
          {row.games.map((game) => (
            <Tag key={game.id}>{game.name}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'Lịch hẹn',
      dataIndex: 'startsAt',
      width: 170,
      sorter: true,
      sortOrder: sortOrderOf('startsAt'),
      sortDirections: ['descend'],
      render: (_, row) =>
        row.startsAt ? (
          <span>
            <div>{formatDateTime(row.startsAt)}</div>
            <small style={{ color: '#8c8c8c' }}>
              {row.scheduledEndAt ? `đến ${formatDateTime(row.scheduledEndAt)}` : 'chưa chốt giờ kết thúc'}
            </small>
          </span>
        ) : (
          '—'
        ),
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
      title: 'Số giờ',
      dataIndex: 'hours',
      width: 90,
      align: 'right',
      render: (value: number) => `${value}h`,
    },
    {
      title: 'Khách trả',
      dataIndex: 'totalPrice',
      width: 130,
      align: 'right',
      render: (value: number) => formatMoney(value),
    },
    {
      title: 'Phí nền tảng',
      dataIndex: 'feeBps',
      width: 110,
      align: 'right',
      render: (value: number) => formatBasisPoints(value),
    },
    {
      title: 'Thợ nhận',
      dataIndex: 'playerPayout',
      width: 130,
      align: 'right',
      render: (value: number | null) => (value === null ? '—' : formatMoney(value)),
    },
    {
      title: 'Tạo lúc',
      dataIndex: 'createdAt',
      width: 160,
      sorter: true,
      sortOrder: sortOrderOf('createdAt'),
      sortDirections: ['descend'],
      render: (value: string) => formatDateTime(value),
    },
    {
      title: '',
      key: 'actions',
      width: 110,
      fixed: 'right',
      render: (_, row) => (
        <Button size="small" onClick={() => navigate(`/orders/${row.id}`)}>
          Chi tiết
        </Button>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Đơn thuê"
        description="Mọi phiên thuê trên nền tảng, lọc theo trạng thái, người tham gia hoặc khoảng thời gian"
      />

      <Card style={{ marginBottom: 16 }}>
        <Space wrap size={12}>
          <Input.Search
            allowClear
            placeholder="Tên người thuê hoặc người chơi"
            style={{ width: 260 }}
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            onSearch={(value) => setFilter('q', value.trim() || null)}
          />
          <Select
            allowClear
            placeholder="Trạng thái"
            style={{ width: 180 }}
            value={filters.status}
            onChange={(value) => setFilter('status', value)}
            options={statusOptions(ORDER_STATUSES)}
          />
          <DateRangeFilter
            from={filters.from}
            to={filters.to}
            onChange={(range) => setFilters(range)}
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={() => void query.refetch()}
            loading={query.isFetching}
          >
            Làm mới
          </Button>
          {filtered ? (
            <Button type="text" onClick={clearFilters}>
              Xoá bộ lọc
            </Button>
          ) : null}
        </Space>
      </Card>

      {filters.hirerId || filters.playerId ? (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          title="Đang liệt kê theo một tài khoản"
          description={
            <Space size={8} wrap>
              <span>{partyCaption}:</span>
              <PartyLink id={partyId} name={partyName} />
              <Button size="small" onClick={() => setFilters({ hirerId: null, playerId: null })}>
                Bỏ lọc theo tài khoản
              </Button>
            </Space>
          }
        />
      ) : null}

      <QueryError error={query.error} />

      <Card>
        <Table<AdminOrderRowDto>
          rowKey="id"
          loading={query.isLoading}
          dataSource={query.data?.items ?? []}
          columns={columns}
          scroll={{ x: 1500 }}
          pagination={pagination}
          onChange={onTableChange}
        />
      </Card>
    </>
  )
}
