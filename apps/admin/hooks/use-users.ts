'use client'
import { useEffect, useState } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL ?? ''

export type UserItem = {
  id: string
  name: string
  email: string
  createdAt?: string
}

type UsersHook = {
  users: UserItem[]
  isLoading: boolean
}

export function useUsers(): UsersHook {
  const [users, setUsers] = useState<UserItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    fetch(`${API}/api/user/me`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { user?: { id: string; name: string; email: string; createdAt?: string } } | null) => {
        if (cancelled) return
        const u = data?.user
        if (u) {
          setUsers([
            {
              id: u.id,
              name: u.name,
              email: u.email,
              createdAt: u.createdAt,
            },
          ])
        }
      })
      .catch(() => {
        if (!cancelled) setUsers([])
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { users, isLoading }
}
