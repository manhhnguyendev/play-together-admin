import { Button, Card, Form, Input, Modal, Radio, Select, Space, Table, Tag } from 'antd'
import type { TableProps } from 'antd'
import { useState } from 'react'
import { adminService } from '@/api/admin'
import { adminKeys } from '@/api/keys'
import { FEEDBACK_STATUSES, type AdminFeedbackView, type FeedbackStatus } from '@/api/types'
import { PageHeader } from '@/components/PageHeader'
import { PartyLink } from '@/components/PartyLink'
import { QueryError } from '@/components/QueryError'
import { StatusTag } from '@/components/StatusTag'
import { useApiMutation } from '@/hooks/useApiMutation'
import { usePagedQuery } from '@/hooks/usePagedQuery'
import { formatDateTime, formatNumber } from '@/lib/format'
import { statusOptions } from '@/lib/labels'

interface ResolveForm {
  decision: 'APPROVED' | 'REJECTED'
  adminNote?: string
}

const TYPE_LABEL: Record<AdminFeedbackView['type'], string> = {
  BUG: 'Lỗi',
  FEATURE: 'Tính năng',
  COMPLAINT: 'Khiếu nại',
  OTHER: 'Khác',
}

const FILTERS = ['status', 'q'] as const

export default function FeedbackPage() {
  const [target, setTarget] = useState<AdminFeedbackView | null>(null)
  const [form] = Form.useForm<ResolveForm>()

  const { query, pagination, filters, setFilter, clearFilters } = usePagedQuery<
    AdminFeedbackView,
    (typeof FILTERS)[number]
  >({
    key: [...adminKeys.feedback],
    filterNames: FILTERS,
    fetcher: ({ page, pageSize, filters: f }) =>
      adminService.feedback({
        page,
        pageSize,
        status: (f.status ?? 'PENDING') as FeedbackStatus,
        q: f.q,
      }),
    totalLabel: (total) => `${formatNumber(total)} phản hồi`,
  })

  const [keyword, setKeyword] = useState(filters.q ?? '')

  const mutation = useApiMutation({
    mutationFn: (input: { id: string; body: ResolveForm }) =>
      adminService.resolveFeedback(input.id, input.body),
    successMessage: 'Đã xử lý feedback',
    invalidate: [adminKeys.feedback, adminKeys.stats],
    onSuccess: () => setTarget(null),
  })

  const columns: TableProps<AdminFeedbackView>['columns'] = [
    {
      title: 'Người gửi',
      dataIndex: ['author', 'name'],
      width: 180,
      render: (_, row) => (
        <span>
          <div>
            <PartyLink id={row.author?.id} name={row.author?.name} />
          </div>
          <small style={{ color: '#8c8c8c' }}>{row.author?.email ?? ''}</small>
        </span>
      ),
    },
    {
      title: 'Nội dung',
      dataIndex: 'title',
      render: (_, row) => (
        <span>
          <div style={{ fontWeight: 600 }}>{row.title}</div>
          <small style={{ color: '#595959' }}>{row.message}</small>
        </span>
      ),
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      width: 110,
      render: (value: AdminFeedbackView['type']) => <Tag>{TYPE_LABEL[value]}</Tag>,
    },
    { title: 'Trạng thái', dataIndex: 'status', width: 130, render: (value: string) => <StatusTag status={value} /> },
    { title: 'Gửi lúc', dataIndex: 'createdAt', width: 150, render: (value: string) => formatDateTime(value) },
    {
      title: 'Ghi chú',
      dataIndex: 'adminNote',
      width: 200,
      render: (value: string | null) => value ?? '—',
    },
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
      <PageHeader title="Feedback" description="Ghi nhận lỗi, đề xuất tính năng và khiếu nại từ người dùng" />

      <Card style={{ marginBottom: 16 }}>
        <Space wrap size={12}>
          <Select
            placeholder="Trạng thái"
            style={{ width: 170 }}
            value={filters.status ?? 'PENDING'}
            onChange={(value) => setFilter('status', value)}
            options={statusOptions(FEEDBACK_STATUSES)}
          />
          <Input.Search
            allowClear
            placeholder="Tiêu đề hoặc nội dung"
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
        <Table<AdminFeedbackView>
          rowKey="id"
          loading={query.isLoading}
          dataSource={query.data?.items ?? []}
          columns={columns}
          scroll={{ x: 1100 }}
          pagination={pagination}
        />
      </Card>

      <Modal
        title={`Xử lý feedback · ${target?.title ?? ''}`}
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
        <Form<ResolveForm>
          form={form}
          layout="vertical"
          preserve={false}
          initialValues={{ decision: 'APPROVED', adminNote: '' }}
        >
          <Form.Item name="decision" label="Quyết định" rules={[{ required: true }]}>
            <Radio.Group
              options={[
                { value: 'APPROVED', label: 'Ghi nhận' },
                { value: 'REJECTED', label: 'Đóng' },
              ]}
            />
          </Form.Item>
          <Form.Item name="adminNote" label="Phản hồi tới người dùng">
            <Input.TextArea rows={4} maxLength={2000} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
