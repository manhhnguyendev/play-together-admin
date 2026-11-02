import {
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Select,
  Space,
  Switch,
  Table,
  Typography,
} from 'antd'
import type { TableProps } from 'antd'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { adminService, type ResolveReportBody } from '@/api/admin'
import { adminKeys } from '@/api/keys'
import { REPORT_STATUSES, type ReportDto, type ReportStatus } from '@/api/types'
import { PageHeader } from '@/components/PageHeader'
import { PartyLink } from '@/components/PartyLink'
import { QueryError } from '@/components/QueryError'
import { StatusTag } from '@/components/StatusTag'
import { useApiMutation } from '@/hooks/useApiMutation'
import { usePagedQuery } from '@/hooks/usePagedQuery'
import { formatDateTime, formatMoney, formatNumber } from '@/lib/format'
import { statusOptions } from '@/lib/labels'

const FILTERS = ['status', 'q'] as const

export default function ReportsPage() {
  const [target, setTarget] = useState<ReportDto | null>(null)
  const [form] = Form.useForm<ResolveReportBody>()

  const { query, pagination, filters, setFilter, clearFilters } = usePagedQuery<
    ReportDto,
    (typeof FILTERS)[number]
  >({
    key: [...adminKeys.reports],
    filterNames: FILTERS,
    fetcher: ({ page, pageSize, filters: f }) =>
      adminService.reports({
        page,
        pageSize,
        // The moderation queue opens on the undecided reports.
        status: (f.status ?? 'PENDING') as ReportStatus,
        q: f.q,
      }),
    totalLabel: (total) => `${formatNumber(total)} báo cáo`,
  })

  const [keyword, setKeyword] = useState(filters.q ?? '')

  const mutation = useApiMutation({
    mutationFn: (input: { id: string; body: ResolveReportBody }) =>
      adminService.resolveReport(input.id, input.body),
    successMessage: 'Đã xử lý báo cáo',
    invalidate: [adminKeys.reports, adminKeys.stats],
    onSuccess: () => setTarget(null),
  })

  const columns: TableProps<ReportDto>['columns'] = [
    {
      title: 'Người báo cáo',
      dataIndex: ['reporter', 'name'],
      width: 160,
      render: (_, row) => <PartyLink id={row.reporter?.id} name={row.reporter?.name} />,
    },
    {
      title: 'Bị báo cáo',
      dataIndex: ['target', 'name'],
      width: 160,
      render: (_, row) => <PartyLink id={row.target?.id} name={row.target?.name} />,
    },
    {
      title: 'Nội dung',
      dataIndex: 'message',
      ellipsis: true,
      render: (value: string) => <Typography.Text>{value}</Typography.Text>,
    },
    {
      title: 'Đơn',
      dataIndex: 'orderId',
      width: 90,
      render: (value: string) => <Link to={`/orders/${value}`}>Xem</Link>,
    },
    { title: 'Trạng thái', dataIndex: 'status', width: 130, render: (value: string) => <StatusTag status={value} /> },
    { title: 'Gửi lúc', dataIndex: 'createdAt', width: 150, render: (value: string) => formatDateTime(value) },
    {
      title: '',
      key: 'actions',
      width: 110,
      render: (_, row) =>
        row.status === 'PENDING' ? (
          <Button
            size="small"
            type="primary"
            onClick={() => {
              setTarget(row)
            }}
          >
            Xử lý
          </Button>
        ) : null,
    },
  ]

  return (
    <>
      <PageHeader title="Báo cáo vi phạm" description="Duyệt báo cáo và áp dụng hình phạt cho tài khoản bị báo cáo" />

      <Card style={{ marginBottom: 16 }}>
        <Space wrap size={12}>
          <Select
            placeholder="Trạng thái"
            style={{ width: 170 }}
            value={filters.status ?? 'PENDING'}
            onChange={(value) => setFilter('status', value)}
            options={statusOptions(REPORT_STATUSES)}
          />
          <Input.Search
            allowClear
            placeholder="Nội dung báo cáo"
            style={{ width: 280 }}
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            onSearch={(value) => setFilter('q', value.trim() || null)}
          />
          <Button type="text" onClick={clearFilters}>
            Xoá bộ lọc
          </Button>
        </Space>
      </Card>

      <QueryError error={query.error} />

      <Card>
        <Table<ReportDto>
          rowKey="id"
          loading={query.isLoading}
          dataSource={query.data?.items ?? []}
          columns={columns}
          scroll={{ x: 1100 }}
          pagination={pagination}
        />
      </Card>

      {target ? <ResolveModal form={form} target={target} onClose={() => setTarget(null)} onSubmit={mutation} /> : null}
    </>
  )
}

