'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useApi } from './use-api'

export type ZoneRule = {
  timeframe: 'M15' | 'M30' | 'H1' | 'H4' | 'D1'
  minWickTouches: number
  lookbackBars: number
  proximityPoints: number
  includeBody: boolean
}

export type StrategyParams = {
  zones: ZoneRule[]
  biasToday: 'BUY' | 'SELL' | 'MIXED'
  tpPoints: number
  slPoints: number
}

export type Strategy = {
  id: string
  rawText: string
  params: StrategyParams
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type StrategyPerformance = {
  strategyId: string
  totalTrades: number
  wins: number
  losses: number
  winRate: number
  totalProfit: number
}

export function useStrategies() {
  const { apiFetch } = useApi()
  return useQuery<Strategy[]>({
    queryKey: ['strategies'],
    queryFn: async () => {
      const res = await apiFetch('/api/strategy')
      if (!res.ok) throw new Error('Failed to fetch strategies')
      const data = await res.json() as { strategies: Strategy[] }
      return data.strategies
    },
  })
}

export function useCreateStrategy() {
  const { apiFetch } = useApi()
  const queryClient = useQueryClient()
  return useMutation<Strategy, Error, string>({
    mutationFn: async (rawText) => {
      const res = await apiFetch('/api/strategy', {
        method: 'POST',
        body: JSON.stringify({ rawText }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(err.error ?? 'Failed to parse strategy')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['strategies'] })
    },
  })
}

export function useActivateStrategy() {
  const { apiFetch } = useApi()
  const queryClient = useQueryClient()
  return useMutation<{ id: string; isActive: boolean }, Error, string>({
    mutationFn: async (id) => {
      const res = await apiFetch(`/api/strategy/${id}/activate`, { method: 'PUT' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(err.error ?? 'Failed to activate strategy')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['strategies'] })
    },
  })
}

export function useArchiveStrategy() {
  const { apiFetch } = useApi()
  const queryClient = useQueryClient()
  return useMutation<{ id: string; archived: boolean }, Error, string>({
    mutationFn: async (id) => {
      const res = await apiFetch(`/api/strategy/${id}/archive`, { method: 'PUT' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(err.error ?? 'Failed to archive strategy')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['strategies'] })
    },
  })
}

export function useStrategyPerformance(id: string, enabled: boolean) {
  const { apiFetch } = useApi()
  return useQuery<StrategyPerformance>({
    queryKey: ['strategy-performance', id],
    enabled,
    queryFn: async () => {
      const res = await apiFetch(`/api/strategy/${id}/performance`)
      if (!res.ok) throw new Error('Failed to fetch performance')
      return res.json()
    },
  })
}
