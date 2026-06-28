'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useApi } from './use-api'

export type TFAnalysis = {
  trend: string
  rsi: number
  macd: string
  ema: string
}

export type AiSignal = {
  id: string
  symbol: string
  signal: 'BUY' | 'SELL' | 'HOLD'
  confidence: number
  reason: string
  sl: number | null
  tp: number | null
  price: number | null
  h4: TFAnalysis
  h1: TFAnalysis
  analyzedAt: string
}

export function useLatestSignal() {
  const { apiFetch } = useApi()
  return useQuery<AiSignal | null>({
    queryKey: ['ai-signal-latest'],
    queryFn: async () => {
      const res = await apiFetch('/api/ai-signal/latest')
      if (!res.ok) throw new Error('Failed to fetch signal')
      const data = await res.json() as { signal: AiSignal | null }
      return data.signal
    },
    staleTime: 60_000,
  })
}

export function useSignalHistory() {
  const { apiFetch } = useApi()
  return useQuery<AiSignal[]>({
    queryKey: ['ai-signal-history'],
    queryFn: async () => {
      const res = await apiFetch('/api/ai-signal/history')
      if (!res.ok) throw new Error('Failed to fetch signal history')
      const data = await res.json() as { signals: AiSignal[] }
      return data.signals
    },
    staleTime: 60_000,
  })
}

export type AnalyzeParams = {
  symbol: string
  currentPrice?: number
  h4Indicators?: { rsi: number; macdHistogram: number; ema50: number; ema200: number }
  h1Indicators?: { rsi: number; macdHistogram: number; ema21: number }
}

export function useAnalyze() {
  const { apiFetch } = useApi()
  const queryClient = useQueryClient()
  return useMutation<AiSignal, Error, AnalyzeParams>({
    mutationFn: async (params) => {
      const res = await apiFetch('/api/ai-signal/analyze', {
        method: 'POST',
        body: JSON.stringify(params),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(err.error ?? 'Analysis failed')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-signal-latest'] })
      queryClient.invalidateQueries({ queryKey: ['ai-signal-history'] })
    },
  })
}
