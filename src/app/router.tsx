import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AdminLayout } from './AdminLayout'
import { RequireAdmin } from './RequireAdmin'
import BroadcastPage from '@/pages/BroadcastPage'
import CatalogPage from '@/pages/CatalogPage'
import CharitiesPage from '@/pages/CharitiesPage'
import ConfigsPage from '@/pages/ConfigsPage'
import DashboardPage from '@/pages/DashboardPage'
import FeedbackPage from '@/pages/FeedbackPage'
import FlaggedRatingsPage from '@/pages/FlaggedRatingsPage'
import LoginPage from '@/pages/LoginPage'
import MaintenancePage from '@/pages/MaintenancePage'
import ReportsPage from '@/pages/ReportsPage'
import UsersPage from '@/pages/UsersPage'
import WithdrawalsPage from '@/pages/WithdrawalsPage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: (
      <RequireAdmin>
        <AdminLayout />
      </RequireAdmin>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'users', element: <UsersPage /> },
      { path: 'withdrawals', element: <WithdrawalsPage /> },
      { path: 'charities', element: <CharitiesPage /> },
      { path: 'feedback', element: <FeedbackPage /> },
      { path: 'reports', element: <ReportsPage /> },
      { path: 'ratings', element: <FlaggedRatingsPage /> },
      { path: 'catalog', element: <CatalogPage /> },
      { path: 'configs', element: <ConfigsPage /> },
      { path: 'broadcast', element: <BroadcastPage /> },
      { path: 'maintenance', element: <MaintenancePage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
