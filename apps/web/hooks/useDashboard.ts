'use client'
import { useQuery } from '@tanstack/react-query'
import { useApi } from './use-api'

export type DashboardData = {
  botStatus: 'RUNNING' | 'STOPPED' | 'ERROR'
  openTrades: number
  todayPnL: number
  totalPnL: number
  winRate: number
  lastUpdated: string
}

export function useDashboard() {
  const { apiFetch } = useApi()
  return useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await apiFetch('/api/dashboard')
      if (!res.ok) throw new Error('Failed to fetch dashboard')
      return res.json()
    },
    refetchInterval: 30000,
  })
}
