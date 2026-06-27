'use client'
import { useEffect, useState } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL ?? ''

type CurrentUser = { id: string; name: string; email: string } | null

type DashboardData = {
  apiStatus: 'ok' | 'error'
  currentUser: CurrentUser
  isLoading: boolean
}

export function useDashboard(): DashboardData {
  const [apiStatus, setApiStatus] = useState<'ok' | 'error'>('ok')
  const [currentUser, setCurrentUser] = useState<CurrentUser>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [healthRes, userRes] = await Promise.allSettled([
          fetch(`${API}/health`, { credentials: 'include' }),
          fetch(`${API}/api/user/me`, { credentials: 'include' }),
        ])

        if (cancelled) return

        if (healthRes.status === 'fulfilled' && healthRes.value.ok) {
          setApiStatus('ok')
        } else {
          setApiStatus('error')
        }

        if (userRes.status === 'fulfilled' && userRes.value.ok) {
          const data = await userRes.value.json()
          setCurrentUser(data?.user ?? null)
        } else {
          setCurrentUser(null)
        }
      } catch {
        if (!cancelled) {
          setApiStatus('error')
          setCurrentUser(null)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void load()
    return () => { cancelled = true }
  }, [])

  return { apiStatus, currentUser, isLoading }
}
