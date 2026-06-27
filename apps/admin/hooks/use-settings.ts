'use client'
import { useAuthStore } from '@/store/auth.store'

type SettingsHook = {
  user: { name: string; email: string } | null
  isLoading: boolean
}

export function useSettings(): SettingsHook {
  const user = useAuthStore((s) => s.user)
  const isLoading = useAuthStore((s) => s.isLoading)
  return { user, isLoading }
}
