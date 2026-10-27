import { Spin } from 'antd'
import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAdminStore } from '@/auth/store'

export function RequireAdmin({ children }: { children: ReactNode }) {
  const status = useAdminStore((state) => state.status)

  if (status === 'loading') {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Spin size="large" />
      </div>
    )
  }

  if (status === 'signedOut') return <Navigate to="/login" replace />

  return <>{children}</>
}
