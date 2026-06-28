'use client'
import { useQuery } from '@tanstack/react-query'
import { useApi } from './use-api'

export type VersionResult = {
  totalTrades: number
  winRate: number
  totalProfit: number
  maxDrawdown: number
  sharpeRatio: number | null
}

export type AlgorithmVersion = {
  id: string
  version: number
  params: Record<string, number | string | boolean>
  result: VersionResult
  label: string | null
  createdAt: string
}

export function useOptimize() {
  const { apiFetch } = useApi()
  return useQuery<AlgorithmVersion[]>({
    queryKey: ['optimize'],
    queryFn: async () => {
      const res = await apiFetch('/api/optimize')
      if (!res.ok) throw new Error('Failed to fetch optimize data')
      const data = await res.json() as { snapshots: AlgorithmVersion[] }
      return data.snapshots
    },
  })
}
