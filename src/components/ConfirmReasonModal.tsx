import { Form, Input, Modal } from 'antd'
import type { ReactNode } from 'react'

interface ConfirmReasonModalProps {
  open: boolean
  title: string
  description: ReactNode
  okText: string
  reasonLabel?: string
  placeholder?: string
  danger?: boolean
  loading?: boolean
  onCancel: () => void
  onConfirm: (reason: string) => void
}

/**
 * Every mutation the API will refuse without a reason uses this dialog, so the
 * reason is captured before the request goes out instead of the console firing
 * a call it already knows will come back 422.
 */
export function ConfirmReasonModal({
  open,
  title,
  description,
  okText,
  reasonLabel = 'Lý do',
  placeholder,
  danger,
  loading,
  onCancel,
  onConfirm,
}: ConfirmReasonModalProps) {
  const [form] = Form.useForm<{ reason: string }>()

  return (
    <Modal
      title={title}
      open={open}
      onCancel={onCancel}
      okText={okText}
      okButtonProps={{ danger, loading }}
      destroyOnHidden
      onOk={() => {
        void form.validateFields().then((values) => onConfirm(values.reason.trim()))
      }}
    >
      <div style={{ marginBottom: 12 }}>{description}</div>
      <Form<{ reason: string }> form={form} layout="vertical" preserve={false}>
        <Form.Item
          name="reason"
          label={reasonLabel}
          rules={[{ required: true, min: 3, max: 500, message: 'Nêu lý do từ 3 đến 500 ký tự' }]}
          extra="Lý do này được ghi vào nhật ký thao tác kèm tên người thực hiện."
        >
          <Input.TextArea rows={2} maxLength={500} showCount placeholder={placeholder} />
        </Form.Item>
      </Form>
    </Modal>
  )
}
