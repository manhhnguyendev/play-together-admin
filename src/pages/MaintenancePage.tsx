import { useQuery } from '@tanstack/react-query'
import { Alert, Card, Space, Switch, Tag, Typography } from 'antd'
import { adminService, configService } from '@/api/admin'
import { adminKeys, publicConfigKey } from '@/api/keys'
import { PageHeader } from '@/components/PageHeader'
import { QueryError } from '@/components/QueryError'
import { useApiMutation } from '@/hooks/useApiMutation'

export default function MaintenancePage() {
  const query = useQuery({ queryKey: publicConfigKey, queryFn: configService.public })

  const enabled = (query.data?.maintenanceMode ?? 0) > 0

  const mutation = useApiMutation({
    mutationFn: (next: boolean) => adminService.maintenance({ enabled: next }),
    successMessage: (result) =>
      result.enabled ? 'Đã bật chế độ bảo trì' : 'Đã tắt chế độ bảo trì',
    invalidate: [publicConfigKey, adminKeys.configs],
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
              onChange={(checked) => mutation.mutate(checked)}
              checkedChildren="Bật"
              unCheckedChildren="Tắt"
            />
            <Typography.Text>{enabled ? 'Tắt bảo trì để mở lại hệ thống' : 'Bật bảo trì để tạm khoá hệ thống'}</Typography.Text>
          </Space>

          <Alert
            type="warning"
            showIcon
            title="Khi bật bảo trì, app mobile sẽ hiển thị thông báo bảo trì và chặn tạo đơn mới. Các đơn đang chạy vẫn tiếp tục."
          />
        </Space>
      </Card>
    </>
  )
}
