'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useApi } from './use-api'

export type AiConfig = {
  aiEnabled: boolean
  symbol: string
  confidenceMin: number
  rrMin: number
  analyzeH1: boolean
  analyzeH4: boolean
  useDynamicSL: boolean
  maxSignalAgeMin: number
}

export type AiConfigResponse = {
  params: AiConfig
  updatedAt: string | null
}

export function useAiConfig() {
  const { apiFetch } = useApi()
  return useQuery<AiConfigResponse>({
    queryKey: ['ai-config'],
    queryFn: async () => {
      const res = await apiFetch('/api/ai-config')
      if (!res.ok) throw new Error('Failed to fetch AI config')
      return res.json()
    },
  })
}

export function useUpdateAiConfig() {
  const { apiFetch } = useApi()
  const queryClient = useQueryClient()
  return useMutation<AiConfigResponse, Error, AiConfig>({
    mutationFn: async (params) => {
      const res = await apiFetch('/api/ai-config', {
        method: 'PUT',
        body: JSON.stringify({ params }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(err.error ?? 'Save failed')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-config'] })
    },
  })
}
