import { ReloadOutlined } from '@ant-design/icons'
import { Button, Card, Input, InputNumber, Select, Space, Statistic, Table, Tabs, Typography } from 'antd'
import type { TableProps } from 'antd'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { opsService } from '@/api/admin'
import { opsKeys } from '@/api/keys'
import {
  DEPOSIT_STATUSES,
  ESCROW_STATUSES,
  LEDGER_ACCOUNT_TYPES,
  LEDGER_DIRECTIONS,
  LEDGER_TYPES,
  type AdminDepositView,
  type AdminEscrowPage,
  type AdminEscrowView,
  type AdminLedgerPage,
  type AdminLedgerView,
  type AdminWalletView,
  type ListDepositsParams,
  type ListEscrowsParams,
  type ListLedgerParams,
  type ListWalletsParams,
} from '@/api/types'
import { DateRangeFilter } from '@/components/DateRangeFilter'
import { PageHeader } from '@/components/PageHeader'
import { PartyLink } from '@/components/PartyLink'
import { QueryError } from '@/components/QueryError'
import { StatusTag } from '@/components/StatusTag'
import { usePagedQuery } from '@/hooks/usePagedQuery'
import { formatDateTime, formatMoney, formatNumber } from '@/lib/format'
import {
  ACCOUNT_TYPE_LABELS,
  DIRECTION_LABELS,
  LEDGER_TYPE_LABELS,
  labelOf,
  optionsFor,
  statusOptions,
} from '@/lib/labels'

const TABS = ['ledger', 'wallets', 'deposits', 'escrows'] as const
type TabKey = (typeof TABS)[number]

/** Every filter name any tab uses; switching tabs clears all of them. */
const ALL_FILTERS = [
  'type',
  'accountType',
  'direction',
  'orderId',
  'status',
  'q',
  'from',
  'to',
  'minAmount',
  'maxAmount',
  'pendingOnly',
]

const amount = (value: string | undefined): number | undefined => {
  const parsed = Number(value)
  return value && Number.isFinite(parsed) ? parsed : undefined
}

export default function MoneyPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const requested = searchParams.get('tab')
  const activeKey: TabKey = (TABS as readonly string[]).includes(requested ?? '') ? (requested as TabKey) : 'ledger'

  const changeTab = (next: TabKey) => {
    const cleaned = new URLSearchParams(searchParams)
    for (const name of ALL_FILTERS) cleaned.delete(name)
    cleaned.delete('page')
    cleaned.delete('size')
    if (next === 'ledger') cleaned.delete('tab')
    else cleaned.set('tab', next)
    setSearchParams(cleaned, { replace: true })
  }

  return (
    <>
      <PageHeader
        title="Sổ tiền"
        description="Bút toán hai chiều, số dư ví, lịch sử nạp tiền và tiền đang giữ hộ cho đơn"
      />
      <Card>
        <Tabs
          activeKey={activeKey}
          onChange={(key) => changeTab(key as TabKey)}
          destroyOnHidden
          items={[
            { key: 'ledger', label: 'Bút toán', children: <LedgerTab /> },
            { key: 'wallets', label: 'Số dư ví', children: <WalletsTab /> },
            { key: 'deposits', label: 'Nạp tiền', children: <DepositsTab /> },
            { key: 'escrows', label: 'Giữ hộ', children: <EscrowTab /> },
          ]}
        />
      </Card>
    </>
  )
}

