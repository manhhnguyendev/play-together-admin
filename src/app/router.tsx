import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AdminLayout } from './AdminLayout'
import { RequireAdmin } from './RequireAdmin'

export const router = createBrowserRouter([
  {
    path: '/login',
    lazy: async () => ({ Component: (await import('@/pages/LoginPage')).default }),
  },
  {
    element: (
      <RequireAdmin>
        <AdminLayout />
      </RequireAdmin>
    ),
    children: [
      {
        index: true,
        lazy: async () => ({
          Component: (await import('@/pages/DashboardPage')).default,
        }),
      },
      {
        path: 'users',
        lazy: async () => ({ Component: (await import('@/pages/UsersPage')).default }),
      },
      {
        path: 'withdrawals',
        lazy: async () => ({
          Component: (await import('@/pages/WithdrawalsPage')).default,
        }),
      },
      {
        path: 'charities',
        lazy: async () => ({
          Component: (await import('@/pages/CharitiesPage')).default,
        }),
      },
      {
        path: 'feedback',
        lazy: async () => ({
          Component: (await import('@/pages/FeedbackPage')).default,
        }),
      },
      {
        path: 'reports',
        lazy: async () => ({
          Component: (await import('@/pages/ReportsPage')).default,
        }),
      },
      {
        path: 'ratings',
        lazy: async () => ({
          Component: (await import('@/pages/FlaggedRatingsPage')).default,
        }),
      },
      {
        path: 'catalog',
        lazy: async () => ({
          Component: (await import('@/pages/CatalogPage')).default,
        }),
      },
      {
        path: 'configs',
        lazy: async () => ({
          Component: (await import('@/pages/ConfigsPage')).default,
        }),
      },
      {
        path: 'broadcast',
        lazy: async () => ({
          Component: (await import('@/pages/BroadcastPage')).default,
        }),
      },
      {
        path: 'maintenance',
        lazy: async () => ({
          Component: (await import('@/pages/MaintenancePage')).default,
        }),
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
