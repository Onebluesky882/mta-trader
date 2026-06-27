'use client'
import { useEffect } from 'react'
import { useAuthStore } from '@/store/auth.store'

export function useSession() {
  const { user, isLoading, setUser, setLoading } = useAuthStore()

  useEffect(() => {
    fetch('/api/user/me', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setUser(data?.user ?? null)
        setLoading(false)
      })
      .catch(() => {
        setUser(null)
        setLoading(false)
      })
  }, [setUser, setLoading])

  return { user, isLoading }
}
