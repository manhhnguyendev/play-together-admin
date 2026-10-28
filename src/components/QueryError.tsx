import { Alert } from 'antd'
import { toApiError } from '@/api/client'

export function QueryError({ error }: { error: unknown }) {
  if (!error) return null
  return <Alert type="error" showIcon title={toApiError(error).message} style={{ marginBottom: 16 }} />
}
