import { useQuery } from '@tanstack/react-query'
import { Alert, Card, Space, Switch, Tag, Typography } from 'antd'
import { useState } from 'react'
import { adminService, configService } from '@/api/admin'
import { adminKeys, publicConfigKey } from '@/api/keys'
import { ConfirmReasonModal } from '@/components/ConfirmReasonModal'
import { PageHeader } from '@/components/PageHeader'
import { QueryError } from '@/components/QueryError'
import { useApiMutation } from '@/hooks/useApiMutation'

export default function MaintenancePage() {
  const [next, setNext] = useState<boolean | null>(null)

  const query = useQuery({ queryKey: publicConfigKey, queryFn: configService.public })

  const enabled = (query.data?.maintenanceMode ?? 0) > 0

  const mutation = useApiMutation({
    mutationFn: (input: { enabled: boolean; reason: string }) => adminService.maintenance(input),
    successMessage: (result) => (result.enabled ? 'Đã bật chế độ bảo trì' : 'Đã tắt chế độ bảo trì'),
    invalidate: [publicConfigKey, adminKeys.configs],
    onSuccess: () => setNext(null),
  })

  return (
    <>
      <PageHeader title="Chế độ bảo trì" description="Tạm khoá các thao tác đặt đơn khi hệ thống cần bảo trì" />

      <QueryError error={query.error} />

      <Card style={{ maxWidth: 640 }} loading={query.isLoading}>
        <Space orientation="vertical" size={16} style={{ width: '100%' }}>
          <Space size={12}>
            <Typography.Text strong>Trạng thái hiện tại:</Typography.Text>
            <Tag color={enabled ? 'red' : 'green'}>{enabled ? 'ĐANG BẢO TRÌ' : 'Đang hoạt động'}</Tag>
          </Space>

          <Space size={12}>
            <Switch
              checked={enabled}
              loading={mutation.isPending}
              onChange={(checked) => setNext(checked)}
              checkedChildren="Bật"
              unCheckedChildren="Tắt"
            />
            <Typography.Text>
              {enabled ? 'Tắt bảo trì để mở lại hệ thống' : 'Bật bảo trì để tạm khoá hệ thống'}
            </Typography.Text>
          </Space>

          <Alert
            type="warning"
            showIcon
            title="Khi bật bảo trì, app mobile sẽ hiển thị thông báo bảo trì và chặn tạo đơn mới. Các đơn đang chạy vẫn tiếp tục."
          />
        </Space>
      </Card>

      <ConfirmReasonModal
        open={next !== null}
        title={next ? 'Bật chế độ bảo trì?' : 'Tắt chế độ bảo trì?'}
        danger={Boolean(next)}
        loading={mutation.isPending}
        okText={next ? 'Bật bảo trì' : 'Tắt bảo trì'}
        reasonLabel="Lý do"
        placeholder={next ? 'Cập nhật cấu hình thanh toán, dự kiến 20 phút' : 'Hệ thống đã kiểm tra xong'}
        description={
          next ? (
            <span>
              Người dùng sẽ không đặt được đơn mới cho tới khi tắt bảo trì. Đơn đang chạy vẫn được giữ.
            </span>
          ) : (
            <span>Hệ thống mở lại cho mọi tài khoản ngay khi tắt.</span>
          )
        }
        onCancel={() => setNext(null)}
        onConfirm={(reason) => {
          if (next !== null) mutation.mutate({ enabled: next, reason })
        }}
      />
    </>
  )
}
