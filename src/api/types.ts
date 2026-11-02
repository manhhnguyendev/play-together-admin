import type {
  AdminFeedbackView,
  PageMetaDto,
  RatingDto,
  ReportDto,
  UserSummary,
  WithdrawalView,
} from './generated/models'
import {
  AdminDepositViewStatus,
  AdminEscrowViewStatus,
  AdminLedgerViewAccountType,
  AdminLedgerViewDirection,
  AdminLedgerViewType,
  AdminOpsControllerOrdersSort,
  AdminOpsControllerOrdersStatus,
  UserSummaryAdminRole,
} from './generated/models'

export type {
  AdminAuditActorDto,
  AdminAuditLogPage,
  AdminAuditLogView,
  AdminDepositPage,
  AdminDepositView,
  AdminEscrowPage,
  AdminEscrowView,
  AdminFeedbackView,
  AdminKpisDto,
  AdminLedgerPage,
  AdminLedgerTotalsDto,
  AdminLedgerView,
  AdminOrderDetailDto,
  AdminOrderEscrowDto,
  AdminOrderHistoryItemDto,
  AdminOrderLedgerDto,
  AdminOrderPage,
  AdminOrderPendingCreditDto,
  AdminOrderRatingDto,
  AdminOrderReportDto,
  AdminOrderRowDto,
  AdminPartyRefDto,
  AdminUserDossierDto,
  AdminWalletPage,
  AdminWalletView,
  AuthResponseDto as AuthResponse,
  BehaviorHistoryItemDto,
  CharityView,
  CharityWithdrawalView,
  GameDetail,
  GameRankDto as GameRank,
  GameTypeView,
  GameView,
  KpiMoneyBlock,
  KpiOrderBlock,
  KpiPeopleBlock,
  KpiQueueBlock,
  PlatformOverview,
  PublicConfigDto as PublicConfig,
  RatingDto,
  ReportDto,
  ResolvedConfigDto as ResolvedConfig,
  UserSummary,
  WithdrawalView,
} from './generated/models'

export type {
  AdminOpsControllerAuditLogsParams as ListAuditParams,
  AdminOpsControllerDepositsParams as ListDepositsParams,
  AdminOpsControllerEscrowsParams as ListEscrowsParams,
  AdminOpsControllerKpisParams as KpisParams,
  AdminOpsControllerLedgerParams as ListLedgerParams,
  AdminOpsControllerOrdersParams as ListOpsOrdersParams,
  AdminOpsControllerWalletsParams as ListWalletsParams,
} from './generated/models'

export type PageMeta = PageMetaDto

export interface Paginated<T> {
  items: T[]
  meta: PageMeta
}

export interface ProblemDetails {
  type?: string
  title?: string
  status?: number
  code?: string
  detail?: string
  instance?: string
  traceId?: string
  message?: string
  /** Nest puts the class-validator strings here; older payloads used a map. */
  errors?: Record<string, string[]> | string[]
  details?: {
    errors?: Record<string, string[]> | string[]
    constraint?: string
    [key: string]: unknown
  }
}

export type Role = UserSummary['role']
export type UserStatus = UserSummary['status']
export type FeedbackStatus = AdminFeedbackView['status']
export type ReportStatus = ReportDto['status']
export type WithdrawalStatus = WithdrawalView['status']
export type ViolationStatus = RatingDto['violationStatus']
export type FlaggedRatingStatus = Exclude<ViolationStatus, 'NONE'>
export type AdminTier = NonNullable<UserSummary['adminRole']>
export type OrderStatus = (typeof ORDER_STATUSES)[number]
export type LedgerEntryType = (typeof LEDGER_TYPES)[number]
export type LedgerAccountType = (typeof LEDGER_ACCOUNT_TYPES)[number]
export type LedgerDirection = (typeof LEDGER_DIRECTIONS)[number]
export type EscrowStatus = (typeof ESCROW_STATUSES)[number]
export type DepositStatus = (typeof DEPOSIT_STATUSES)[number]

export const USER_ROLES = ['USER', 'ADMIN', 'CHARITY'] as const satisfies readonly Role[]
export const USER_STATUSES = ['ONLINE', 'OFFLINE', 'BUSY', 'MAINTAIN'] as const satisfies readonly UserStatus[]
export const WITHDRAWAL_STATUSES = [
  'PENDING',
  'PAID',
  'REJECTED',
  'CANCELLED',
] as const satisfies readonly WithdrawalStatus[]
export const FEEDBACK_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const satisfies readonly FeedbackStatus[]
export const REPORT_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const satisfies readonly ReportStatus[]
export const FLAGGED_RATING_STATUSES = ['FLAGGED', 'UPHELD', 'DISMISSED'] as const satisfies readonly FlaggedRatingStatus[]

/**
 * Read straight off the generated enums: a value added to the API appears in the
 * console filters without anyone remembering to extend a hand-written list.
 */
export const ADMIN_TIERS = Object.values(UserSummaryAdminRole)
export const ORDER_STATUSES = Object.values(AdminOpsControllerOrdersStatus)
export const ORDER_SORTS = Object.values(AdminOpsControllerOrdersSort)
export const LEDGER_TYPES = Object.values(AdminLedgerViewType)
export const LEDGER_ACCOUNT_TYPES = Object.values(AdminLedgerViewAccountType)
export const LEDGER_DIRECTIONS = Object.values(AdminLedgerViewDirection)
export const ESCROW_STATUSES = Object.values(AdminEscrowViewStatus)
export const DEPOSIT_STATUSES = Object.values(AdminDepositViewStatus)
