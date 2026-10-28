import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import {
  Button,
  Card,
  Drawer,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd'
import type { TableProps } from 'antd'
import { useState } from 'react'
import { catalogService } from '@/api/admin'
import { catalogKeys } from '@/api/keys'
import type { GameRank, GameTypeView, GameView } from '@/api/types'
import { PageHeader } from '@/components/PageHeader'
import { QueryError } from '@/components/QueryError'
import { useApiMutation } from '@/hooks/useApiMutation'
import { usePagedQuery } from '@/hooks/usePagedQuery'
import { trimOrUndefined } from '@/lib/forms'
import { formatDateTime, formatNumber } from '@/lib/format'

interface GameForm {
  name: string
  displayName?: string
  otherNames?: string
  gameTypeIds?: string[]
}

interface GameTypeForm {
  name: string
  shortName?: string
  description?: string
}

export default function CatalogPage() {
  return (
    <>
      <PageHeader title="Danh mục game" description="Quản lý game, thể loại và thứ hạng dùng trong hồ sơ người chơi" />
      <Card>
        <Tabs
          items={[
            { key: 'games', label: 'Game', children: <GamesTab /> },
            { key: 'types', label: 'Thể loại', children: <GameTypesTab /> },
          ]}
        />
      </Card>
    </>
  )
}

function useGameTypeOptions() {
  return useQuery({
    queryKey: catalogKeys.gameTypeOptions,
    queryFn: () => catalogService.gameTypes({ page: 1, pageSize: 100 }),
  })
}

function GamesTab() {
  const [q, setQ] = useState('')
  const [gameTypeId, setGameTypeId] = useState<string | undefined>()
  const [editing, setEditing] = useState<GameView | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [rankTarget, setRankTarget] = useState<GameView | null>(null)
  const [form] = Form.useForm<GameForm>()

  const typesQuery = useGameTypeOptions()
  const typeOptions = (typesQuery.data?.items ?? []).map((item) => ({
    value: item.id,
    label: item.shortName ?? item.name,
  }))

  const { query, pagination, resetPage } = usePagedQuery<GameView>({
    key: [...catalogKeys.games, { q, gameTypeId }],
    fetcher: ({ page, pageSize }) =>
      catalogService.games({ page, pageSize, q: q || undefined, gameTypeId }),
    totalLabel: (total) => `${formatNumber(total)} game`,
  })

  const saveMutation = useApiMutation({
    mutationFn: (input: { id?: string; values: GameForm }) => {
      const body = {
        name: input.values.name.trim(),
        displayName: trimOrUndefined(input.values.displayName),
        otherNames: trimOrUndefined(input.values.otherNames),
        gameTypeIds: input.values.gameTypeIds ?? [],
      }
      return input.id ? catalogService.updateGame(input.id, body) : catalogService.createGame(body)
    },
    successMessage: 'Đã lưu game',
    invalidate: [catalogKeys.games],
    onSuccess: () => {
      setModalOpen(false)
      setEditing(null)
    },
  })

  const deleteMutation = useApiMutation({
    mutationFn: (id: string) => catalogService.deleteGame(id),
    successMessage: 'Đã xoá game',
    invalidate: [catalogKeys.games],
  })

  const openCreate = () => {
    setEditing(null)
    setModalOpen(true)
    form.resetFields()
  }

  const openEdit = (game: GameView) => {
    setEditing(game)
    setModalOpen(true)
    form.setFieldsValue({
      name: game.name,
      displayName: game.displayName ?? '',
      otherNames: game.otherNames ?? '',
      gameTypeIds: game.types.map((item) => item.id),
    })
  }

  const columns: TableProps<GameView>['columns'] = [
    {
      title: 'Game',
      dataIndex: 'name',
      render: (_, row) => (
        <span>
          <div>{row.name}</div>
          <small style={{ color: '#8c8c8c' }}>{row.displayName ?? '—'}</small>
        </span>
      ),
    },
    {
      title: 'Tên khác',
      dataIndex: 'otherNames',
      render: (value: string | null) => value ?? '—',
    },
    {
      title: 'Thể loại',
      dataIndex: 'types',
      width: 220,
      render: (value: GameView['types']) =>
        value.length === 0
          ? '—'
          : value.map((item) => (
              <Tag key={item.id} color="blue">
                {item.shortName ?? item.name}
              </Tag>
            )),
    },
    {
      title: 'Cập nhật',
      dataIndex: 'updatedAt',
      width: 150,
      render: (value: string) => formatDateTime(value),
    },
    {
      title: '',
      key: 'actions',
      width: 190,
      render: (_, row) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(row)}>
            Sửa
          </Button>
          <Button size="small" onClick={() => setRankTarget(row)}>
            Thứ hạng
          </Button>
          <Popconfirm
            title="Xoá game này?"
            description="Chỉ xoá được khi chưa có dữ liệu tham chiếu."
            okText="Xoá"
            cancelText="Huỷ"
            okButtonProps={{ danger: true }}
            onConfirm={() => deleteMutation.mutate(row.id)}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <>
      <Space style={{ marginBottom: 16 }} wrap>
        <Input.Search
          allowClear
          placeholder="Tên game hoặc tên khác"
          style={{ width: 260 }}
          onSearch={(value) => {
            setQ(value.trim())
            resetPage()
          }}
        />
        <Select
          allowClear
          placeholder="Thể loại"
          style={{ width: 180 }}
          value={gameTypeId}
          options={typeOptions}
          loading={typesQuery.isLoading}
          onChange={(value) => {
            setGameTypeId(value)
            resetPage()
          }}
        />
        <Button icon={<ReloadOutlined />} onClick={() => void query.refetch()} loading={query.isFetching}>
          Làm mới
        </Button>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Thêm game
        </Button>
      </Space>

      <QueryError error={query.error} />

      <Table<GameView>
        rowKey="id"
        loading={query.isLoading}
        dataSource={query.data?.items ?? []}
        columns={columns}
        scroll={{ x: 1000 }}
        pagination={pagination}
      />

      <Modal
        title={editing ? `Cập nhật ${editing.name}` : 'Thêm game'}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false)
          setEditing(null)
        }}
        onOk={() => {
          void form.validateFields().then((values) => saveMutation.mutate({ id: editing?.id, values }))
        }}
        confirmLoading={saveMutation.isPending}
        destroyOnHidden
        width={520}
      >
        <Form<GameForm> form={form} layout="vertical" preserve={false}>
          <Form.Item name="name" label="Tên game" rules={[{ required: true, min: 2, max: 100 }]}>
            <Input maxLength={100} />
          </Form.Item>
          <Form.Item name="displayName" label="Tên hiển thị">
            <Input maxLength={100} />
          </Form.Item>
          <Form.Item name="otherNames" label="Tên khác" extra="Phân tách bằng dấu phẩy">
            <Input.TextArea rows={2} maxLength={1000} />
          </Form.Item>
          <Form.Item name="gameTypeIds" label="Thể loại">
            <Select mode="multiple" options={typeOptions} loading={typesQuery.isLoading} allowClear />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title={`Thứ hạng · ${rankTarget?.name ?? ''}`}
        open={rankTarget !== null}
        onClose={() => setRankTarget(null)}
        width={480}
        destroyOnHidden
      >
        {rankTarget ? <RanksPanel gameId={rankTarget.id} /> : null}
      </Drawer>
    </>
  )
}

