'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store/useAppStore'
import { useTrades, type Trade } from '@/hooks/useTrades'
import { BackButton } from '@/components/back-button'

const PAGE_SIZE = 50

// ── helpers ──────────────────────────────────────────────────

function fmt(price: number) {
  return price.toFixed(5)
}

function fmtProfit(v: number | null) {
  if (v === null) return '—'
  const sign = v >= 0 ? '+' : ''
  return `${sign}${v.toFixed(2)}`
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
}

// ── sub-components ────────────────────────────────────────────

function DirectionBadge({ dir }: { dir: 'BUY' | 'SELL' }) {
  const isBuy = dir === 'BUY'
  return (
    <span style={{
      display: 'inline-block', fontSize: 11, fontWeight: 700,
      letterSpacing: '0.06em', padding: '2px 8px', borderRadius: 4,
      color: isBuy ? '#4cb87a' : '#ef4444',
      background: isBuy ? 'rgba(76,184,122,0.1)' : 'rgba(239,68,68,0.1)',
      border: `1px solid ${isBuy ? 'rgba(76,184,122,0.25)' : 'rgba(239,68,68,0.25)'}`,
    }}>
      {dir}
    </span>
  )
}

function StatusBadge({ status }: { status: 'OPEN' | 'CLOSED' }) {
  const isOpen = status === 'OPEN'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4,
      color: isOpen ? 'var(--accent)' : 'var(--text-faint)',
      background: isOpen ? 'var(--accent-dim)' : 'var(--surface-2)',
      border: `1px solid ${isOpen ? 'var(--accent-line)' : 'var(--border)'}`,
    }}>
      {isOpen && (
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', animation: 'pulse-dot 2s ease infinite' }} />
      )}
      {status}
    </span>
  )
}

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 9 }).map((_, i) => (
        <td key={i} style={{ padding: '12px 14px' }}>
          <div style={{ height: 10, background: 'var(--border)', borderRadius: 4, width: i === 0 ? 60 : i === 4 ? 90 : 50 }} />
        </td>
      ))}
    </tr>
  )
}

function DateInput({ label, value, onChange, max }: {
  label: string
  value: string
  onChange: (v: string) => void
  max?: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-faint)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {label}
      </label>
      <input
        type="date"
        value={value}
        max={max}
        onChange={e => onChange(e.target.value)}
        style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 6, padding: '7px 10px', fontSize: 13, color: 'var(--text)',
          outline: 'none', cursor: 'pointer', transition: 'border-color 150ms',
          colorScheme: 'dark',
        }}
        onFocus={e => (e.target.style.borderColor = 'var(--accent-line)')}
        onBlur={e => (e.target.style.borderColor = 'var(--border)')}
      />
    </div>
  )
}

function Pagination({ page, total, limit, onPrev, onNext }: {
  page: number
  total: number
  limit: number
  onPrev: () => void
  onNext: () => void
}) {
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const btnStyle = (disabled: boolean): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: 6,
    fontSize: 13, fontWeight: 500, padding: '7px 14px', borderRadius: 6,
    background: 'var(--surface)', border: '1px solid var(--border)',
    color: disabled ? 'var(--text-faint)' : 'var(--text)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'border-color 150ms, color 150ms',
  })

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end', paddingTop: 16 }}>
      <span style={{ fontSize: 13, color: 'var(--text-faint)' }}>
        {total} trade{total !== 1 ? 's' : ''} · page {page} of {totalPages}
      </span>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onPrev} disabled={page <= 1} style={btnStyle(page <= 1)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Prev
        </button>
        <button onClick={onNext} disabled={page >= totalPages} style={btnStyle(page >= totalPages)}>
          Next
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>
  )
}

// ── Trade row ─────────────────────────────────────────────────

function TradeRow({ trade }: { trade: Trade }) {
  const [hovered, setHovered] = useState(false)
  const profit = trade.profit
  const profitColor = profit === null ? 'var(--text-faint)' : profit >= 0 ? '#4cb87a' : '#ef4444'

  return (
    <tr
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'var(--surface-2)' : 'transparent',
        transition: 'background 120ms ease',
      }}
    >
      <td style={{ padding: '11px 14px', fontWeight: 600, fontSize: 13, letterSpacing: '0.02em' }}>{trade.symbol}</td>
      <td style={{ padding: '11px 14px' }}><DirectionBadge dir={trade.direction} /></td>
      <td style={{ padding: '11px 14px', fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{fmt(trade.openPrice)}</td>
      <td style={{ padding: '11px 14px', fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{trade.closePrice !== null ? fmt(trade.closePrice) : '—'}</td>
      <td style={{ padding: '11px 14px', fontSize: 12, color: 'var(--text-faint)' }}>{fmtDate(trade.openTime)}</td>
      <td style={{ padding: '11px 14px', fontSize: 12, color: 'var(--text-faint)' }}>{fmtDate(trade.closeTime)}</td>
      <td style={{ padding: '11px 14px', fontSize: 12, color: 'var(--text-muted)', textAlign: 'right' }}>{trade.volume}</td>
      <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 700, textAlign: 'right', color: profitColor, fontFamily: 'monospace' }}>
        {fmtProfit(profit)}
      </td>
      <td style={{ padding: '11px 14px' }}><StatusBadge status={trade.status} /></td>
    </tr>
  )
}

