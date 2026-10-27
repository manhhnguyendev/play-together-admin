import { useMutation } from '@tanstack/react-query'
import { Alert, App, Button, Card, Form, Input, Result } from 'antd'
import { useState } from 'react'
import { adminService } from '@/api/admin'
import { toApiError } from '@/api/client'
import { PageHeader } from '@/components/PageHeader'

interface BroadcastForm {
  title: string
  body: string
  referenceUrl?: string
}

export default function BroadcastPage() {
  const { message } = App.useApp()
  const [form] = Form.useForm<BroadcastForm>()
  const [recipients, setRecipients] = useState<number | null>(null)

  const mutation = useMutation({
    mutationFn: (values: BroadcastForm) =>
      adminService.broadcast({
        title: values.title.trim(),
        body: values.body.trim(),
        referenceUrl: values.referenceUrl?.trim() || undefined,
      }),
    onSuccess: (result) => {
      setRecipients(result.recipients)
      message.success(`Đã gửi tới ${result.recipients} người dùng`)
      form.resetFields()
    },
    onError: (error) => message.error(toApiError(error).message),
  })

  return (
    <>
      <PageHeader title="Thông báo toàn hệ thống" description="Gửi notification trong app tới mọi tài khoản đang hoạt động" />

      {recipients !== null ? (
        <Result
          status="success"
          title={`Đã gửi tới ${recipients} người dùng`}
          subTitle="Người dùng sẽ thấy thông báo ở mục Thông báo trong app."
          extra={
            <Button type="primary" onClick={() => setRecipients(null)}>
              Gửi thông báo khác
            </Button>
          }
        />
      ) : (
        <Card style={{ maxWidth: 720 }}>
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            title="Thông báo gửi ngay và không thể thu hồi. Kiểm tra kỹ nội dung trước khi gửi."
          />
          <Form<BroadcastForm>
            form={form}
            layout="vertical"
            onFinish={(values) => mutation.mutate(values)}
          >
            <Form.Item
              name="title"
              label="Tiêu đề"
              rules={[{ required: true, min: 3, max: 200, message: 'Tiêu đề từ 3 đến 200 ký tự' }]}
            >
              <Input maxLength={200} showCount placeholder="Bảo trì hệ thống tối nay" />
            </Form.Item>
            <Form.Item
              name="body"
              label="Nội dung"
              rules={[{ required: true, min: 3, max: 1000, message: 'Nội dung từ 3 đến 1000 ký tự' }]}
            >
              <Input.TextArea rows={5} maxLength={1000} showCount />
            </Form.Item>
            <Form.Item
              name="referenceUrl"
              label="Đường dẫn trong app (tuỳ chọn)"
              rules={[{ max: 500, message: 'Tối đa 500 ký tự' }]}
            >
              <Input maxLength={500} placeholder="/notifications hoặc /charity" />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={mutation.isPending}>
              Gửi thông báo
            </Button>
          </Form>
        </Card>
      )}
    </>
  )
}
