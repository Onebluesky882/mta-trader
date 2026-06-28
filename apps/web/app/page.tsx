'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAppStore } from '@/store/useAppStore'
import { useDashboard } from '@/hooks/useDashboard'

function statusColor(status: string) {
  if (status === 'RUNNING') return 'var(--accent)'
  if (status === 'ERROR') return '#ef4444'
  return '#555555'
}

function formatPnL(value: number) {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}`
}

function SkeletonStat() {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '28px 24px',
    }}>
      <div style={{ width: 60, height: 9, background: 'var(--surface-3)', borderRadius: 4, marginBottom: 20 }} />
      <div style={{ width: 100, height: 30, background: 'var(--surface-3)', borderRadius: 4 }} />
    </div>
  )
}

type CardType = 'status' | 'number' | 'positive' | 'negative'

function StatCard({ label, value, type, delay }: { label: string; value: string; type: CardType; delay: number }) {
  const isPositive = type === 'positive'
  const isNegative = type === 'negative'
  const isStatus  = type === 'status'
  const color = isStatus
    ? statusColor(value)
    : isPositive ? 'var(--accent)'
    : isNegative ? '#ef4444'
    : 'var(--text)'

  return (
    <div
      className="anim-fade-up"
      style={{
        animationDelay: `${delay}ms`,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: '28px 24px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'border-color 200ms, transform 200ms',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,208,132,0.25)'
        ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'
        ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
      }}
    >
      {/* subtle top border accent */}
      <div style={{
        position: 'absolute', top: 0, left: 24, right: 24, height: 1,
        background: `linear-gradient(90deg, transparent, ${color}44, transparent)`,
      }} />

      <p style={{
        fontSize: 10, color: 'var(--text-faint)',
        letterSpacing: '0.12em', textTransform: 'uppercase',
        fontWeight: 700, marginBottom: 16,
      }}>
        {label}
      </p>

      {isStatus ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative', width: 10, height: 10, flexShrink: 0 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
            {value === 'RUNNING' && (
              <div style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                background: color, animation: 'pulse-ring 2s ease-out infinite',
              }} />
            )}
          </div>
          <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color }}>{value}</span>
        </div>
      ) : (
        <span className="stat-value" style={{ color }}>{value}</span>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const { token, isLoading: authLoading } = useAppStore()
  const { data, isLoading, isError, refetch } = useDashboard()

  useEffect(() => {
    if (authLoading) return
    if (!token) router.push('/login')
  }, [token, authLoading, router])

  if (authLoading || !token) return null

  const cards: { label: string; value: string; type: CardType }[] = data
    ? [
        { label: 'Bot Status',  value: data.botStatus,                 type: 'status' },
        { label: 'Open Trades', value: String(data.openTrades),        type: 'number' },
        { label: 'Today P&L',   value: formatPnL(data.todayPnL),       type: data.todayPnL >= 0 ? 'positive' : 'negative' },
        { label: 'Total P&L',   value: formatPnL(data.totalPnL),       type: data.totalPnL >= 0 ? 'positive' : 'negative' },
        { label: 'Win Rate',    value: `${(data.winRate * 100).toFixed(1)}%`, type: 'number' },
      ]
    : []

  return (
    <main style={{ flex: 1, background: 'var(--bg)', color: 'var(--text)', position: 'relative', minHeight: 'calc(100vh - 64px)' }}>

      {/* Grid mesh background */}
      <div className="grid-bg" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.5 }} />

      {/* Green orb — top right */}
      <div style={{
        position: 'absolute', top: -200, right: -100,
        width: 700, height: 700,
        background: 'radial-gradient(ellipse at center, rgba(0,208,132,0.07) 0%, transparent 65%)',
        animation: 'orb-move 14s ease-in-out infinite',
        pointerEvents: 'none',
      }} />
      {/* Dim orb — bottom left */}
      <div style={{
        position: 'absolute', bottom: 0, left: -200,
        width: 500, height: 500,
        background: 'radial-gradient(ellipse at center, rgba(0,208,132,0.04) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', maxWidth: 1100, margin: '0 auto', padding: '60px 32px 80px' }}>

        {/* ── Hero header ── */}
        <div className="anim-fade-up" style={{ marginBottom: 56 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: 'var(--accent)',
              boxShadow: '0 0 10px var(--accent)',
              animation: 'glow-pulse 2s ease-in-out infinite',
            }} />
            <span style={{ fontSize: 11, color: 'var(--accent)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>
              Live Trading Dashboard
            </span>
          </div>
          <h1 style={{
            fontSize: 'clamp(28px, 5vw, 48px)',
            fontWeight: 800,
            letterSpacing: '-0.04em',
            lineHeight: 1.1,
            color: '#fff',
          }}>
            Trading{' '}
            <span className="shimmer-text">Overview</span>
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 12, maxWidth: 420, lineHeight: 1.6 }}>
            Real-time performance metrics from your automated bot running on MetaTrader 5.
          </p>
        </div>

        {/* ── Error banner ── */}
        {isError && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 8, padding: '14px 18px', marginBottom: 32,
          }}>
            <span style={{ fontSize: 13, color: '#ef4444' }}>Failed to load dashboard data</span>
            <button
              onClick={() => refetch()}
              style={{ fontSize: 12, color: '#ef4444', background: 'none', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, padding: '4px 12px', cursor: 'pointer' }}
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Stat grid ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 14,
          marginBottom: 40,
        }}>
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => <SkeletonStat key={i} />)
            : cards.map((c, i) => (
                <StatCard key={c.label} label={c.label} value={c.value} type={c.type} delay={i * 60} />
              ))}
        </div>

        {/* ── Quick nav ── */}
        {!isLoading && (
          <div className="anim-fade-up-4" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link href="/log" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              fontSize: 13, fontWeight: 600, color: 'var(--text-muted)',
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 7, padding: '9px 18px', textDecoration: 'none',
              transition: 'border-color 150ms, color 150ms',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--accent-line)'; (e.currentTarget as HTMLAnchorElement).style.color = 'var(--accent)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-muted)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
              Trade Log
            </Link>
            <Link href="/settings" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              fontSize: 13, fontWeight: 600, color: 'var(--text-muted)',
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 7, padding: '9px 18px', textDecoration: 'none',
              transition: 'border-color 150ms, color 150ms',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--accent-line)'; (e.currentTarget as HTMLAnchorElement).style.color = 'var(--accent)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-muted)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3" /><path d="M19.07 4.93A10 10 0 0 1 21 12a10 10 0 0 1-1.93 5.07" /><path d="M4.93 4.93A10 10 0 0 0 3 12a10 10 0 0 0 1.93 5.07" /></svg>
              Algorithm Settings
            </Link>
            <Link href="/optimize" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              fontSize: 13, fontWeight: 700, color: '#000',
              background: 'var(--accent)',
              borderRadius: 7, padding: '9px 18px', textDecoration: 'none',
              border: 'none', transition: 'background 150ms, box-shadow 150ms',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'var(--accent-hover)'; (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 4px 16px var(--accent-glow)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'var(--accent)'; (e.currentTarget as HTMLAnchorElement).style.boxShadow = 'none' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>
              Optimize
            </Link>
          </div>
        )}

        {/* last updated */}
        {data?.lastUpdated && !isLoading && (
          <p style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 28, letterSpacing: '0.04em' }}>
            Last updated {new Date(data.lastUpdated).toLocaleTimeString('en-GB')}
          </p>
        )}
      </div>
    </main>
  )
}