// ── Main page ──────────────────────────────────────────────────

const TH: React.CSSProperties = {
  padding: '10px 14px', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
  textTransform: 'uppercase', color: 'var(--text-faint)',
  borderBottom: '1px solid var(--border)', textAlign: 'left',
  whiteSpace: 'nowrap', background: 'var(--surface)',
  position: 'sticky', top: 0,
}

export default function LogPage() {
  const router = useRouter()
  const { token, isLoading: authLoading } = useAppStore()
  const [page, setPage] = useState(1)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const { data, isLoading, isError, refetch } = useTrades({ page, limit: PAGE_SIZE, from: from || undefined, to: to || undefined })

  useEffect(() => { if (authLoading) return; if (!token) router.push("/login") }, [token, authLoading, router])
  if (authLoading || !token) return null

  function handleFromChange(v: string) { setFrom(v); setPage(1) }
  function handleToChange(v: string) { setTo(v); setPage(1) }
  function clearFilters() { setFrom(''); setTo(''); setPage(1) }

  const hasFilter = from || to
  const today = new Date().toISOString().slice(0, 10)

  return (
    <main style={{ flex: 1, background: 'var(--bg)', color: 'var(--text)', minHeight: 'calc(100vh - 56px)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>
        <BackButton />

        {/* Header */}
        <div className="anim-fade-up" style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 11, color: 'var(--text-faint)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>
            Trade Log
          </p>
          <h1 style={{ fontSize: 'clamp(20px, 4vw, 28px)', fontWeight: 700, letterSpacing: '-0.03em' }}>
            History
          </h1>
        </div>

        {/* Filters */}
        <div className="anim-fade-up" style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 10, padding: '16px 20px', marginBottom: 20,
          display: 'flex', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap',
        }}>
          <DateInput label="From" value={from} onChange={handleFromChange} max={to || today} />
          <DateInput label="To" value={to} onChange={handleToChange} max={today} />
          {hasFilter && (
            <button
              onClick={clearFilters}
              style={{
                fontSize: 13, color: 'var(--text-faint)', background: 'none',
                border: '1px solid var(--border)', borderRadius: 6,
                padding: '7px 12px', cursor: 'pointer', transition: 'border-color 150ms, color 150ms',
                marginBottom: 1,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-line)'; e.currentTarget.style.color = 'var(--text)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-faint)' }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Error */}
        {isError && (
          <div style={{
            background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 8, padding: '14px 18px', marginBottom: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 14, color: '#ef4444' }}>Failed to load trades</span>
            <button onClick={() => refetch()} style={{ fontSize: 13, color: '#ef4444', background: 'none', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, padding: '4px 12px', cursor: 'pointer' }}>
              Retry
            </button>
          </div>
        )}

        {/* Table */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 780 }}>
              <thead>
                <tr>
                  {['Symbol', 'Direction', 'Open Price', 'Close Price', 'Open Time', 'Close Time', 'Volume', 'Profit', 'Status'].map((col, i) => (
                    <th key={col} style={{ ...TH, textAlign: i >= 6 && i <= 7 ? 'right' : 'left' }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                  : data && data.trades.length > 0
                    ? data.trades.map(t => <TradeRow key={t.id} trade={t} />)
                    : (
                      <tr>
                        <td colSpan={9} style={{ padding: '56px 24px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-faint)" strokeWidth="1.6" strokeLinecap="round">
                                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                                <rect x="9" y="3" width="6" height="4" rx="1" />
                              </svg>
                            </div>
                            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)' }}>
                              {hasFilter ? 'No trades match the selected dates' : 'No trades yet'}
                            </p>
                            <p style={{ fontSize: 13, color: 'var(--text-faint)' }}>
                              {hasFilter ? 'Try adjusting the date range' : 'Trades will appear once MT5 bridge is connected'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data && data.total > 0 && (
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
              <Pagination
                page={page}
                total={data.total}
                limit={PAGE_SIZE}
                onPrev={() => setPage(p => Math.max(1, p - 1))}
                onNext={() => setPage(p => p + 1)}
              />
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
