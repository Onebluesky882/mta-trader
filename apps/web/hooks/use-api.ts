'use client'
import { useAuthStore } from '@/store/auth.store'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://fullstack-builder-api.onebluesky882.workers.dev'

export function useApi() {
  const { token } = useAuthStore()

  function authHeaders(extra?: HeadersInit): HeadersInit {
    const headers: Record<string, string> = { 'Content-Type': 'application/json', ...extra as Record<string, string> }
    if (token) headers['Authorization'] = `Bearer ${token}`
    return headers
  }

  function apiFetch(path: string, init?: RequestInit) {
    return fetch(`${API}${path}`, {
      credentials: 'include',
      ...init,
      headers: authHeaders(init?.headers as HeadersInit),
    })
  }

  return { apiFetch, API, token }
}
