'use client'
import { useAppStore } from '@/store/useAppStore'

const API = process.env.NEXT_PUBLIC_API_URL ?? ''

export function useApi() {
  const { token } = useAppStore()

  function apiFetch(path: string, init?: RequestInit) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(init?.headers as Record<string, string>),
    }
    if (token) headers['Authorization'] = `Bearer ${token}`
    return fetch(`${API}${path}`, { ...init, headers })
  }

  return { apiFetch, API, token }
}