/**
 * Taking money or locking an account is refused by the API without a written
 * note, so the note becomes required the moment either is chosen.
 */
function ResolveModal({
  form,
  target,
  onClose,
  onSubmit,
}: {
  form: ReturnType<typeof Form.useForm<ResolveReportBody>>[0]
  target: ReportDto
  onClose: () => void
  onSubmit: { isPending: boolean; mutate: (input: { id: string; body: ResolveReportBody }) => void }
}) {
  const refundAmount = Form.useWatch('refundAmount', form)
  const disableAccount = Form.useWatch('disableAccount', form)
  const needsNote = (refundAmount ?? 0) > 0 || Boolean(disableAccount)

  return (
    <Modal
      title="Xử lý báo cáo"
      open
      width={640}
      onCancel={onClose}
      confirmLoading={onSubmit.isPending}
      destroyOnHidden
      onOk={() => {
        void form.validateFields().then((values) => onSubmit.mutate({ id: target.id, body: values }))
      }}
    >
      <Descriptions size="small" column={1} style={{ marginBottom: 16 }}>
        <Descriptions.Item label="Người báo cáo">
          <PartyLink id={target.reporter?.id} name={target.reporter?.name} />
        </Descriptions.Item>
        <Descriptions.Item label="Tài khoản bị báo cáo">
          <PartyLink id={target.target?.id} name={target.target?.name} />
        </Descriptions.Item>
        <Descriptions.Item label="Đơn liên quan">
          <Link to={`/orders/${target.orderId}`}>Xem đơn</Link>
        </Descriptions.Item>
        <Descriptions.Item label="Nội dung">{target.message}</Descriptions.Item>
      </Descriptions>

      <Form<ResolveReportBody>
        form={form}
        layout="vertical"
        preserve={false}
        initialValues={{
          decision: 'APPROVED',
          note: '',
          points: 0,
          satisfaction: 0,
          disableAccount: false,
          refundAmount: 0,
        }}
      >
        <Form.Item name="decision" label="Quyết định" rules={[{ required: true }]}>
          <Radio.Group
            options={[
              { value: 'APPROVED', label: 'Chấp nhận (áp dụng hình phạt)' },
              { value: 'REJECTED', label: 'Bác bỏ' },
            ]}
          />
        </Form.Item>
        <Form.Item
          name="note"
          label="Ghi chú xử lý"
          rules={
            needsNote
              ? [{ required: true, min: 3, max: 1000, message: 'Cần ghi rõ lý do khi hoàn tiền hoặc khoá tài khoản' }]
              : [{ max: 1000 }]
          }
          extra={
            needsNote
              ? 'API từ chối quyết định hoàn tiền hoặc khoá tài khoản nếu không có ghi chú.'
              : 'Ghi chú này hiển thị cho người bị báo cáo trong thông báo kết luận.'
          }
        >
          <Input.TextArea rows={3} maxLength={1000} showCount />
        </Form.Item>
        <Space size={24} wrap>
          <Form.Item name="points" label="Trừ điểm hành vi">
            <InputNumber min={0} max={100} style={{ width: 140 }} />
          </Form.Item>
          <Form.Item name="satisfaction" label="Trừ điểm hài lòng">
            <InputNumber min={0} max={100} style={{ width: 140 }} />
          </Form.Item>
          <Form.Item name="refundAmount" label="Hoàn tiền cho người thuê">
            <InputNumber
              min={0}
              step={10_000}
              style={{ width: 190 }}
              formatter={(value) => `${formatMoney(Number(value ?? 0))}`}
            />
          </Form.Item>
        </Space>
        <Form.Item name="disableAccount" label="Khoá tài khoản bị báo cáo" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  )
}
