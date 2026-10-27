import {
  AppstoreOutlined,
  BellOutlined,
  DashboardOutlined,
  FlagOutlined,
  HeartOutlined,
  LogoutOutlined,
  MessageOutlined,
  SettingOutlined,
  StarOutlined,
  TeamOutlined,
  ToolOutlined,
  WalletOutlined,
} from '@ant-design/icons'
import { Avatar, Dropdown, Layout, Menu, Space, Typography } from 'antd'
import type { MenuProps } from 'antd'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAdminStore } from '@/auth/store'

const menuItems: MenuProps['items'] = [
  { key: '/', icon: <DashboardOutlined />, label: 'Tổng quan' },
  { type: 'divider' },
  { key: '/users', icon: <TeamOutlined />, label: 'Người dùng' },
  { key: '/withdrawals', icon: <WalletOutlined />, label: 'Chi trả' },
  { key: '/charities', icon: <HeartOutlined />, label: 'Từ thiện' },
  { type: 'divider' },
  { key: '/feedback', icon: <MessageOutlined />, label: 'Feedback' },
  { key: '/reports', icon: <FlagOutlined />, label: 'Báo cáo' },
  { key: '/ratings', icon: <StarOutlined />, label: 'Đánh giá gắn cờ' },
  { type: 'divider' },
  { key: '/catalog', icon: <AppstoreOutlined />, label: 'Danh mục game' },
  { key: '/configs', icon: <SettingOutlined />, label: 'Cấu hình' },
  { type: 'divider' },
  { key: '/broadcast', icon: <BellOutlined />, label: 'Thông báo' },
  { key: '/maintenance', icon: <ToolOutlined />, label: 'Bảo trì' },
]

export function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAdminStore((state) => state.user)
  const signOut = useAdminStore((state) => state.signOut)

  const selectedKey =
    location.pathname === '/' ? '/' : `/${location.pathname.split('/')[1] ?? ''}`

  const accountMenu: MenuProps['items'] = [
    { key: 'profile', label: user?.email ?? 'Quản trị viên', disabled: true },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Đăng xuất', danger: true },
  ]

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
        </Layout.Header>

        <Layout.Content style={{ padding: 24 }}>
          <Outlet />
        </Layout.Content>
      </Layout>
    </Layout>
  )
}
