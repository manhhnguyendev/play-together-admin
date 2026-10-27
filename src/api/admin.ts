import { apiDelete, apiGet, apiPatch, apiPost } from './client'
import type {
  AdminFeedbackView,
  AuthResponse,
  CharityView,
  CharityWithdrawalView,
  GameDetail,
  GameTypeView,
  GameView,
  Paginated,
  PlatformOverview,
  PublicConfig,
  RatingDto,
  ReportDto,
  ResolvedConfig,
  UserSummary,
  WithdrawalStatus,
  WithdrawalView,
} from './types'

export interface PageParams {
  page?: number
  pageSize?: number
}

export interface ListUsersParams extends PageParams {
  q?: string
  role?: string
  isActive?: 'true' | 'false'
  isPlayer?: 'true' | 'false'
}

export interface ListFeedbackParams extends PageParams {
  status?: string
  q?: string
}

export interface ListReportsParams extends PageParams {
  status?: string
  q?: string
}

export interface ListWithdrawalsParams extends PageParams {
  status?: WithdrawalStatus
}

export interface ResolveReportBody {
  decision: 'APPROVED' | 'REJECTED'
  note?: string
  points?: number
  satisfaction?: number
  disableAccount?: boolean
  refundAmount?: number
}

export const authService = {
  login: (email: string, password: string) =>
    apiPost<AuthResponse>('/auth/login', { email, password }),
  logout: (refreshToken: string) => apiPost<void>('/auth/logout', { refreshToken }),
}

export const adminService = {
  stats: () => apiGet<PlatformOverview>('/admin/stats'),

  users: (params: ListUsersParams) => apiGet<Paginated<UserSummary>>('/admin/users', { params }),
  updateUser: (
    id: string,
    body: { isActive?: boolean; isPlayer?: boolean; role?: string; status?: string },
  ) => apiPatch<UserSummary>(`/admin/users/${id}`, body),
  adjustBehavior: (id: string, body: { points: number; satisfaction: number; note?: string }) =>
    apiPost<{ userId: string } & Record<string, unknown>>(`/admin/users/${id}/behavior`, body),

  feedback: (params: ListFeedbackParams) =>
    apiGet<Paginated<AdminFeedbackView>>('/admin/feedback', { params }),
  resolveFeedback: (id: string, body: { decision: 'APPROVED' | 'REJECTED'; adminNote?: string }) =>
    apiPatch<AdminFeedbackView>(`/admin/feedback/${id}`, body),

  reports: (params: ListReportsParams) => apiGet<Paginated<ReportDto>>('/admin/reports', { params }),
  report: (id: string) => apiGet<ReportDto>(`/admin/reports/${id}`),
  resolveReport: (id: string, body: ResolveReportBody) => apiPatch<ReportDto>(`/admin/reports/${id}`, body),

  flaggedRatings: (params: PageParams & { status?: string }) =>
    apiGet<Paginated<RatingDto>>('/admin/ratings/flagged', { params }),
  resolveViolation: (id: string, body: { decision: 'UPHELD' | 'DISMISSED'; note?: string }) =>
    apiPatch<RatingDto>(`/admin/ratings/${id}/violation`, body),

  withdrawals: (params: ListWithdrawalsParams) =>
    apiGet<Paginated<WithdrawalView>>('/admin/withdrawals', { params }),
  resolveWithdrawal: (id: string, body: { status: 'PAID' | 'REJECTED'; note?: string }) =>
    apiPatch<{ id: string; status: string }>(`/admin/withdrawals/${id}`, body),

  charityWithdrawals: (params: ListWithdrawalsParams) =>
    apiGet<Paginated<CharityWithdrawalView>>('/admin/charity-withdrawals', { params }),
  resolveCharityWithdrawal: (id: string, body: { decision: 'PAID' | 'REJECTED'; note?: string }) =>
    apiPatch<{ id: string; status: string }>(`/admin/charity-withdrawals/${id}`, body),

  charities: (params: PageParams & { q?: string }) =>
    apiGet<Paginated<CharityView>>('/admin/charities', { params }),
  createCharity: (body: {
    email: string
    password: string
    organizationName: string
    information?: string
    address?: string
    contactEmail?: string
    phone?: string
    avatarUrl?: string
  }) => apiPost<CharityView>('/admin/charities', body),
  updateCharity: (
    id: string,
    body: {
      organizationName?: string
      information?: string
      address?: string
      contactEmail?: string
      phone?: string
      avatarUrl?: string
      isActive?: boolean
    },
  ) => apiPatch<CharityView>(`/admin/charities/${id}`, body),

  broadcast: (body: { title: string; body: string; referenceUrl?: string }) =>
    apiPost<{ recipients: number }>('/admin/notifications/broadcast', body),
  maintenance: (enabled: boolean) => apiPost<{ enabled: boolean }>('/admin/maintenance', { enabled }),

  configs: () => apiGet<ResolvedConfig[]>('/admin/configs'),
  createConfig: (body: { key: string; no: number; title: string; value: number; description?: string }) =>
    apiPost<ResolvedConfig>('/admin/configs', body),
  updateConfig: (id: string, body: { title?: string; value?: number; description?: string }) =>
    apiPatch<ResolvedConfig>(`/admin/configs/${id}`, body),
  deleteConfig: (id: string) => apiDelete(`/admin/configs/${id}`),
}

export const catalogService = {
  games: (params: PageParams & { q?: string; gameTypeId?: string }) =>
    apiGet<Paginated<GameView>>('/games', { params }),
  game: (id: string) => apiGet<GameDetail>(`/games/${id}`),
  createGame: (body: {
    name: string
    displayName?: string
    otherNames?: string
    gameTypeIds?: string[]
  }) => apiPost<GameView>('/admin/games', body),
  updateGame: (
    id: string,
    body: { name?: string; displayName?: string; otherNames?: string; gameTypeIds?: string[] },
  ) => apiPatch<GameView>(`/admin/games/${id}`, body),
  deleteGame: (id: string) => apiDelete(`/admin/games/${id}`),

  createRank: (gameId: string, body: { no: number; name: string }) =>
    apiPost<{ id: string }>(`/admin/games/${gameId}/ranks`, body),
  updateRank: (rankId: string, body: { no?: number; name?: string }) =>
    apiPatch<{ id: string }>(`/admin/ranks/${rankId}`, body),
  deleteRank: (rankId: string) => apiDelete(`/admin/ranks/${rankId}`),

  gameTypes: (params: PageParams & { q?: string }) =>
    apiGet<Paginated<GameTypeView>>('/game-types', { params }),
  createGameType: (body: { name: string; shortName?: string; description?: string }) =>
    apiPost<GameTypeView>('/admin/game-types', body),
  updateGameType: (id: string, body: { name?: string; shortName?: string; description?: string }) =>
    apiPatch<GameTypeView>(`/admin/game-types/${id}`, body),
  deleteGameType: (id: string) => apiDelete(`/admin/game-types/${id}`),
}

export const configService = {
  public: () => apiGet<PublicConfig>('/configs'),
}
