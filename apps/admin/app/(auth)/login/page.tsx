'use client'
import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { LoginForm } from '@/components/auth/login-form'

export default function LoginPage() {
  const { signIn } = useAuth()
  const [isLoading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(email: string, password: string) {
    setLoading(true)
    setError(null)
    try {
      await signIn(email, password)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return <LoginForm onSubmit={handleSubmit} isLoading={isLoading} error={error} />
}
