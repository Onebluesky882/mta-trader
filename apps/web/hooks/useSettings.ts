'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useApi } from './use-api'

export type Settings = {
  id: string
  version: number
  params: Record<string, number | string | boolean>
  updatedAt: string
}

export function useSettings() {
  const { apiFetch } = useApi()
  return useQuery<Settings>({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await apiFetch('/api/settings')
      if (!res.ok) throw new Error('Failed to fetch settings')
      return res.json()
    },
  })
}

export function useUpdateSettings() {
  const { apiFetch } = useApi()
  const queryClient = useQueryClient()
  return useMutation<Settings, Error, Record<string, number | string | boolean>>({
    mutationFn: async (params) => {
      const res = await apiFetch('/api/settings', {
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
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })
}