function LedgerTab() {
  const { query, pagination, filters, setFilter, setFilters, clearFilters, selectedRowKeys, selectedRows, clearSelection, selection } =
    usePagedQuery<AdminLedgerView, (typeof ALL_FILTERS)[number], AdminLedgerPage>({
      key: opsKeys.ledger,
      filterNames: ['type', 'accountType', 'direction', 'orderId', 'from', 'to', 'minAmount', 'maxAmount'],
      fetcher: ({ page, pageSize, filters: f }) =>
        opsService.ledger({
          page,
          pageSize,
          type: f.type as ListLedgerParams['type'],
          accountType: f.accountType as ListLedgerParams['accountType'],
          direction: f.direction as ListLedgerParams['direction'],
          orderId: f.orderId,
          from: f.from,
          to: f.to,
          minAmount: amount(f.minAmount),
          maxAmount: amount(f.maxAmount),
        }),
      totalLabel: (total) => `${formatNumber(total)} bút toán`,
    })

  const totals = query.data?.totals
  const selectedDebits = selectedRows.reduce((sum, row) => (row.direction === 'DEBIT' ? sum + row.amount : sum), 0)
  const selectedCredits = selectedRows.reduce(
    (sum, row) => (row.direction === 'CREDIT' ? sum + row.amount : sum),
    0,
  )

  const columns: TableProps<AdminLedgerView>['columns'] = [
    {
      title: 'Loại',
      dataIndex: 'type',
      width: 180,
      render: (value: string) => labelOf(LEDGER_TYPE_LABELS, value),
    },
    {
      title: 'Chiều',
      dataIndex: 'direction',
      width: 100,
      render: (value: string) => labelOf(DIRECTION_LABELS, value),
    },
    {
      title: 'Tài khoản',
      dataIndex: 'accountType',
      width: 170,
      render: (value: string) => labelOf(ACCOUNT_TYPE_LABELS, value),
    },
    { title: 'Chủ tài khoản', dataIndex: 'holder', render: (value: string | null) => value ?? '—' },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      width: 150,
      align: 'right',
      render: (value: number, row) => (
        <span style={{ color: row.direction === 'DEBIT' ? '#cf1322' : '#389e0d' }}>
          {row.direction === 'DEBIT' ? '−' : '+'}
          {formatMoney(value)}
        </span>
      ),
    },
    {
      title: 'Đơn',
      dataIndex: 'orderId',
      width: 110,
      // Money pages are only open to tiers that can also read the order.
      render: (value: string | null) => (value ? <Link to={`/orders/${value}`}>Xem đơn</Link> : '—'),
    },
    { title: 'Ghi chú', dataIndex: 'note', render: (value: string | null) => value ?? '—' },
    { title: 'Lúc', dataIndex: 'createdAt', width: 160, render: (value: string) => formatDateTime(value) },
  ]

  return (
    <>
      <Space wrap size={12} style={{ marginBottom: 16 }}>
        <Select
          allowClear
          placeholder="Loại bút toán"
          style={{ width: 200 }}
          value={filters.type}
          onChange={(value) => setFilter('type', value)}
          options={optionsFor(LEDGER_TYPES, LEDGER_TYPE_LABELS)}
        />
        <Select
          allowClear
          placeholder="Nhóm tài khoản"
          style={{ width: 190 }}
          value={filters.accountType}
          onChange={(value) => setFilter('accountType', value)}
          options={optionsFor(LEDGER_ACCOUNT_TYPES, ACCOUNT_TYPE_LABELS)}
        />
        <Select
          allowClear
          placeholder="Chiều"
          style={{ width: 130 }}
          value={filters.direction}
          onChange={(value) => setFilter('direction', value)}
          options={optionsFor(LEDGER_DIRECTIONS, DIRECTION_LABELS)}
        />
        <DateRangeFilter from={filters.from} to={filters.to} onChange={(range) => setFilters(range)} />
        <InputNumber
          placeholder="Từ số tiền"
          min={0}
          step={10_000}
          style={{ width: 150 }}
          value={amount(filters.minAmount)}
          onChange={(value) => setFilter('minAmount', value === null ? null : String(value))}
        />
        <InputNumber
          placeholder="Đến số tiền"
          min={0}
          step={10_000}
          style={{ width: 150 }}
          value={amount(filters.maxAmount)}
          onChange={(value) => setFilter('maxAmount', value === null ? null : String(value))}
        />
        <Button icon={<ReloadOutlined />} onClick={() => void query.refetch()} loading={query.isFetching}>
          Làm mới
        </Button>
        <Button type="text" onClick={clearFilters}>
          Xoá bộ lọc
        </Button>
      </Space>

      <QueryError error={query.error} />

      <Space size={32} style={{ marginBottom: 16 }} wrap>
        <Statistic title="Tổng chi ra" value={totals?.debits ?? 0} formatter={(value) => formatMoney(Number(value))} />
        <Statistic title="Tổng thu vào" value={totals?.credits ?? 0} formatter={(value) => formatMoney(Number(value))} />
        <Statistic title="Số bút toán" value={totals?.entries ?? 0} formatter={(value) => formatNumber(Number(value))} />
      </Space>
      <Typography.Paragraph type="secondary" style={{ marginTop: -8 }}>
        Ba con số trên tính trên toàn bộ tập kết quả, không chỉ trang đang hiển thị.
      </Typography.Paragraph>

      {selectedRowKeys.length > 0 ? (
        <SelectionSummary
          count={selectedRowKeys.length}
          debits={selectedDebits}
          credits={selectedCredits}
          onClear={clearSelection}
        />
      ) : null}

      <Table<AdminLedgerView>
        rowKey="id"
        loading={query.isLoading}
        dataSource={query.data?.items ?? []}
        columns={columns}
        scroll={{ x: 1300 }}
        pagination={pagination}
        rowSelection={selection}
      />
    </>
  )
}

