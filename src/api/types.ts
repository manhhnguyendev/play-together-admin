import type {
  AdminFeedbackView,
  PageMetaDto,
  RatingDto,
  ReportDto,
  UserSummary,
  WithdrawalView,
} from './generated/models'

export type {
  AdminFeedbackView,
  AuthResponseDto as AuthResponse,
  CharityView,
  CharityWithdrawalView,
  GameDetail,
  GameRankDto as GameRank,
  GameTypeView,
  GameView,
  PlatformOverview,
  PublicConfigDto as PublicConfig,
  RatingDto,
  ReportDto,
  ResolvedConfigDto as ResolvedConfig,
  UserSummary,
  WithdrawalView,
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
  errors?: Record<string, string[]>
}

export type Role = UserSummary['role']
export type UserStatus = UserSummary['status']
export type FeedbackStatus = AdminFeedbackView['status']
export type ReportStatus = ReportDto['status']
export type WithdrawalStatus = WithdrawalView['status']
export type ViolationStatus = RatingDto['violationStatus']
export type FlaggedRatingStatus = Exclude<ViolationStatus, 'NONE'>

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
