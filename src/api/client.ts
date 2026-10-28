import axios, { AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios'
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

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  if (error instanceof AxiosError) {
    const details = error.response?.data as ProblemDetails | undefined
    const status = error.response?.status ?? 0
    const fieldErrors = details?.errors
      ? Object.entries(details.errors)
          .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
          .join('; ')
      : undefined
    const message =
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

export async function apiGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await http.get<T>(url, config)
  return data
}

export async function apiPost<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await http.post<T>(url, body, config)
  return data
}

export async function apiPatch<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await http.patch<T>(url, body, config)
  return data
}

export async function apiDelete(url: string): Promise<void> {
  await http.delete(url)
}
