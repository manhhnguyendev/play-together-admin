import { ReloadOutlined } from '@ant-design/icons'
import { Button, Card, Descriptions, Input, Select, Space, Table, Tag, Typography } from 'antd'
import type { TableProps } from 'antd'
import { opsService } from '@/api/admin'
import { opsKeys } from '@/api/keys'
import { type AdminAuditLogView } from '@/api/types'
import { DateRangeFilter } from '@/components/DateRangeFilter'
import { PageHeader } from '@/components/PageHeader'
import { QueryError } from '@/components/QueryError'
import { usePagedQuery } from '@/hooks/usePagedQuery'
import { formatDateTime, formatNumber } from '@/lib/format'
import { AUDIT_ACTION_LABELS, AUDIT_ENTITY_LABELS, adminTierLabel, labelOf, optionsFor } from '@/lib/labels'

const FILTERS = ['action', 'entity', 'adminId', 'from', 'to'] as const

export default function AuditLogPage() {
  const { query, pagination, filters, setFilter, setFilters, clearFilters } = usePagedQuery<
    AdminAuditLogView,
    (typeof FILTERS)[number]
  >({
    key: opsKeys.auditLogs,
    filterNames: FILTERS,
    fetcher: ({ page, pageSize, filters: f }) =>
      opsService.auditLogs({
        page,
        pageSize,
        action: f.action,
        entity: f.entity,
        adminId: f.adminId,
        from: f.from,
        to: f.to,
      }),
    totalLabel: (total) => `${formatNumber(total)} thao tác`,
  })

  const columns: TableProps<AdminAuditLogView>['columns'] = [
    {
      title: 'Thời điểm',
      dataIndex: 'createdAt',
      width: 170,
      render: (value: string) => formatDateTime(value),
    },
    {
      title: 'Người thao tác',
      dataIndex: ['admin', 'name'],
      width: 200,
      render: (_, row) =>
        row.admin ? (
          <Space size={4} direction="vertical">
            <Typography.Link onClick={() => setFilter('adminId', row.admin?.id ?? null)}>
              {row.admin.name}
            </Typography.Link>
            <small style={{ color: '#8c8c8c' }}>{adminTierLabel(row.admin.adminRole)}</small>
          </Space>
        ) : (
          <Typography.Text type="secondary">Tài khoản đã bị xoá</Typography.Text>
        ),
    },
    {
      title: 'Hành động',
      dataIndex: 'action',
      width: 260,
      render: (value: string) => labelOf(AUDIT_ACTION_LABELS, value),
    },
    {
      title: 'Đối tượng',
      dataIndex: 'entity',
      width: 200,
      render: (value: string) => <Tag>{labelOf(AUDIT_ENTITY_LABELS, value)}</Tag>,
    },
    {
      title: 'Lý do đã nêu',
      dataIndex: 'reason',
      render: (value: string | null) => value ?? '—',
    },
  ]

  return (
    <>
      <PageHeader
        title="Nhật ký thao tác"
        description="Mỗi thay đổi do quản trị viên thực hiện, kèm lý do họ đã nêu lúc đó"
      />

      <Card style={{ marginBottom: 16 }}>
        <Space wrap size={12}>
          <Select
            allowClear
            placeholder="Hành động"
            style={{ width: 280 }}
            value={filters.action}
            onChange={(value) => setFilter('action', value)}
            options={optionsFor(Object.keys(AUDIT_ACTION_LABELS), AUDIT_ACTION_LABELS)}
          />
          <Select
            allowClear
            placeholder="Đối tượng"
            style={{ width: 200 }}
            value={filters.entity}
            onChange={(value) => setFilter('entity', value)}
            options={optionsFor(Object.keys(AUDIT_ENTITY_LABELS), AUDIT_ENTITY_LABELS)}
          />
          <DateRangeFilter from={filters.from} to={filters.to} onChange={(range) => setFilters(range)} />
          {filters.adminId ? (
            <Input
              disabled
              style={{ width: 240 }}
              value="Đang lọc theo một người thao tác"
            />
          ) : null}
          <Button icon={<ReloadOutlined />} onClick={() => void query.refetch()} loading={query.isFetching}>
            Làm mới
          </Button>
          <Button type="text" onClick={clearFilters}>
            Xoá bộ lọc
          </Button>
        </Space>
      </Card>

      <QueryError error={query.error} />

      <Card>
        <Table<AdminAuditLogView>
          rowKey="id"
          loading={query.isLoading}
          dataSource={query.data?.items ?? []}
          columns={columns}
          scroll={{ x: 1100 }}
          pagination={pagination}
          expandable={{
            expandedRowRender: (row) => <AuditDetail detail={row.detail} entityId={row.entityId} />,
            rowExpandable: (row) => row.detail !== null || row.entityId !== null,
          }}
        />
      </Card>
    </>
  )
}

/**
 * The stored change is a before/after object. It is shown as field rows rather
 * than raw JSON so a reviewer can read what actually moved.
 */
function AuditDetail({ detail, entityId }: { detail: Record<string, unknown> | null; entityId: string | null }) {
  const entries = Object.entries(detail ?? {})

  return (
    <Descriptions column={1} size="small" items={[
      ...(entityId
        ? [
            {
              key: 'entityId',
              label: 'Mã bản ghi',
              children: (
                <Typography.Text copyable style={{ fontSize: 12 }}>
                  {entityId}
                </Typography.Text>
              ),
            },
          ]
        : []),
      ...entries.map(([key, value]) => ({
        key,
        label: key,
        children: typeof value === 'object' ? JSON.stringify(value) : String(value),
      })),
    ]} />
  )
}