/**
 * What the chosen rows add up to. Selecting across pages is how finance checks a
 * suspected mismatch without exporting the whole ledger.
 */
function SelectionSummary({
  count,
  debits,
  credits,
  onClear,
}: {
  count: number
  debits: number
  credits: number
  onClear: () => void
}) {
  return (
    <Card size="small" style={{ marginBottom: 16 }}>
      <Space wrap size={16}>
        <Typography.Text strong>{formatNumber(count)} bút toán đang chọn</Typography.Text>
        <Typography.Text>Chi ra: {formatMoney(debits)}</Typography.Text>
        <Typography.Text>Thu vào: {formatMoney(credits)}</Typography.Text>
        <Typography.Text type="secondary">
          Cân đối: {formatMoney(credits - debits)}
        </Typography.Text>
        <Button size="small" onClick={onClear}>
          Bỏ chọn
        </Button>
      </Space>
    </Card>
  )
}

function WalletsTab() {
  const { query, pagination, filters, setFilter, clearFilters } = usePagedQuery<
    AdminWalletView,
    (typeof ALL_FILTERS)[number]
  >({
    key: opsKeys.wallets,
    filterNames: ['q', 'pendingOnly'],
    fetcher: ({ page, pageSize, filters: f }) =>
      opsService.wallets({
        page,
        pageSize,
        q: f.q,
        pendingOnly: f.pendingOnly as ListWalletsParams['pendingOnly'],
      }),
    totalLabel: (total) => `${formatNumber(total)} ví`,
  })

  const [keyword, setKeyword] = useState(filters.q ?? '')

  const columns: TableProps<AdminWalletView>['columns'] = [
    {
      title: 'Chủ ví',
      dataIndex: 'name',
      render: (_, row) => (
        <span>
          <div>
            <PartyLink id={row.userId} name={row.name} />
          </div>
          <small style={{ color: '#8c8c8c' }}>{row.email}</small>
        </span>
      ),
    },
    {
      title: 'Dùng được',
      dataIndex: 'availableBalance',
      width: 160,
      align: 'right',
      render: (value: number) => formatMoney(value),
    },
    {
      title: 'Chưa nhả',
      dataIndex: 'pendingAmount',
      width: 160,
      align: 'right',
      render: (value: number, row) => (
        <span>
          {formatMoney(value)}
          {row.pendingCount > 0 ? (
            <small style={{ color: '#8c8c8c' }}> ({row.pendingCount} khoản)</small>
          ) : null}
        </span>
      ),
    },
    {
      title: 'Cập nhật lúc',
      dataIndex: 'updatedAt',
      width: 170,
      render: (value: string) => formatDateTime(value),
    },
  ]

  return (
    <>
      <Space wrap size={12} style={{ marginBottom: 16 }}>
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
          placeholder="Tiền đang chờ"
          style={{ width: 180 }}
          value={filters.pendingOnly}
          onChange={(value) => setFilter('pendingOnly', value)}
          options={[{ value: 'true', label: 'Chỉ ví có tiền chờ nhả' }]}
        />
        <Button icon={<ReloadOutlined />} onClick={() => void query.refetch()} loading={query.isFetching}>
          Làm mới
        </Button>
        <Button type="text" onClick={clearFilters}>
          Xoá bộ lọc
        </Button>
      </Space>

      <QueryError error={query.error} />

      <Table<AdminWalletView>
        rowKey="walletId"
        loading={query.isLoading}
        dataSource={query.data?.items ?? []}
        columns={columns}
        scroll={{ x: 800 }}
        pagination={pagination}
      />
    </>
  )
}