interface RankForm {
  no: number
  name: string
}

function RanksPanel({ gameId }: { gameId: string }) {
  const [editing, setEditing] = useState<GameRank | null>(null)
  const [form] = Form.useForm<RankForm>()

  const query = useQuery({
    queryKey: catalogKeys.game(gameId),
    queryFn: () => catalogService.game(gameId),
  })

  const invalidate = [catalogKeys.game(gameId), catalogKeys.games]

  const saveMutation = useApiMutation({
    mutationFn: (input: { rankId?: string; values: RankForm }) =>
      input.rankId
        ? catalogService.updateRank(input.rankId, input.values)
        : catalogService.createRank(gameId, input.values),
    successMessage: 'Đã lưu thứ hạng',
    invalidate,
    onSuccess: () => {
      setEditing(null)
      form.resetFields()
    },
  })

  const deleteMutation = useApiMutation({
    mutationFn: (rankId: string) => catalogService.deleteRank(rankId),
    successMessage: 'Đã xoá thứ hạng',
    invalidate,
  })

  const ranks = [...(query.data?.ranks ?? [])].sort((a, b) => a.no - b.no)

  return (
    <>
      <Typography.Paragraph type="secondary">
        Thứ hạng được dùng để xếp hạng người chơi trong game này.
      </Typography.Paragraph>

      <QueryError error={query.error} />

      <Space align="end" style={{ marginBottom: 16 }} wrap>
        <Form<RankForm> form={form} layout="inline" onFinish={(values) => saveMutation.mutate({ rankId: editing?.id, values })}>
          <Form.Item name="no" label="STT" rules={[{ required: true, message: 'STT' }]}>
            <InputNumber min={1} max={100} style={{ width: 90 }} />
          </Form.Item>
          <Form.Item name="name" label="Tên" rules={[{ required: true, message: 'Tên' }]}>
            <Input maxLength={50} style={{ width: 160 }} />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              icon={editing ? <EditOutlined /> : <PlusOutlined />}
              loading={saveMutation.isPending}
            >
              {editing ? 'Lưu' : 'Thêm'}
            </Button>
          </Form.Item>
          {editing ? (
            <Form.Item>
              <Button
                onClick={() => {
                  setEditing(null)
                  form.resetFields()
                }}
              >
                Huỷ
              </Button>
            </Form.Item>
          ) : null}
        </Form>
      </Space>

      <Table<GameRank>
        rowKey="id"
        size="small"
        loading={query.isLoading}
        dataSource={ranks}
        pagination={false}
        columns={[
          { title: 'STT', dataIndex: 'no', width: 70 },
          { title: 'Tên', dataIndex: 'name' },
          {
            title: '',
            key: 'actions',
            width: 110,
            render: (_, row) => (
              <Space>
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => {
                    setEditing(row)
                    form.setFieldsValue({ no: row.no, name: row.name })
                  }}
                />
                <Popconfirm
                  title="Xoá thứ hạng này?"
                  okText="Xoá"
                  cancelText="Huỷ"
                  okButtonProps={{ danger: true }}
                  onConfirm={() => deleteMutation.mutate(row.id)}
                >
                  <Button size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />
    </>
  )
}

function GameTypesTab() {
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState<GameTypeView | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm<GameTypeForm>()

  const { query, pagination, resetPage } = usePagedQuery<GameTypeView>({
    key: [...catalogKeys.gameTypes, { q }],
    fetcher: ({ page, pageSize }) => catalogService.gameTypes({ page, pageSize, q: q || undefined }),
    totalLabel: (total) => `${formatNumber(total)} thể loại`,
  })

  const invalidate = [catalogKeys.gameTypes, catalogKeys.games]

  const saveMutation = useApiMutation({
    mutationFn: (input: { id?: string; values: GameTypeForm }) => {
      const body = {
        name: input.values.name.trim(),
        shortName: trimOrUndefined(input.values.shortName),
        description: trimOrUndefined(input.values.description),
      }
      return input.id ? catalogService.updateGameType(input.id, body) : catalogService.createGameType(body)
    },
    successMessage: 'Đã lưu thể loại',
    invalidate,
    onSuccess: () => {
      setModalOpen(false)
      setEditing(null)
    },
  })

  const deleteMutation = useApiMutation({
    mutationFn: (id: string) => catalogService.deleteGameType(id),
    successMessage: 'Đã xoá thể loại',
    invalidate,
  })

  const columns: TableProps<GameTypeView>['columns'] = [
    { title: 'Tên', dataIndex: 'name' },
    { title: 'Viết tắt', dataIndex: 'shortName', width: 120, render: (value: string | null) => value ?? '—' },
    { title: 'Mô tả', dataIndex: 'description', render: (value: string | null) => value ?? '—' },
    {
      title: 'Số game',
      dataIndex: 'gameCount',
      width: 100,
      align: 'right',
      render: (value: number) => formatNumber(value),
    },
    {
      title: 'Cập nhật',
      dataIndex: 'updatedAt',
      width: 150,
      render: (value: string) => formatDateTime(value),
    },
    {
      title: '',
      key: 'actions',
      width: 120,
      render: (_, row) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditing(row)
              setModalOpen(true)
              form.setFieldsValue({
                name: row.name,
                shortName: row.shortName ?? '',
                description: row.description ?? '',
              })
            }}
          />
          <Popconfirm
            title="Xoá thể loại này?"
            okText="Xoá"
            cancelText="Huỷ"
            okButtonProps={{ danger: true }}
            onConfirm={() => deleteMutation.mutate(row.id)}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <>
      <Space style={{ marginBottom: 16 }} wrap>
        <Input.Search
          allowClear
          placeholder="Tên thể loại"
          style={{ width: 260 }}
          onSearch={(value) => {
            setQ(value.trim())
            resetPage()
          }}
        />
        <Button icon={<ReloadOutlined />} onClick={() => void query.refetch()} loading={query.isFetching}>
          Làm mới
        </Button>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditing(null)
            setModalOpen(true)
            form.resetFields()
          }}
        >
          Thêm thể loại
        </Button>
      </Space>

      <QueryError error={query.error} />

      <Table<GameTypeView>
        rowKey="id"
        loading={query.isLoading}
        dataSource={query.data?.items ?? []}
        columns={columns}
        pagination={pagination}
      />

      <Modal
        title={editing ? `Cập nhật ${editing.name}` : 'Thêm thể loại'}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false)
          setEditing(null)
        }}
        onOk={() => {
          void form.validateFields().then((values) => saveMutation.mutate({ id: editing?.id, values }))
        }}
        confirmLoading={saveMutation.isPending}
        destroyOnHidden
      >
        <Form<GameTypeForm> form={form} layout="vertical" preserve={false}>
          <Form.Item name="name" label="Tên" rules={[{ required: true, min: 2, max: 100 }]}>
            <Input maxLength={100} />
          </Form.Item>
          <Form.Item name="shortName" label="Viết tắt">
            <Input maxLength={50} />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} maxLength={1000} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
