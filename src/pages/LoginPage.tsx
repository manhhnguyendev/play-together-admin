import { LockOutlined, MailOutlined } from '@ant-design/icons'
import { Alert, App, Button, Card, Form, Input, Typography } from 'antd'
import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { toApiError } from '@/api/client'
import { useAdminStore } from '@/auth/store'

interface LoginForm {
  email: string
  password: string
}

export default function LoginPage() {
  const status = useAdminStore((state) => state.status)
  const signIn = useAdminStore((state) => state.signIn)
  const authError = useAdminStore((state) => state.error)
  const { message } = App.useApp()
  const [submitting, setSubmitting] = useState(false)

  if (status === 'signedIn') return <Navigate to="/" replace />

  const onFinish = async (values: LoginForm) => {
    setSubmitting(true)
    try {
      await signIn(values.email.trim(), values.password)
      message.success('Đăng nhập thành công')
    } catch (error) {
      message.error(toApiError(error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: 'linear-gradient(135deg, #e6f4ff 0%, #f6ffed 100%)',
        padding: 24,
      }}
    >
      <Card style={{ width: 400, boxShadow: '0 12px 40px rgba(0,0,0,0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Typography.Title level={3} style={{ marginBottom: 4 }}>
            Play Together
          </Typography.Title>
          <Typography.Text type="secondary">Bảng điều khiển quản trị</Typography.Text>
        </div>

        {authError ? (
          <Alert type="warning" title={authError} showIcon style={{ marginBottom: 16 }} />
        ) : null}

        <Form<LoginForm> layout="vertical" onFinish={onFinish} disabled={submitting}>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, message: 'Nhập email quản trị' }]}
          >
            <Input prefix={<MailOutlined />} placeholder="admin@playtogether.local" autoComplete="username" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[{ required: true, message: 'Nhập mật khẩu' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="••••••••" autoComplete="current-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={submitting}>
            Đăng nhập
          </Button>
        </Form>

        <Typography.Paragraph type="secondary" style={{ marginTop: 16, marginBottom: 0, fontSize: 12 }}>
          Tài khoản demo: <code>admin@playtogether.local</code> / <code>Admin@12345</code>
        </Typography.Paragraph>
      </Card>
    </div>
  )
}
