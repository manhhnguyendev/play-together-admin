import type { AxiosRequestConfig } from 'axios'
import { http } from './client'

const API_PREFIX = '/api/v2'

export const customInstance = <T>(config: AxiosRequestConfig): Promise<T> => {
  const url = config.url?.startsWith(API_PREFIX) ? config.url.slice(API_PREFIX.length) : config.url
  return http.request<T>({ ...config, url }).then((response) => response.data)
}
