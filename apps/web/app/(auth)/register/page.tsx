'use client'
import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { RegisterForm } from '@/components/auth/register-form'

export default function RegisterPage() {
  const { signUp } = useAuth()
  const [isLoading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(name: string, email: string, password: string) {
    setLoading(true)
    setError(null)
    try {
      await signUp(name, email, password)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return <RegisterForm onSubmit={handleSubmit} isLoading={isLoading} error={error} />
}
