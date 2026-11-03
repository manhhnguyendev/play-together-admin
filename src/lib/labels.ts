import type { AdminTier } from '@/api/types'

/**
 * Plain-language labels for every enum the console shows. Screens must never
 * print a raw API value, so anything missing here falls back to the value itself
 * and is obvious enough to fix.
 */

export const ADMIN_TIER_LABELS: Record<AdminTier, string> = {
  SUPER_ADMIN: 'Quản trị cao nhất',
  MODERATOR: 'Kiểm duyệt',
  FINANCE: 'Tài chính',
}

export const USER_ROLE_LABELS: Record<string, string> = {
  USER: 'Người dùng',
  ADMIN: 'Quản trị',
  CHARITY: 'Tổ chức từ thiện',
}

export const LEDGER_TYPE_LABELS: Record<string, string> = {
  DEPOSIT: 'Nạp tiền',
  WITHDRAWAL: 'Rút tiền',
  ESCROW_HOLD: 'Giữ tiền đơn',
  ESCROW_RELEASE: 'Trả cho người chơi',
  ESCROW_REFUND: 'Hoàn cho người thuê',
  ORDER_EARNING: 'Thù lao người chơi',
  PLATFORM_FEE: 'Phí nền tảng',
  DONATION: 'Quyên góp',
  REPORT_REFUND: 'Hoàn theo báo cáo',
  MAINTENANCE_REFUND: 'Hoàn vì bảo trì',
  CHARITY_WITHDRAWAL: 'Chi cho tổ chức từ thiện',
  ADJUSTMENT: 'Điều chỉnh thủ công',
}

export const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  USER: 'Tài khoản người dùng',
  CHARITY: 'Tổ chức từ thiện',
  PLATFORM: 'Nền tảng',
  ESCROW: 'Ký quỹ của đơn',
  EXTERNAL: 'Đơn vị thanh toán',
}

export const DIRECTION_LABELS: Record<string, string> = {
  DEBIT: 'Chi ra',
  CREDIT: 'Thu vào',
}

export const CLOSE_REASON_LABELS: Record<string, string> = {
  REJECTED_BY_PLAYER: 'Người chơi từ chối',
  CANCELLED_BY_HIRER: 'Người thuê huỷ',
  EXPIRED: 'Hết hạn chờ phản hồi',
  INTERRUPTED_BY_ADMIN: 'Quản trị viên dừng vì khoá tài khoản',
}

export const ORDER_PARTY_LABELS: Record<string, string> = {
  HIRER: 'Bên thuê',
  PLAYER: 'Bên chơi',
}

export const BEHAVIOR_EVENT_LABELS: Record<string, string> = {
  RATING_RECEIVED: 'Nhận đánh giá',
  RATING_REVOKED: 'Bị huỷ đánh giá',
  ORDER_REJECTED: 'Từ chối đơn',
  ORDER_EXPIRED: 'Đơn hết hạn',
  ORDER_EARLY_END: 'Kết thúc sớm',
  REPORT_APPROVED: 'Bị xác minh là vi phạm',
  MANUAL_ADJUSTMENT: 'Điều chỉnh thủ công',
}

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  'user.update': 'Đổi trạng thái hoặc quyền tài khoản',
  'user.behavior_adjust': 'Cộng trừ điểm thủ công',
  'feedback.resolve': 'Phản hồi feedback',
  'notification.broadcast': 'Gửi thông báo toàn hệ thống',
  'system.maintenance': 'Bật/tắt chế độ bảo trì',
  'withdrawal.resolve': 'Duyệt yêu cầu rút tiền',
  'charity.create': 'Thêm tổ chức từ thiện',
  'charity.update': 'Sửa tổ chức từ thiện',
  'charity.payout_resolve': 'Duyệt chi cho từ thiện',
  'report.resolve': 'Xử lý báo cáo',
  'rating.violation_resolve': 'Gỡ hoặc giữ đánh giá bị cờ',
  'catalog.game_create': 'Thêm game',
  'catalog.game_update': 'Sửa game',
  'catalog.game_delete': 'Xoá game',
  'catalog.rank_create': 'Thêm hạng game',
  'catalog.rank_update': 'Sửa hạng game',
  'catalog.rank_delete': 'Xoá hạng game',
  'catalog.game_type_create': 'Thêm thể loại game',
  'catalog.game_type_update': 'Sửa thể loại game',
  'catalog.game_type_delete': 'Xoá thể loại game',
  'config.create': 'Thêm cấu hình',
  'config.update': 'Sửa cấu hình',
  'config.delete': 'Xoá cấu hình',
}

