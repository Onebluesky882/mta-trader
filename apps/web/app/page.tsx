'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store/useAppStore'
import { useDashboard } from '@/hooks/useDashboard'

function statusColor(status: string) {
  if (status === 'RUNNING') return '#4cb87a'
  if (status === 'ERROR') return '#ef4444'
  return '#888888'
}

function formatPnL(value: number) {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}`
}

function SkeletonCard() {
  return (
    <div className="card" style={{ padding: '28px 24px' }}>
      <div style={{ width: 72, height: 10, background: 'var(--border)', borderRadius: 4, marginBottom: 20 }} />
      <div style={{ width: 110, height: 28, background: 'var(--border)', borderRadius: 4 }} />
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const { token } = useAppStore()
  const { data, isLoading, isError, refetch } = useDashboard()

  useEffect(() => {
    if (!token) router.push('/login')
  }, [token, router])

  if (!token) return null

  const cards = data
    ? [
        { label: 'Bot Status', value: data.botStatus, type: 'status' as const },
        { label: 'Open Trades', value: String(data.openTrades), type: 'number' as const },
        {
          label: 'Today P&L',
          value: formatPnL(data.todayPnL),
          type: (data.todayPnL >= 0 ? 'positive' : 'negative') as 'positive' | 'negative',
        },
        {
          label: 'Total P&L',
          value: formatPnL(data.totalPnL),
          type: (data.totalPnL >= 0 ? 'positive' : 'negative') as 'positive' | 'negative',
        },
        { label: 'Win Rate', value: `${(data.winRate * 100).toFixed(1)}%`, type: 'number' as const },
      ]
    : []

  return (
    <main style={{ flex: 1, background: 'var(--bg)', color: 'var(--text)' }}>
      <div style={{ position: 'relative', overflow: 'hidden', minHeight: 'calc(100vh - 56px)' }}>
        {/* Dot grid background */}
        <div
          className="dot-grid"
          style={{ position: 'absolute', inset: 0, opacity: 0.06, pointerEvents: 'none' }}
        />
        {/* Orb glow */}
        <div style={{
          position: 'absolute', top: -120, right: -80,
          width: 600, height: 600,
          background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.12) 0%, transparent 70%)',
          animation: 'orb-move 12s ease-in-out infinite',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', maxWidth: 960, margin: '0 auto', padding: '48px 24px' }}>
          {/* Header */}
          <div className="anim-fade-up" style={{ marginBottom: 40 }}>
            <p style={{
              fontSize: 11, color: 'var(--text-faint)', letterSpacing: '0.1em',
              textTransform: 'uppercase', fontWeight: 600, marginBottom: 8,
            }}>
              Dashboard
            </p>
            <h1 style={{ fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.2 }}>
              Trading Overview
            </h1>
          </div>

          {/* Error state */}
          {isError && (
            <div style={{
              background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 8, padding: '14px 18px', marginBottom: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: 14, color: '#ef4444' }}>Failed to load dashboard data</span>
              <button
                onClick={() => refetch()}
                style={{
                  fontSize: 13, color: '#ef4444', background: 'none',
                  border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6,
                  padding: '4px 12px', cursor: 'pointer',
                }}
              >
                Retry
              </button>
            </div>
          )}

          {/* Stat cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: 16,
          }}>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
              : cards.map((card, i) => (
                  <div
                    key={card.label}
                    className={`card anim-fade-up-${Math.min(i + 1, 4)}`}
                    style={{ padding: '28px 24px', cursor: 'default' }}
                  >
                    <p style={{
                      fontSize: 11, color: 'var(--text-faint)', letterSpacing: '0.08em',
                      textTransform: 'uppercase', fontWeight: 600, marginBottom: 14,
                    }}>
                      {card.label}
                    </p>

                    {card.type === 'status' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ position: 'relative', flexShrink: 0, width: 10, height: 10 }}>
                          <div style={{
                            width: 10, height: 10, borderRadius: '50%',
                            background: statusColor(card.value),
                          }} />
                          {card.value === 'RUNNING' && (
                            <div style={{
                              position: 'absolute', inset: 0, borderRadius: '50%',
                              background: statusColor(card.value),
                              animation: 'pulse-ring 1.8s ease-out infinite',
                            }} />
                          )}
                        </div>
                        <span style={{
                          fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em',
                          color: statusColor(card.value),
                        }}>
                          {card.value}
                        </span>
                      </div>
                    ) : (
                      <span style={{
                        fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em',
                        color:
                          card.type === 'positive'
                            ? '#4cb87a'
                            : card.type === 'negative'
                              ? '#ef4444'
                              : 'var(--text)',
                      }}>
                        {card.value}
                      </span>
                    )}
                  </div>
                ))}
          </div>

          {/* Last updated */}
          {data?.lastUpdated && !isLoading && (
            <p className="anim-fade-up-4" style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 24 }}>
              Updated {new Date(data.lastUpdated).toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>
    </main>
  )
}
