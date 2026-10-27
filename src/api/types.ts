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

export interface PageMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface Paginated<T> {
  items: T[]
  meta: PageMeta
}

export type Role = 'USER' | 'ADMIN' | 'CHARITY'
export type UserStatus = 'ONLINE' | 'OFFLINE' | 'BUSY' | 'MAINTAIN'
export type WithdrawalStatus = 'PENDING' | 'PAID' | 'REJECTED' | 'CANCELLED'
export type FeedbackStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type ReportStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type ViolationStatus = 'NONE' | 'FLAGGED' | 'UPHELD' | 'DISMISSED'

export interface UserSummary {
  id: string
  name: string
  email?: string
  avatarUrl: string | null
  city: string | null
  gender: 'MALE' | 'FEMALE' | 'OTHER'
  bio: string | null
  status: UserStatus
  role: Role
  isActive: boolean
  isPlayer: boolean
  pricePerHour: number
  maxHoursPerHire: number
  rating: number
  ratingCount: number
  ordersCount: number
  completedOrdersCount: number
  totalHours: number
  rankingPoints: number
  createdAt: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  accessTokenExpiresIn: number
  refreshTokenExpiresAt: string
  user: UserSummary
}

export interface PlatformOverview {
  users: { total: number; active: number; players: number; charities: number; admins: number }
  orders: { total: number; byStatus: Record<string, number>; active: number; completed: number }
  money: {
    platformFees: number
    escrowHeld: number
    donations: number
    pendingUserWithdrawals: number
    pendingCharityWithdrawals: number
  }
  moderation: { pendingReports: number; pendingFeedback: number; flaggedRatings: number }
}

export interface AdminFeedbackView {
  id: string
  userId: string
  author: { id: string; name: string; email: string } | null
  title: string
  message: string
  type: 'BUG' | 'FEATURE' | 'COMPLAINT' | 'OTHER'
  status: FeedbackStatus
  adminNote: string | null
  resolvedAt: string | null
  createdAt: string
}

export interface WithdrawalView {
  id: string
  amount: number
  status: WithdrawalStatus
  note: string | null
  createdAt: string
  processedAt: string | null
  user: { id: string; name: string; email: string }
}

export interface CharityWithdrawalView {
  id: string
  charityId: string
  charityName: string | null
  amount: number
  status: WithdrawalStatus
  note: string | null
  processedAt: string | null
  createdAt: string
}

export interface CharityView {
  id: string
  userId: string
  organizationName: string
  avatarUrl: string | null
  information: string | null
  address: string | null
  email: string | null
  phone: string | null
  balance: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  stats: { raised: number; donations: number; donors: number }
  account: { id: string; email: string } | null
}

export interface ReportDto {
  id: string
  orderId: string
  reporter: { id: string; name: string; avatarUrl: string | null } | null
  target: { id: string; name: string; avatarUrl: string | null } | null
  message: string
  status: ReportStatus
  resolutionNote: string | null
  resolvedAt: string | null
  createdAt: string
}

export interface RatingDto {
  id: string
  orderId: string
  raterId: string
  rateeId: string
  rate: number
  comment: string | null
  isActive: boolean
  violationStatus: ViolationStatus
  violationReason: string | null
  rater: { id: string; name: string; avatarUrl: string | null } | null
  ratee: { id: string; name: string; avatarUrl: string | null } | null
  createdAt: string
}

export interface GameTypeRef {
  id: string
  name: string
  shortName: string | null
}

export interface GameRank {
  id: string
  no: number
  name: string
}

export interface GameView {
  id: string
  name: string
  displayName: string | null
  otherNames: string | null
  createdAt: string
  updatedAt: string
  types: GameTypeRef[]
}

export interface GameDetail extends GameView {
  ranks: GameRank[]
}

export interface GameTypeView {
  id: string
  name: string
  shortName: string | null
  description: string | null
  createdAt: string
  updatedAt: string
  gameCount: number
}

export interface ResolvedConfig {
  id: string | null
  key: string
  title: string
  value: number
  description: string | null
  updatedAt: string
}

export interface PublicConfig {
  platformFeeBps: number
  feedbackWindowHours: number
  orderResponseMinutes: number
  maintenanceMode: number
}

export const USER_ROLES: Role[] = ['USER', 'ADMIN', 'CHARITY']
export const USER_STATUSES: UserStatus[] = ['ONLINE', 'OFFLINE', 'BUSY', 'MAINTAIN']
export const WITHDRAWAL_STATUSES: WithdrawalStatus[] = ['PENDING', 'PAID', 'REJECTED', 'CANCELLED']
export const FEEDBACK_STATUSES: FeedbackStatus[] = ['PENDING', 'APPROVED', 'REJECTED']
export const REPORT_STATUSES: ReportStatus[] = ['PENDING', 'APPROVED', 'REJECTED']
