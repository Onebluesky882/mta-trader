'use client'
import { useQuery } from '@tanstack/react-query'
import { useApi } from './use-api'

export type Trade = {
  id: string
  symbol: string
  direction: 'BUY' | 'SELL'
  openPrice: number
  closePrice: number | null
  openTime: string
  closeTime: string | null
  profit: number | null
  volume: number
  status: 'OPEN' | 'CLOSED'
}

export type TradesResponse = {
  trades: Trade[]
  total: number
  page: number
  limit: number
}

export function useTrades(params: {
  page: number
  limit: number
  from?: string
  to?: string
}) {
  const { apiFetch } = useApi()

  const query = new URLSearchParams({ page: String(params.page), limit: String(params.limit) })
  if (params.from) query.set('from', params.from)
  if (params.to) query.set('to', params.to)

  return useQuery<TradesResponse>({
    queryKey: ['trades', params],
    queryFn: async () => {
      const res = await apiFetch(`/api/trades?${query}`)
      if (!res.ok) throw new Error('Failed to fetch trades')
      return res.json()
    },
  })
}