export const AUDIT_ENTITY_LABELS: Record<string, string> = {
  user: 'Tài khoản',
  withdrawal: 'Yêu cầu rút tiền',
  charity: 'Tổ chức từ thiện',
  charity_withdrawal: 'Yêu cầu chi từ thiện',
  feedback: 'Phản hồi',
  report: 'Báo cáo',
  rating: 'Đánh giá',
  notification: 'Thông báo',
  system: 'Hệ thống',
  config: 'Cấu hình',
  game: 'Game',
  game_type: 'Thể loại game',
  game_rank: 'Hạng game',
}

/**
 * Tiers shown next to an account name. The audit trail stores the tier as text,
 * so an unknown value is displayed rather than guessed at.
 */
export const adminTierLabel = (tier: string | null | undefined): string =>
  tier ? (ADMIN_TIER_LABELS[tier as AdminTier] ?? tier) : 'Chưa phân quyền'

export const labelOf = (labels: Record<string, string>, value: string | null | undefined): string =>
  value === null || value === undefined ? '—' : (labels[value] ?? value)

/**
 * Basis points are what the API stores; operators read percentages. `fee_bps` is
 * any integer 0..5000, and an integer divided by 100 never needs more than two
 * decimals — so two is exact, while one would round a 123 bps fee to "1,2%" and
 * leave the operator reconciling a percentage the money does not add up to.
 */
export const formatBasisPoints = (value: number): string => `${(value / 100).toLocaleString('vi-VN', { maximumFractionDigits: 2 })}%`

export interface StatusMeta {
  label: string
  color: string
}

/**
 * Lifecycle words shared by the table cells and the filters that offer them, so
 * a queue and its dropdown can never disagree about what `PENDING` means.
 * Withdrawals, reports and feedback reuse PENDING, APPROVED and REJECTED.
 */
export const STATUS_META: Record<string, StatusMeta> = {
  PENDING: { label: 'Chờ xử lý', color: 'gold' },
  APPROVED: { label: 'Đã duyệt', color: 'green' },
  REJECTED: { label: 'Từ chối', color: 'red' },
  CANCELLED: { label: 'Đã huỷ', color: 'default' },
  PAID: { label: 'Đã chi', color: 'blue' },
  // Session lifecycle, and separately why a closed order ended.
  PROPOSED: { label: 'Chờ chấp nhận', color: 'gold' },
  SCHEDULED: { label: 'Đã hẹn', color: 'cyan' },
  LIVE: { label: 'Đang diễn ra', color: 'blue' },
  DISPUTED: { label: 'Chờ đối soát', color: 'gold' },
  SETTLED: { label: 'Hoàn thành', color: 'green' },
  ENDED_EARLY: { label: 'Kết thúc sớm', color: 'orange' },
  CLOSED: { label: 'Đã đóng', color: 'default' },
  ONLINE: { label: 'Online', color: 'green' },
  OFFLINE: { label: 'Offline', color: 'default' },
  BUSY: { label: 'Đang bận', color: 'orange' },
  MAINTAIN: { label: 'Bảo trì', color: 'purple' },
  FLAGGED: { label: 'Bị gắn cờ', color: 'volcano' },
  UPHELD: { label: 'Giữ nguyên', color: 'red' },
  DISMISSED: { label: 'Bỏ cờ', color: 'green' },
  NONE: { label: '—', color: 'default' },
}

/**
 * The same word means something different per table: an escrow `SETTLED` is the
 * payout having gone out, an order `SETTLED` is the session having finished.
 */
const STATUS_DOMAIN_META: Record<'escrow' | 'deposit', Record<string, StatusMeta>> = {
  escrow: {
    HELD: { label: 'Đang giữ', color: 'gold' },
    SETTLED: { label: 'Đã tất toán', color: 'green' },
    REFUNDED: { label: 'Đã hoàn', color: 'blue' },
    PARTIALLY_SETTLED: { label: 'Tất toán một phần', color: 'cyan' },
  },
  deposit: {
    PENDING: { label: 'Chờ xác nhận', color: 'gold' },
    SUCCEEDED: { label: 'Nạp thành công', color: 'green' },
    FAILED: { label: 'Nạp thất bại', color: 'red' },
  },
}

export type StatusDomain = keyof typeof STATUS_DOMAIN_META

export const statusMeta = (status: string, domain?: StatusDomain): StatusMeta =>
  (domain ? STATUS_DOMAIN_META[domain][status] : undefined) ??
  STATUS_META[status] ??
  { label: status, color: 'default' }

export const statusLabel = (status: string | null | undefined, domain?: StatusDomain): string =>
  status ? statusMeta(status, domain).label : '—'

/** Filter options straight from the API enum, already in plain words. */
export const statusOptions = (values: readonly string[], domain?: StatusDomain) =>
  values.map((value) => ({ value, label: statusLabel(value, domain) }))

/** Same, for enums that are not statuses and therefore have no colour. */
export const optionsFor = (values: readonly string[], labels: Record<string, string>) =>
  values.map((value) => ({ value, label: labelOf(labels, value) }))

