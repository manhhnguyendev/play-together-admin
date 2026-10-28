import { ArrowRightOutlined, ReloadOutlined } from '@ant-design/icons'
import { Button, Card, Form, Input, Modal, Radio, Select, Space, Table, Tabs } from 'antd'
import type { TableProps } from 'antd'
import { useState } from 'react'
import { adminService } from '@/api/admin'
import { adminKeys } from '@/api/keys'
import {
  WITHDRAWAL_STATUSES,
  type CharityWithdrawalView,
  type WithdrawalStatus,
  type WithdrawalView,
} from '@/api/types'
import { PageHeader } from '@/components/PageHeader'
import { QueryError } from '@/components/QueryError'
import { StatusTag } from '@/components/StatusTag'
import { useApiMutation } from '@/hooks/useApiMutation'
import { usePagedQuery } from '@/hooks/usePagedQuery'
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
  const [status, setStatus] = useState<WithdrawalStatus | undefined>('PENDING')
  const [target, setTarget] = useState<WithdrawalView | null>(null)
  const [form] = Form.useForm<ResolveForm>()

  const { query, pagination, resetPage } = usePagedQuery<WithdrawalView>({
    key: [...adminKeys.withdrawals, { status }],
    fetcher: ({ page, pageSize }) => adminService.withdrawals({ page, pageSize, status }),
    totalLabel: (total) => `${formatNumber(total)} yêu cầu`,
  })

  const mutation = useApiMutation({
    mutationFn: (input: { id: string; body: ResolveForm }) =>
      adminService.resolveWithdrawal(input.id, {
        status: input.body.decision,
        note: input.body.note,
      }),
    successMessage: 'Đã xử lý yêu cầu',
    invalidate: [adminKeys.withdrawals, adminKeys.stats],
    onSuccess: () => setTarget(null),
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
            resetPage()
          }}
          options={STATUS_OPTIONS}
        />
        <Button icon={<ReloadOutlined />} onClick={() => void query.refetch()} loading={query.isFetching}>
          Làm mới
        </Button>
      </Space>

      <QueryError error={query.error} />

      <Table<WithdrawalView>
        rowKey="id"
        loading={query.isLoading}
        dataSource={query.data?.items ?? []}
        columns={columns}
        scroll={{ x: 1000 }}
        pagination={pagination}
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
  const [status, setStatus] = useState<WithdrawalStatus | undefined>('PENDING')
  const [target, setTarget] = useState<CharityWithdrawalView | null>(null)
  const [form] = Form.useForm<ResolveForm>()

  const { query, pagination, resetPage } = usePagedQuery<CharityWithdrawalView>({
    key: [...adminKeys.charityWithdrawals, { status }],
    fetcher: ({ page, pageSize }) => adminService.charityWithdrawals({ page, pageSize, status }),
    totalLabel: (total) => `${formatNumber(total)} yêu cầu`,
  })

  const mutation = useApiMutation({
    mutationFn: (input: { id: string; body: ResolveForm }) =>
      adminService.resolveCharityWithdrawal(input.id, {
        decision: input.body.decision,
        note: input.body.note,
      }),
    successMessage: 'Đã xử lý yêu cầu',
    invalidate: [adminKeys.charityWithdrawals, adminKeys.stats],
    onSuccess: () => setTarget(null),
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
            resetPage()
          }}
          options={STATUS_OPTIONS}
        />
        <Button icon={<ReloadOutlined />} onClick={() => void query.refetch()} loading={query.isFetching}>
          Làm mới
        </Button>
      </Space>

      <QueryError error={query.error} />

      <Table<CharityWithdrawalView>
        rowKey="id"
        loading={query.isLoading}
        dataSource={query.data?.items ?? []}
        columns={columns}
        scroll={{ x: 900 }}
        pagination={pagination}
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