function DepositsTab() {
  const { query, pagination, filters, setFilter, setFilters, clearFilters } = usePagedQuery<
    AdminDepositView,
    (typeof ALL_FILTERS)[number]
  >({
    key: opsKeys.deposits,
    filterNames: ['status', 'q', 'from', 'to', 'minAmount', 'maxAmount'],
    fetcher: ({ page, pageSize, filters: f }) =>
      opsService.deposits({
        page,
        pageSize,
        status: f.status as ListDepositsParams['status'],
        q: f.q,
        from: f.from,
        to: f.to,
        minAmount: amount(f.minAmount),
        maxAmount: amount(f.maxAmount),
      }),
    totalLabel: (total) => `${formatNumber(total)} lần nạp`,
  })

  const [keyword, setKeyword] = useState(filters.q ?? '')

  const columns: TableProps<AdminDepositView>['columns'] = [
    {
      title: 'Người nạp',
      dataIndex: ['user', 'name'],
      render: (_, row) => <PartyLink id={row.user.id} name={row.user.name} />,
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      width: 150,
      align: 'right',
      render: (value: number) => formatMoney(value),
    },
    { title: 'Nhà cung cấp', dataIndex: 'provider', width: 150 },
    {
      title: 'Mã của nhà cung cấp',
      dataIndex: 'providerTxnId',
      render: (value: string | null) => value ?? '—',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 150,
      render: (value: string) => <StatusTag status={value} domain="deposit" />,
    },
    { title: 'Tạo lúc', dataIndex: 'createdAt', width: 160, render: (value: string) => formatDateTime(value) },
    {
      title: 'Hoàn thành lúc',
      dataIndex: 'completedAt',
      width: 160,
      render: (value: string | null) => formatDateTime(value),
    },
  ]

  return (
    <>
      <Space wrap size={12} style={{ marginBottom: 16 }}>
        <Input.Search
          allowClear
          placeholder="Tên hoặc email"
          style={{ width: 240 }}
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
          options={statusOptions(DEPOSIT_STATUSES, 'deposit')}
        />
        <DateRangeFilter from={filters.from} to={filters.to} onChange={(range) => setFilters(range)} />
        <InputNumber
          placeholder="Từ số tiền"
          min={0}
          step={10_000}
          style={{ width: 150 }}
          value={amount(filters.minAmount)}
          onChange={(value) => setFilter('minAmount', value === null ? null : String(value))}
        />
        <InputNumber
          placeholder="Đến số tiền"
          min={0}
          step={10_000}
          style={{ width: 150 }}
          value={amount(filters.maxAmount)}
          onChange={(value) => setFilter('maxAmount', value === null ? null : String(value))}
        />
        <Button icon={<ReloadOutlined />} onClick={() => void query.refetch()} loading={query.isFetching}>
          Làm mới
        </Button>
        <Button type="text" onClick={clearFilters}>
          Xoá bộ lọc
        </Button>
      </Space>

      <QueryError error={query.error} />

      <Table<AdminDepositView>
        rowKey="id"
        loading={query.isLoading}
        dataSource={query.data?.items ?? []}
        columns={columns}
        scroll={{ x: 1100 }}
        pagination={pagination}
      />
    </>
  )
}

