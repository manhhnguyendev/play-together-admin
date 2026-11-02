import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import type { AuthResponse, ProblemDetails } from './types'

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v2'

const ACCESS_KEY = 'pt_admin_access'
const REFRESH_KEY = 'pt_admin_refresh'

export interface SessionTokens {
  accessToken: string
  refreshToken: string
}

export class ApiError extends Error {
  readonly status: number
  readonly code?: string
  readonly details?: ProblemDetails

  constructor(status: number, message: string, details?: ProblemDetails) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = details?.code
    this.details = details
  }
}

function readStoredTokens(): SessionTokens | null {
  const accessToken = localStorage.getItem(ACCESS_KEY)
  const refreshToken = localStorage.getItem(REFRESH_KEY)
  return accessToken && refreshToken ? { accessToken, refreshToken } : null
}

let tokens: SessionTokens | null = readStoredTokens()
let refreshing: Promise<SessionTokens | null> | null = null
let unauthorizedHandler: (() => void) | null = null

export function getSessionTokens(): SessionTokens | null {
  return tokens
}

export function setSessionTokens(next: SessionTokens | null): void {
  tokens = next
  if (next) {
    localStorage.setItem(ACCESS_KEY, next.accessToken)
    localStorage.setItem(REFRESH_KEY, next.refreshToken)
  } else {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
  }
}

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler
}

export const http = axios.create({ baseURL: API_URL })
const raw = axios.create({ baseURL: API_URL })

http.interceptors.request.use((config) => {
  if (tokens) config.headers.Authorization = `Bearer ${tokens.accessToken}`
  return config
})

/**
 * The API keeps `detail` in English so one payload serves every client; the
 * console owns the operator-facing wording for the codes a back-office screen
 * can actually hit. Anything unlisted falls back to the server text.
 */
const CODE_MESSAGES: Record<string, string> = {
  validation_failed: 'Dữ liệu chưa hợp lệ.',
  forbidden: 'Bạn không có quyền thực hiện thao tác này.',
  admin_role_required: 'Thao tác này cần quyền Kiểm duyệt hoặc Tài chính.',
  last_super_admin: 'Phải còn ít nhất một quản trị viên cao nhất đang hoạt động.',
  reason_required: 'Cần nêu lý do trước khi lưu.',
  not_found: 'Không tìm thấy bản ghi, có thể nó đã bị xoá.',
  user_not_found: 'Không tìm thấy tài khoản này.',
  order_not_found: 'Không tìm thấy đơn thuê này.',
  withdrawal_not_found: 'Không tìm thấy yêu cầu rút tiền này.',
  report_not_found: 'Không tìm thấy báo cáo này.',
  rating_not_found: 'Không tìm thấy đánh giá này.',
  charity_not_found: 'Không tìm thấy tổ chức từ thiện này.',
  config_not_found: 'Không tìm thấy cấu hình này.',
  feedback_not_found: 'Không tìm thấy phản hồi này.',
  game_not_found: 'Không tìm thấy game này.',
  rank_not_found: 'Không tìm thấy hạng game này.',
  already_resolved: 'Bản ghi này đã được xử lý trước đó.',
  conflict: 'Trạng thái hiện tại không cho phép thao tác này. Hãy làm mới trang.',
  reference_conflict: 'Bản ghi đang được dữ liệu khác tham chiếu nên không xoá được.',
  constraint_violation: 'Thay đổi vượt ngoài ngưỡng cho phép của hệ thống.',
  invalid_credentials: 'Email hoặc mật khẩu không đúng.',
  account_disabled: 'Tài khoản này đã bị khoá.',
  account_maintained: 'Hệ thống đang bảo trì, vui lòng thử lại sau.',
  email_taken: 'Email này đã có tài khoản sử dụng.',
  internal_error: 'Hệ thống gặp lỗi khi xử lý yêu cầu. Vui lòng thử lại.',
}

const joinErrors = (errors: Record<string, string[]> | string[] | undefined): string | undefined => {
  if (!errors) return undefined
  if (Array.isArray(errors)) return errors.join('; ')
  const entries = Object.entries(errors)
  return entries.length ? entries.map(([field, messages]) => `${field}: ${messages.join(', ')}`).join('; ') : undefined
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  if (error instanceof AxiosError) {
    const details = error.response?.data as ProblemDetails | undefined
    const status = error.response?.status ?? 0
    const codeMessage = details?.code ? CODE_MESSAGES[details.code] : undefined
    const fieldErrors = joinErrors(details?.details?.errors) ?? joinErrors(details?.errors)
    const message =
      (codeMessage && fieldErrors ? `${codeMessage} ${fieldErrors}` : undefined) ??
      codeMessage ??
      fieldErrors ??
      details?.detail ??
      details?.message ??
      details?.title ??
      error.message ??
      'Yêu cầu thất bại'
    return new ApiError(status, message, details)
  }
  return new ApiError(0, error instanceof Error ? error.message : 'Lỗi không xác định')
}

async function refreshTokens(): Promise<SessionTokens | null> {
  if (!tokens) return null
  try {
    const { data } = await raw.post<AuthResponse>('/auth/refresh', {
      refreshToken: tokens.refreshToken,
    })
    const next = { accessToken: data.accessToken, refreshToken: data.refreshToken }
    setSessionTokens(next)
    return next
  } catch {
    return null
  }
}

function refreshOnce(): Promise<SessionTokens | null> {
  refreshing ??= refreshTokens().finally(() => {
    refreshing = null
  })
  return refreshing
}

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean }

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ProblemDetails>) => {
    const config = error.config as RetryableConfig | undefined
    const status = error.response?.status
    const url = config?.url ?? ''
    const isAuthCall = url.includes('/auth/')

    if (status === 401 && config && !config._retry && !isAuthCall) {
      config._retry = true
      const next = await refreshOnce()
      if (next) {
        config.headers.Authorization = `Bearer ${next.accessToken}`
        return http.request(config)
      }
      unauthorizedHandler?.()
    }

    return Promise.reject(toApiError(error))
  },
)

