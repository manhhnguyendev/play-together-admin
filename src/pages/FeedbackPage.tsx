import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert, App, Button, Card, Form, Input, Modal, Radio, Select, Space, Table, Tag } from 'antd'
import type { TableProps } from 'antd'
import { useState } from 'react'
import { adminService, type ListFeedbackParams } from '@/api/admin'
import { toApiError } from '@/api/client'
import { FEEDBACK_STATUSES, type AdminFeedbackView } from '@/api/types'
import { PageHeader } from '@/components/PageHeader'
import { StatusTag } from '@/components/StatusTag'
import { formatDateTime, formatNumber } from '@/lib/format'

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

export default function FeedbackPage() {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [status, setStatus] = useState<string | undefined>('PENDING')
  const [q, setQ] = useState('')
  const [target, setTarget] = useState<AdminFeedbackView | null>(null)
  const [form] = Form.useForm<ResolveForm>()

  const params: ListFeedbackParams = { page, pageSize, status, q: q || undefined }
  const query = useQuery({
    queryKey: ['admin', 'feedback', params],
    queryFn: () => adminService.feedback(params),
    placeholderData: keepPreviousData,
  })

  const mutation = useMutation({
    mutationFn: (input: { id: string; body: ResolveForm }) => adminService.resolveFeedback(input.id, input.body),
    onSuccess: () => {
      message.success('Đã xử lý feedback')
      setTarget(null)
      void queryClient.invalidateQueries({ queryKey: ['admin', 'feedback'] })
    },
    onError: (error) => message.error(toApiError(error).message),
  })

  const columns: TableProps<AdminFeedbackView>['columns'] = [
    {
      title: 'Người gửi',
      dataIndex: ['author', 'name'],
      width: 180,
      render: (_, row) => (
        <span>
          <div>{row.author?.name ?? '—'}</div>
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
              form.setFieldsValue({ decision: 'APPROVED', adminNote: '' })
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
        <Space wrap>
          <Select
            allowClear
            placeholder="Trạng thái"
            style={{ width: 170 }}
            value={status}
            onChange={(value) => {
              setStatus(value)
              setPage(1)
            }}
            options={FEEDBACK_STATUSES.map((value) => ({ value, label: value }))}
          />
          <Input.Search
            allowClear
            placeholder="Tiêu đề hoặc nội dung"
            style={{ width: 280 }}
            onSearch={(value) => {
              setQ(value.trim())
              setPage(1)
            }}
          />
        </Space>
      </Card>

      {query.isError ? (
        <Alert type="error" showIcon title={toApiError(query.error).message} style={{ marginBottom: 16 }} />
      ) : null}

      <Card>
        <Table<AdminFeedbackView>
          rowKey="id"
          loading={query.isLoading}
          dataSource={query.data?.items ?? []}
          columns={columns}
          scroll={{ x: 1100 }}
          pagination={{
            current: query.data?.meta.page ?? page,
            pageSize: query.data?.meta.pageSize ?? pageSize,
            total: query.data?.meta.total ?? 0,
            showSizeChanger: true,
            showTotal: (total) => `${formatNumber(total)} feedback`,
            onChange: (nextPage, nextSize) => {
              setPage(nextPage)
              setPageSize(nextSize)
            },
          }}
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
        <Form<ResolveForm> form={form} layout="vertical" preserve={false}>
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