function EscrowTab() {
  const { query, pagination, filters, setFilter, clearFilters } = usePagedQuery<
    AdminEscrowView,
    (typeof ALL_FILTERS)[number],
    AdminEscrowPage
  >({
    key: opsKeys.escrows,
    filterNames: ['status'],
    fetcher: ({ page, pageSize, filters: f }) =>
      opsService.escrows({ page, pageSize, status: f.status as ListEscrowsParams['status'] }),
    totalLabel: (total) => `${formatNumber(total)} lô đang giữ`,
  })

  const columns: TableProps<AdminEscrowView>['columns'] = [
    {
      title: 'Người thuê',
      dataIndex: ['hirer', 'name'],
      render: (_, row) => <PartyLink id={row.hirer.id} name={row.hirer.name} />,
    },
    {
      title: 'Người chơi',
      dataIndex: ['player', 'name'],
      render: (_, row) => <PartyLink id={row.player.id} name={row.player.name} />,
    },
    {
      title: 'Đơn',
      dataIndex: 'orderStatus',
      width: 160,
      render: (_, row) => (
        <Space size={4}>
          <StatusTag status={row.orderStatus} />
          <Link to={`/orders/${row.orderId}`}>Xem</Link>
        </Space>
      ),
    },
    { title: 'Tổng giữ', dataIndex: 'amount', width: 140, align: 'right', render: (v: number) => formatMoney(v) },
    {
      title: 'Đã trả',
      dataIndex: 'settledAmount',
      width: 140,
      align: 'right',
      render: (v: number) => formatMoney(v),
    },
    {
      title: 'Đã hoàn',
      dataIndex: 'refundedAmount',
      width: 140,
      align: 'right',
      render: (v: number) => formatMoney(v),
    },
    {
      title: 'Vẫn đang giữ',
      dataIndex: 'heldAmount',
      width: 150,
      align: 'right',
      render: (v: number) => formatMoney(v),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 160,
      render: (value: string) => <StatusTag status={value} domain="escrow" />,
    },
    { title: 'Tạo lúc', dataIndex: 'createdAt', width: 160, render: (value: string) => formatDateTime(value) },
  ]

  return (
    <>
      <Space wrap size={12} style={{ marginBottom: 16 }}>
        <Select
          allowClear
          placeholder="Trạng thái"
          style={{ width: 200 }}
          value={filters.status}
          onChange={(value) => setFilter('status', value)}
          options={statusOptions(ESCROW_STATUSES, 'escrow')}
        />
        <Button icon={<ReloadOutlined />} onClick={() => void query.refetch()} loading={query.isFetching}>
          Làm mới
        </Button>
        <Button type="text" onClick={clearFilters}>
          Xoá bộ lọc
        </Button>
      </Space>

      <QueryError error={query.error} />

      <Space size={32} style={{ marginBottom: 16 }} wrap>
        <Statistic
          title="Tiền đang giữ hộ toàn hệ thống"
          value={query.data?.totalHeld ?? 0}
          formatter={(value) => formatMoney(Number(value))}
        />
      </Space>

      <Table<AdminEscrowView>
        rowKey="id"
        loading={query.isLoading}
        dataSource={query.data?.items ?? []}
        columns={columns}
        scroll={{ x: 1300 }}
        pagination={pagination}
      />
    </>
  )
}
