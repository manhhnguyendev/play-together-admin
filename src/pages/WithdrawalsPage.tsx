import { ArrowRightOutlined, ReloadOutlined } from '@ant-design/icons'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  App,
  Button,
  Card,
  Form,
  Input,
  Modal,
  Radio,
  Select,
  Space,
  Table,
  Tabs,
} from 'antd'
import type { TableProps } from 'antd'
import { useState } from 'react'
import { adminService } from '@/api/admin'
import { toApiError } from '@/api/client'
import { WITHDRAWAL_STATUSES, type CharityWithdrawalView, type WithdrawalView } from '@/api/types'
import { PageHeader } from '@/components/PageHeader'
import { StatusTag } from '@/components/StatusTag'
import { formatDateTime, formatMoney, formatNumber } from '@/lib/format'

interface ResolveForm {
  decision: 'PAID' | 'REJECTED'
  note?: string
}

const STATUS_OPTIONS = WITHDRAWAL_STATUSES.map((value) => ({ value, label: value }))

export default function WithdrawalsPage() {
  return (
    <>
      <PageHeader title="Chi trả" description="Duyệt yêu cầu rút tiền của người dùng và tổ chức từ thiện" />
      <Card>
        <Tabs
          items={[
            { key: 'user', label: 'Người dùng', children: <UserWithdrawals /> },
            { key: 'charity', label: 'Tổ chức từ thiện', children: <CharityWithdrawals /> },
          ]}
        />
      </Card>
    </>
  )
}

function UserWithdrawals() {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [status, setStatus] = useState<string | undefined>('PENDING')
  const [target, setTarget] = useState<WithdrawalView | null>(null)
  const [form] = Form.useForm<ResolveForm>()

  const params = { page, pageSize, status: status as WithdrawalView['status'] | undefined }
  const query = useQuery({
    queryKey: ['admin', 'withdrawals', params],
    queryFn: () => adminService.withdrawals(params),
    placeholderData: keepPreviousData,
  })

  const mutation = useMutation({
    mutationFn: (input: { id: string; body: ResolveForm }) =>
      adminService.resolveWithdrawal(input.id, { status: input.body.decision, note: input.body.note }),
    onSuccess: () => {
      message.success('Đã xử lý yêu cầu')
      setTarget(null)
      void queryClient.invalidateQueries({ queryKey: ['admin', 'withdrawals'] })
    },
    onError: (error) => message.error(toApiError(error).message),
  })

  const columns: TableProps<WithdrawalView>['columns'] = [
    {
      title: 'Người dùng',
      dataIndex: ['user', 'name'],
      render: (_, row) => (
        <span>
          <div>{row.user.name}</div>
          <small style={{ color: '#8c8c8c' }}>{row.user.email}</small>
        </span>
      ),
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      align: 'right',
      width: 140,
      render: (value: number) => formatMoney(value),
    },
    { title: 'Trạng thái', dataIndex: 'status', width: 130, render: (value: string) => <StatusTag status={value} /> },
    { title: 'Tạo lúc', dataIndex: 'createdAt', width: 150, render: (value: string) => formatDateTime(value) },
    {
      title: 'Xử lý lúc',
      dataIndex: 'processedAt',
      width: 150,
      render: (value: string | null) => formatDateTime(value),
    },
    { title: 'Ghi chú', dataIndex: 'note', render: (value: string | null) => value ?? '—' },
    {
      title: '',
      key: 'actions',
      width: 120,
      render: (_, row) =>
        row.status === 'PENDING' ? (
          <Button
            size="small"
            type="primary"
            onClick={() => {
              setTarget(row)
              form.setFieldsValue({ decision: 'PAID', note: '' })
            }}
          >
            Xử lý
          </Button>
        ) : null,
    },
  ]

  return (
    <>
      <Space style={{ marginBottom: 16 }} wrap>
        <Select
          allowClear
          placeholder="Trạng thái"
          style={{ width: 160 }}
          value={status}
          onChange={(value) => {
            setStatus(value)
            setPage(1)
          }}
          options={STATUS_OPTIONS}
        />
        <Button icon={<ReloadOutlined />} onClick={() => void query.refetch()} loading={query.isFetching}>
          Làm mới
        </Button>
      </Space>

      {query.isError ? (
        <Alert type="error" showIcon title={toApiError(query.error).message} style={{ marginBottom: 16 }} />
      ) : null}

      <Table<WithdrawalView>
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
          showTotal: (total) => `${formatNumber(total)} yêu cầu`,
          onChange: (nextPage, nextSize) => {
            setPage(nextPage)
            setPageSize(nextSize)
          },
        }}
      />

      <ResolveModal
        title={`Xử lý chi trả · ${target?.user.name ?? ''}`}
        open={target !== null}
        form={form}
        amount={target?.amount}
        loading={mutation.isPending}
        onCancel={() => setTarget(null)}
        onOk={(values) => {
          if (target) mutation.mutate({ id: target.id, body: values })
        }}
      />
    </>
  )
}

