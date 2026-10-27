import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  App,
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
import { adminService, type ListReportsParams, type ResolveReportBody } from '@/api/admin'
import { toApiError } from '@/api/client'
import { REPORT_STATUSES, type ReportDto } from '@/api/types'
import { PageHeader } from '@/components/PageHeader'
import { StatusTag } from '@/components/StatusTag'
import { formatDateTime, formatNumber } from '@/lib/format'

export default function ReportsPage() {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [status, setStatus] = useState<string | undefined>('PENDING')
  const [q, setQ] = useState('')
  const [target, setTarget] = useState<ReportDto | null>(null)
  const [form] = Form.useForm<ResolveReportBody>()

  const params: ListReportsParams = { page, pageSize, status, q: q || undefined }
  const query = useQuery({
    queryKey: ['admin', 'reports', params],
    queryFn: () => adminService.reports(params),
    placeholderData: keepPreviousData,
  })

  const mutation = useMutation({
    mutationFn: (input: { id: string; body: ResolveReportBody }) => adminService.resolveReport(input.id, input.body),
    onSuccess: () => {
      message.success('Đã xử lý báo cáo')
      setTarget(null)
      void queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
    onError: (error) => message.error(toApiError(error).message),
  })

  const columns: TableProps<ReportDto>['columns'] = [
    {
      title: 'Người báo cáo',
      dataIndex: ['reporter', 'name'],
      width: 160,
      render: (value: string | undefined) => value ?? '—',
    },
    {
      title: 'Bị báo cáo',
      dataIndex: ['target', 'name'],
      width: 160,
      render: (value: string | undefined) => value ?? '—',
    },
    {
      title: 'Nội dung',
      dataIndex: 'message',
      ellipsis: true,
      render: (value: string) => <Typography.Text>{value}</Typography.Text>,
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
              form.setFieldsValue({
                decision: 'APPROVED',
                note: '',
                points: 0,
                satisfaction: 0,
                disableAccount: false,
                refundAmount: 0,
              })
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
            options={REPORT_STATUSES.map((value) => ({ value, label: value }))}
          />
          <Input.Search
            allowClear
            placeholder="Nội dung báo cáo"
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
        <Table<ReportDto>
          rowKey="id"
          loading={query.isLoading}
          dataSource={query.data?.items ?? []}
          columns={columns}
          scroll={{ x: 1000 }}
          pagination={{
            current: query.data?.meta.page ?? page,
            pageSize: query.data?.meta.pageSize ?? pageSize,
            total: query.data?.meta.total ?? 0,
            showSizeChanger: true,
            showTotal: (total) => `${formatNumber(total)} báo cáo`,
            onChange: (nextPage, nextSize) => {
              setPage(nextPage)
              setPageSize(nextSize)
            },
          }}
        />
      </Card>

      <Modal
        title="Xử lý báo cáo"
        open={target !== null}
        width={640}
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
          <Descriptions size="small" column={1} style={{ marginBottom: 16 }}>
            <Descriptions.Item label="Người báo cáo">{target.reporter?.name ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Tài khoản bị báo cáo">{target.target?.name ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Mã đơn">{target.orderId}</Descriptions.Item>
            <Descriptions.Item label="Nội dung">{target.message}</Descriptions.Item>
          </Descriptions>
        ) : null}

        <Form<ResolveReportBody> form={form} layout="vertical" preserve={false}>
          <Form.Item name="decision" label="Quyết định" rules={[{ required: true }]}>
            <Radio.Group
              options={[
                { value: 'APPROVED', label: 'Chấp nhận (áp dụng hình phạt)' },
                { value: 'REJECTED', label: 'Bác bỏ' },
              ]}
            />
          </Form.Item>
          <Form.Item name="note" label="Ghi chú xử lý">
            <Input.TextArea rows={3} maxLength={1000} />
          </Form.Item>
          <Space size={24} wrap>
            <Form.Item name="points" label="Trừ điểm hành vi">
              <InputNumber min={0} max={100} style={{ width: 140 }} />
            </Form.Item>
            <Form.Item name="satisfaction" label="Trừ điểm hài lòng">
              <InputNumber min={0} max={100} style={{ width: 140 }} />
            </Form.Item>
            <Form.Item name="refundAmount" label="Hoàn tiền cho hirer">
              <InputNumber min={0} step={10000} style={{ width: 170 }} />
            </Form.Item>
          </Space>
          <Form.Item name="disableAccount" label="Khoá tài khoản bị báo cáo" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
