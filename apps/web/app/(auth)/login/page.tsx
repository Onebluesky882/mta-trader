'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store/useAppStore'

export default function LoginPage() {
  const router = useRouter()
  const { setToken } = useAppStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const API = process.env.NEXT_PUBLIC_API_URL ?? ''

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Invalid credentials')
      setToken(data.token)
      router.push('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 14,
    color: 'var(--text)',
    outline: 'none',
    width: '100%',
    transition: 'border-color 150ms',
  }

  return (
    <main style={{
      flex: 1, background: 'var(--bg)', color: 'var(--text)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: 'calc(100vh - 56px)', padding: '24px',
    }}>
      <div className="anim-fade-up" style={{ width: '100%', maxWidth: 400 }}>
        {/* Header */}
        <div style={{ marginBottom: 36, textAlign: 'center' }}>
          <p style={{
            fontSize: 11, color: 'var(--accent)', letterSpacing: '0.1em',
            textTransform: 'uppercase', fontWeight: 600, marginBottom: 12,
          }}>
            ATP Bot Trader
          </p>
          <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em' }}>Sign in</h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.5 }}>
            Enter your credentials to access the dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = 'var(--accent-line)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = 'var(--accent-line)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>

          {error && (
            <p style={{
              fontSize: 13, color: '#ef4444',
              padding: '10px 14px',
              background: 'rgba(239,68,68,0.07)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 8,
            }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary"
            style={{
              width: '100%', justifyContent: 'center', marginTop: 8,
              opacity: isLoading ? 0.65 : 1,
              cursor: isLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </main>
  )
}
