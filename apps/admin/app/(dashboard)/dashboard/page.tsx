'use client'
import { useDashboard } from '@/hooks/use-dashboard'
import { StatsGrid } from '@/components/dashboard/stats-grid'

export default function DashboardPage() {
  const { apiStatus, currentUser, isLoading } = useDashboard()

  if (isLoading) {
    return (
      <div>
        <h1 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: 700 }}>Dashboard</h1>
        <p style={{ color: '#64748b' }}>Loading...</p>
      </div>
    )
  }

  const stats = [
    {
      label: 'API Status',
      value: apiStatus === 'ok' ? 'Online' : 'Offline',
      status: apiStatus,
    },
    {
      label: 'Logged in as',
      value: currentUser?.email ?? 'Unknown',
    },
    {
      label: 'Storage',
      value: 'R2 Connected',
      status: 'ok' as const,
    },
    {
      label: 'Database',
      value: 'D1 Connected',
      status: 'ok' as const,
    },
  ]

  return (
    <div>
      <h1 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: 700 }}>Dashboard</h1>
      <StatsGrid stats={stats} />
    </div>
  )
}
