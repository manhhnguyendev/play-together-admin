import {
  AccountBookOutlined,
  AppstoreOutlined,
  AuditOutlined,
  BellOutlined,
  DashboardOutlined,
  FlagOutlined,
  HeartOutlined,
  LogoutOutlined,
  MessageOutlined,
  ProfileOutlined,
  SettingOutlined,
  StarOutlined,
  TeamOutlined,
  ToolOutlined,
  WalletOutlined,
} from '@ant-design/icons'
import { Alert, Avatar, Dropdown, Layout, Menu, Result, Space, Tag, Typography } from 'antd'
import type { MenuProps } from 'antd'
import type { ReactNode } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAdminStore } from '@/auth/store'
import { canOpenPath, tierOf, visibleSections } from '@/auth/permissions'
import { ADMIN_TIER_LABELS } from '@/lib/labels'

/** Sections in reading order; each key is the route prefix it guards. */
const GROUPS: { title: string; items: { key: string; icon: ReactNode; label: string }[] }[] = [
  {
    title: '',
    items: [{ key: '/', icon: <DashboardOutlined />, label: 'Tổng quan' }],
  },
  {
    title: 'Vận hành',
    items: [
      { key: '/orders', icon: <ProfileOutlined />, label: 'Đơn thuê' },
      { key: '/users', icon: <TeamOutlined />, label: 'Tài khoản' },
      { key: '/withdrawals', icon: <WalletOutlined />, label: 'Chi trả' },
      { key: '/money', icon: <AccountBookOutlined />, label: 'Sổ tiền' },
      { key: '/charities', icon: <HeartOutlined />, label: 'Từ thiện' },
    ],
  },
  {
    title: 'Kiểm duyệt',
    items: [
      { key: '/reports', icon: <FlagOutlined />, label: 'Báo cáo' },
      { key: '/ratings', icon: <StarOutlined />, label: 'Đánh giá gắn cờ' },
      { key: '/feedback', icon: <MessageOutlined />, label: 'Phản hồi' },
      { key: '/broadcast', icon: <BellOutlined />, label: 'Thông báo' },
    ],
  },
  {
    title: 'Quản trị',
    items: [
      { key: '/catalog', icon: <AppstoreOutlined />, label: 'Danh mục game' },
      { key: '/configs', icon: <SettingOutlined />, label: 'Cấu hình' },
      { key: '/maintenance', icon: <ToolOutlined />, label: 'Bảo trì' },
      { key: '/audit', icon: <AuditOutlined />, label: 'Nhật ký thao tác' },
    ],
  },
]

export function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAdminStore((state) => state.user)
  const signOut = useAdminStore((state) => state.signOut)

  const tier = tierOf(user)
  const allowed = visibleSections(tier)
  const selectedKey = canOpenPath(tier, location.pathname)
    ? `/${location.pathname.split('/')[1] ?? ''}`
    : '/'

  const menuItems: MenuProps['items'] = GROUPS.flatMap((group) => {
    const items = group.items.filter((item) => allowed.includes(item.key))
    if (items.length === 0) return []
    const labelled = group.title
      ? [{ key: `group:${group.title}`, label: group.title, type: 'group' as const }]
      : []
    return [
      ...labelled,
      ...items.map((item) => ({ key: item.key, icon: item.icon, label: item.label })),
      { type: 'divider' as const },
    ]
  })
  menuItems.pop()

  const accountMenu: MenuProps['items'] = [
    { key: 'profile', label: user?.email ?? 'Quản trị viên', disabled: true },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Đăng xuất', danger: true },
  ]

  const denied = !canOpenPath(tier, location.pathname)

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Sider width={228} breakpoint="lg" collapsedWidth={64} theme="dark">
        <div
          style={{
            height: 56,
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 20,
            color: '#fff',
            fontWeight: 700,
            letterSpacing: 0.3,
          }}
        >
          Play Together
        </div>
        <Menu
          theme="dark"
          mode="inline"
          items={menuItems}
          selectedKeys={[selectedKey]}
          onClick={({ key }) => navigate(key)}
        />
      </Layout.Sider>

      <Layout>
        <Layout.Header
          style={{
            background: '#fff',
            paddingInline: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <Space size={12}>
            {tier ? (
              <Tag color={tier === 'SUPER_ADMIN' ? 'purple' : 'blue'}>{ADMIN_TIER_LABELS[tier]}</Tag>
            ) : (
              <Tag>Tài khoản chưa được phân quyền</Tag>
            )}
            <Dropdown
              menu={{
                items: accountMenu,
                onClick: ({ key }) => {
                  if (key === 'logout') void signOut()
                },
              }}
              placement="bottomRight"
            >
              <Space style={{ cursor: 'pointer' }}>
                <Avatar size="small">{user?.name?.slice(0, 1) ?? 'A'}</Avatar>
                <Typography.Text>{user?.name ?? 'Quản trị viên'}</Typography.Text>
              </Space>
            </Dropdown>
          </Space>
        </Layout.Header>

        <Layout.Content style={{ padding: 24 }}>
          {denied ? (
            <>
              {tier === null ? (
                <Alert
                  type="warning"
                  showIcon
                  title="Tài khoản của bạn chưa được gán quyền vận hành"
                  description="Một quản trị viên cao nhất có thể gán quyền Kiểm duyệt hoặc Tài chính cho tài khoản này. Đăng xuất rồi đăng nhập lại sau khi được gán."
                  style={{ marginBottom: 16 }}
                />
              ) : null}
              <Result
                status="403"
                title="Trang này nằm ngoài quyền của bạn"
                subTitle="Mỗi nhóm vận hành chỉ thấy phần việc của mình. Quay lại bảng tổng quan để xem những gì bạn được phép làm."
                extra={
                  <a onClick={() => navigate('/')}>Về bảng tổng quan</a>
                }
              />
            </>
          ) : (
            <Outlet />
          )}
        </Layout.Content>
      </Layout>
    </Layout>
  )
}
