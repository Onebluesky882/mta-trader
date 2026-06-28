'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useApi } from './use-api'

export type SnapshotResult = {
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
  result: SnapshotResult
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

export function useSaveSnapshot() {
  const { apiFetch } = useApi()
  const queryClient = useQueryClient()
  return useMutation<
    AlgorithmVersion,
    Error,
    { params: Record<string, number | string | boolean>; result: SnapshotResult; label?: string }
  >({
    mutationFn: async (body) => {
      const res = await apiFetch('/api/optimize', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(err.error ?? 'Save failed')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['optimize'] })
    },
  })
}
