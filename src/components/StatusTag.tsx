import { Tag } from 'antd'

const STATUS_META: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Chờ xử lý', color: 'gold' },
  PROCESSING: { label: 'Chờ chấp nhận', color: 'gold' },
  ACCEPTED: { label: 'Đang diễn ra', color: 'blue' },
  COMPLETED: { label: 'Hoàn thành', color: 'green' },
  APPROVED: { label: 'Đã duyệt', color: 'green' },
  REJECTED: { label: 'Từ chối', color: 'red' },
  CANCELLED: { label: 'Đã huỷ', color: 'default' },
  EXPIRED: { label: 'Quá hạn', color: 'default' },
  ENDED_EARLY_BY_HIRER: { label: 'Kết thúc sớm (hirer)', color: 'orange' },
  ENDED_EARLY_BY_PLAYER: { label: 'Kết thúc sớm (player)', color: 'orange' },
  INTERRUPTED: { label: 'Bị ngắt', color: 'red' },
  PAID: { label: 'Đã chi', color: 'blue' },
  ONLINE: { label: 'Online', color: 'green' },
  OFFLINE: { label: 'Offline', color: 'default' },
  BUSY: { label: 'Đang bận', color: 'orange' },
  MAINTAIN: { label: 'Bảo trì', color: 'purple' },
  FLAGGED: { label: 'Bị gắn cờ', color: 'volcano' },
  UPHELD: { label: 'Giữ nguyên', color: 'red' },
  DISMISSED: { label: 'Bỏ cờ', color: 'green' },
  NONE: { label: '—', color: 'default' },
}

export function StatusTag({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? { label: status, color: 'default' }
  return <Tag color={meta.color}>{meta.label}</Tag>
}
