'use client'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'

const API = process.env.NEXT_PUBLIC_API_URL ?? ''

export function useAuth() {
  const router = useRouter()
  const { setUser, setToken } = useAuthStore()

  async function signIn(email: string, password: string) {
    const res = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) throw new Error('Invalid credentials')
    const data = await res.json()
    setToken(data.token ?? null)
    setUser({ email } as never)
    router.push('/dashboard')
  }

  async function signUp(name: string, email: string, password: string) {
    const res = await fetch(`${API}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error((err as { error?: string }).error ?? 'Sign up failed')
    }
    const data = await res.json()
    setToken(data.token ?? null)
    setUser({ email } as never)
    router.push('/dashboard')
  }

  async function signOut() {
    setUser(null)
    setToken(null)
    router.push('/login')
  }

  return { signIn, signUp, signOut }
}