function CharityWithdrawals() {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [status, setStatus] = useState<string | undefined>('PENDING')
  const [target, setTarget] = useState<CharityWithdrawalView | null>(null)
  const [form] = Form.useForm<ResolveForm>()

  const params = { page, pageSize, status: status as CharityWithdrawalView['status'] | undefined }
  const query = useQuery({
    queryKey: ['admin', 'charity-withdrawals', params],
    queryFn: () => adminService.charityWithdrawals(params),
    placeholderData: keepPreviousData,
  })

  const mutation = useMutation({
    mutationFn: (input: { id: string; body: ResolveForm }) =>
      adminService.resolveCharityWithdrawal(input.id, {
        decision: input.body.decision,
        note: input.body.note,
      }),
    onSuccess: () => {
      message.success('Đã xử lý yêu cầu')
      setTarget(null)
      void queryClient.invalidateQueries({ queryKey: ['admin', 'charity-withdrawals'] })
    },
    onError: (error) => message.error(toApiError(error).message),
  })

  const columns: TableProps<CharityWithdrawalView>['columns'] = [
    { title: 'Tổ chức', dataIndex: 'charityName', render: (value: string | null) => value ?? '—' },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      align: 'right',
      width: 140,
      render: (value: number) => formatMoney(value),
    },
    { title: 'Trạng thái', dataIndex: 'status', width: 130, render: (value: string) => <StatusTag status={value} /> },
    { title: 'Tạo lúc', dataIndex: 'createdAt', width: 150, render: (value: string) => formatDateTime(value) },
    {
      title: 'Xử lý lúc',
      dataIndex: 'processedAt',
      width: 150,
      render: (value: string | null) => formatDateTime(value),
    },
    { title: 'Ghi chú', dataIndex: 'note', render: (value: string | null) => value ?? '—' },
    {
      title: '',
      key: 'actions',
      width: 120,
      render: (_, row) =>
        row.status === 'PENDING' ? (
          <Button
            size="small"
            type="primary"
            onClick={() => {
              setTarget(row)
              form.setFieldsValue({ decision: 'PAID', note: '' })
            }}
          >
            Xử lý <ArrowRightOutlined />
          </Button>
        ) : null,
    },
  ]

  return (
    <>
      <Space style={{ marginBottom: 16 }} wrap>
        <Select
          allowClear
          placeholder="Trạng thái"
          style={{ width: 160 }}
          value={status}
          onChange={(value) => {
            setStatus(value)
            setPage(1)
          }}
          options={STATUS_OPTIONS}
        />
        <Button icon={<ReloadOutlined />} onClick={() => void query.refetch()} loading={query.isFetching}>
          Làm mới
        </Button>
      </Space>

      {query.isError ? (
        <Alert type="error" showIcon title={toApiError(query.error).message} style={{ marginBottom: 16 }} />
      ) : null}

      <Table<CharityWithdrawalView>
        rowKey="id"
        loading={query.isLoading}
        dataSource={query.data?.items ?? []}
        columns={columns}
        scroll={{ x: 900 }}
        pagination={{
          current: query.data?.meta.page ?? page,
          pageSize: query.data?.meta.pageSize ?? pageSize,
          total: query.data?.meta.total ?? 0,
          showSizeChanger: true,
          showTotal: (total) => `${formatNumber(total)} yêu cầu`,
          onChange: (nextPage, nextSize) => {
            setPage(nextPage)
            setPageSize(nextSize)
          },
        }}
      />

      <ResolveModal
        title={`Xử lý chi trả từ thiện · ${target?.charityName ?? ''}`}
        open={target !== null}
        form={form}
        amount={target?.amount}
        loading={mutation.isPending}
        onCancel={() => setTarget(null)}
        onOk={(values) => {
          if (target) mutation.mutate({ id: target.id, body: values })
        }}
      />
    </>
  )
}

function ResolveModal({
  title,
  open,
  form,
  amount,
  loading,
  onCancel,
  onOk,
}: {
  title: string
  open: boolean
  form: ReturnType<typeof Form.useForm<ResolveForm>>[0]
  amount?: number
  loading: boolean
  onCancel: () => void
  onOk: (values: ResolveForm) => void
}) {
  return (
    <Modal
      title={title}
      open={open}
      onCancel={onCancel}
      confirmLoading={loading}
      destroyOnHidden
      onOk={() => {
        void form.validateFields().then(onOk)
      }}
    >
      <Form<ResolveForm> form={form} layout="vertical" preserve={false}>
        {amount !== undefined ? (
          <Form.Item label="Số tiền">
            <strong>{formatMoney(amount)}</strong>
          </Form.Item>
        ) : null}
        <Form.Item name="decision" label="Quyết định" rules={[{ required: true }]}>
          <Radio.Group
            options={[
              { value: 'PAID', label: 'Đã chi' },
              { value: 'REJECTED', label: 'Từ chối' },
            ]}
          />
        </Form.Item>
        <Form.Item name="note" label="Ghi chú">
          <Input.TextArea rows={3} maxLength={255} />
        </Form.Item>
      </Form>
    </Modal>
  )
}
