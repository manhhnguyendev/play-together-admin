import { Button, Card, Form, Input, Modal, Radio, Rate, Select, Space, Table, Typography } from 'antd'
import type { TableProps } from 'antd'
import { useState } from 'react'
import { adminService } from '@/api/admin'
import { adminKeys } from '@/api/keys'
import { FLAGGED_RATING_STATUSES, type FlaggedRatingStatus, type RatingDto } from '@/api/types'
import { PageHeader } from '@/components/PageHeader'
import { QueryError } from '@/components/QueryError'
import { StatusTag } from '@/components/StatusTag'
import { useApiMutation } from '@/hooks/useApiMutation'
import { usePagedQuery } from '@/hooks/usePagedQuery'
import { formatDateTime, formatNumber } from '@/lib/format'

interface ResolveForm {
  decision: 'UPHELD' | 'DISMISSED'
  note?: string
}

const STATUS_OPTIONS = FLAGGED_RATING_STATUSES.map((value) => ({ value, label: value }))

export default function FlaggedRatingsPage() {
  const [status, setStatus] = useState<FlaggedRatingStatus | undefined>('FLAGGED')
  const [target, setTarget] = useState<RatingDto | null>(null)
  const [form] = Form.useForm<ResolveForm>()

  const { query, pagination, resetPage } = usePagedQuery<RatingDto>({
    key: [...adminKeys.flaggedRatings, { status }],
    fetcher: ({ page, pageSize }) => adminService.flaggedRatings({ page, pageSize, status }),
    totalLabel: (total) => `${formatNumber(total)} đánh giá`,
  })

  const mutation = useApiMutation({
    mutationFn: (input: { id: string; body: ResolveForm }) =>
      adminService.resolveViolation(input.id, input.body),
    successMessage: 'Đã xử lý đánh giá',
    invalidate: [adminKeys.flaggedRatings, adminKeys.stats],
    onSuccess: () => setTarget(null),
  })

  const columns: TableProps<RatingDto>['columns'] = [
    { title: 'Người đánh giá', dataIndex: ['rater', 'name'], width: 160, render: (value?: string) => value ?? '—' },
    { title: 'Người nhận', dataIndex: ['ratee', 'name'], width: 160, render: (value?: string) => value ?? '—' },
    {
      title: 'Số sao',
      dataIndex: 'rate',
      width: 150,
      render: (value: number) => <Rate disabled value={value} style={{ fontSize: 14 }} />,
    },
    {
      title: 'Nội dung',
      dataIndex: 'comment',
      ellipsis: true,
      render: (value: string | null) => <Typography.Text>{value ?? '—'}</Typography.Text>,
    },
    {
      title: 'Lý do gắn cờ',
      dataIndex: 'violationReason',
      width: 220,
      ellipsis: true,
      render: (value: string | null) => value ?? '—',
    },
    { title: 'Trạng thái', dataIndex: 'violationStatus', width: 130, render: (value: string) => <StatusTag status={value} /> },
    { title: 'Tạo lúc', dataIndex: 'createdAt', width: 150, render: (value: string) => formatDateTime(value) },
    {
      title: '',
      key: 'actions',
      width: 110,
      render: (_, row) =>
        row.violationStatus === 'FLAGGED' ? (
          <Button
            size="small"
            type="primary"
            onClick={() => {
              setTarget(row)
              form.setFieldsValue({ decision: 'UPHELD', note: '' })
            }}
          >
            Xử lý
          </Button>
        ) : null,
    },
  ]

  return (
    <>
      <PageHeader
        title="Đánh giá bị gắn cờ"
        description="Giữ nguyên vi phạm (ẩn đánh giá) hoặc bỏ cờ cho đánh giá hợp lệ"
      />

      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Select
            allowClear
            placeholder="Trạng thái"
            style={{ width: 170 }}
            value={status}
            onChange={(value) => {
              setStatus(value)
              resetPage()
            }}
            options={STATUS_OPTIONS}
          />
        </Space>
      </Card>

      <QueryError error={query.error} />

      <Card>
        <Table<RatingDto>
          rowKey="id"
          loading={query.isLoading}
          dataSource={query.data?.items ?? []}
          columns={columns}
          scroll={{ x: 1200 }}
          pagination={pagination}
        />
      </Card>

      <Modal
        title="Xử lý đánh giá bị gắn cờ"
        open={target !== null}
        onCancel={() => setTarget(null)}
        confirmLoading={mutation.isPending}
        destroyOnHidden
        onOk={() => {
          void form.validateFields().then((values) => {
            if (target) mutation.mutate({ id: target.id, body: values })
          })
        }}
      >
        {target ? (
          <div style={{ marginBottom: 16 }}>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 4 }}>
              Lý do: {target.violationReason ?? '—'}
            </Typography.Paragraph>
            <Typography.Paragraph italic>{target.comment ?? '(không có nội dung)'}</Typography.Paragraph>
          </div>
        ) : null}

        <Form<ResolveForm> form={form} layout="vertical" preserve={false}>
          <Form.Item name="decision" label="Quyết định" rules={[{ required: true }]}>
            <Radio.Group
              options={[
                { value: 'UPHELD', label: 'Giữ vi phạm' },
                { value: 'DISMISSED', label: 'Bỏ cờ' },
              ]}
            />
          </Form.Item>
          <Form.Item name="note" label="Ghi chú">
            <Input.TextArea rows={3} maxLength={500} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
