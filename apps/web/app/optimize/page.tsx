'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAppStore } from '@/store/useAppStore'
import { useOptimize, useSaveSnapshot, type AlgorithmVersion } from '@/hooks/useOptimize'
import { useSettings } from '@/hooks/useSettings'
import { useDashboard } from '@/hooks/useDashboard'
import { BackButton } from '@/components/back-button'

// ── helpers ──────────────────────────────────────────────────

function pct(v: number) {
  return `${(v * 100).toFixed(1)}%`
}

function formatProfit(v: number) {
  const sign = v >= 0 ? '+' : ''
  return `${sign}${v.toFixed(2)}`
}

function winRateColor(r: number) {
  if (r >= 0.6) return '#4cb87a'
  if (r >= 0.45) return '#f59e0b'
  return '#ef4444'
}

function profitColor(v: number) {
  return v >= 0 ? '#4cb87a' : '#ef4444'
}

function drawdownColor(v: number) {
  if (v <= 5) return '#4cb87a'
  if (v <= 15) return '#f59e0b'
  return '#ef4444'
}

function relativeBar(value: number, max: number, color: string) {
  const pct = max === 0 ? 0 : Math.min((value / max) * 100, 100)
  return (
    <div style={{ height: 3, background: 'var(--border)', borderRadius: 2, marginTop: 6 }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, transition: 'width 600ms ease' }} />
    </div>
  )
}

// ── sub-components ────────────────────────────────────────────

function MetricRow({
  label, value, color, sub,
}: {
  label: string
  value: string
  color?: string
  sub?: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 10 }}>
      <span style={{ fontSize: 12, color: 'var(--text-faint)', fontWeight: 500 }}>{label}</span>
      <div style={{ textAlign: 'right' }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: color ?? 'var(--text)' }}>{value}</span>
        {sub}
      </div>
    </div>
  )
}

function ParamsChip({ k, v }: { k: string; v: number | string | boolean }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: 'var(--surface-2)', border: '1px solid var(--border)',
      borderRadius: 4, padding: '2px 8px', fontSize: 11,
      color: 'var(--text-muted)', whiteSpace: 'nowrap',
    }}>
      <span style={{ color: 'var(--text-faint)' }}>{k}</span>
      <span style={{ color: 'var(--text)', fontWeight: 600 }}>{String(v)}</span>
    </span>
  )
}

function VersionCard({
  v,
  isBest,
  maxProfit,
  rank,
}: {
  v: AlgorithmVersion
  isBest: boolean
  maxProfit: number
  rank: number
}) {
  const r = v.result
  const date = new Date(v.createdAt).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })

  return (
    <div
      className={`card anim-fade-up-${Math.min(rank, 4)}`}
      style={{
        padding: '24px',
        borderColor: isBest ? 'var(--accent-line)' : undefined,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
      }}
    >
      {/* Best badge */}
      {isBest && (
        <div style={{
          position: 'absolute', top: 16, right: 16,
          fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
          color: 'var(--accent)', background: 'var(--accent-dim)',
          border: '1px solid var(--accent-line)', borderRadius: 100,
          padding: '2px 10px', textTransform: 'uppercase',
        }}>
          Best
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 11, color: 'var(--text-faint)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            v{v.version}
          </span>
          {v.label && (
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{v.label}</span>
          )}
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>{date}</span>
      </div>

      {/* Metrics */}
      <div style={{ flex: 1, borderTop: '1px solid var(--border-subtle)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 0 }}>
        <MetricRow
          label="Total P&L"
          value={formatProfit(r.totalProfit)}
          color={profitColor(r.totalProfit)}
          sub={relativeBar(Math.max(r.totalProfit, 0), maxProfit, profitColor(r.totalProfit))}
        />
        <MetricRow
          label="Win Rate"
          value={pct(r.winRate)}
          color={winRateColor(r.winRate)}
          sub={relativeBar(r.winRate, 1, winRateColor(r.winRate))}
        />
        <MetricRow
          label="Trades"
          value={String(r.totalTrades)}
        />
        <MetricRow
          label="Max Drawdown"
          value={`${r.maxDrawdown.toFixed(1)}%`}
          color={drawdownColor(r.maxDrawdown)}
        />
        {r.sharpeRatio !== null && (
          <MetricRow
            label="Sharpe Ratio"
            value={r.sharpeRatio.toFixed(2)}
            color={r.sharpeRatio >= 1 ? '#4cb87a' : r.sharpeRatio >= 0 ? '#f59e0b' : '#ef4444'}
          />
        )}
      </div>

      {/* Params */}
      {Object.keys(v.params).length > 0 && (
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border-subtle)', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {Object.entries(v.params).map(([k, val]) => (
            <ParamsChip key={k} k={k} v={val} />
          ))}
        </div>
      )}
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ width: 48, height: 10, background: 'var(--border)', borderRadius: 4 }} />
        <div style={{ width: 100, height: 14, background: 'var(--border)', borderRadius: 4 }} />
      </div>
      {[80, 100, 60, 90].map((w, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ width: w * 0.6, height: 10, background: 'var(--border)', borderRadius: 4 }} />
          <div style={{ width: w * 0.4, height: 10, background: 'var(--border)', borderRadius: 4 }} />
        </div>
      ))}
    </div>
  )
}

// ── Summary bar ────────────────────────────────────────────────

function SummaryBar({ versions }: { versions: AlgorithmVersion[] }) {
  if (versions.length === 0) return null
  const best = versions.reduce((a, b) => (b.result.totalProfit > a.result.totalProfit ? b : a))
  const totalTrades = versions.reduce((s, v) => s + v.result.totalTrades, 0)
  const avgWin = versions.reduce((s, v) => s + v.result.winRate, 0) / versions.length

  const stats = [
    { label: 'Versions tested', value: String(versions.length) },
    { label: 'Best version', value: best.label ? `v${best.version} — ${best.label}` : `v${best.version}`, accent: true },
    { label: 'Total trades', value: String(totalTrades) },
    { label: 'Avg win rate', value: pct(avgWin), color: winRateColor(avgWin) },
  ]

  return (
    <div className="anim-fade-up" style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '20px 24px',
      marginBottom: 32,
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
      gap: 0,
    }}>
      {stats.map((s, i) => (
        <div key={s.label} style={{
          padding: '4px 16px',
          borderLeft: i === 0 ? 'none' : '1px solid var(--border)',
        }}>
          <p style={{ fontSize: 11, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 6 }}>{s.label}</p>
          <p style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em', color: s.accent ? 'var(--accent)' : (s.color ?? 'var(--text)') }}>
            {s.value}
          </p>
        </div>
      ))}
    </div>
  )
}

// ── Save modal ─────────────────────────────────────────────────

function SaveModal({ onClose, onSave, isPending }: {
  onClose: () => void
  onSave: (label: string) => void
  isPending: boolean
}) {
  const [label, setLabel] = useState('')
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="anim-fade-up" style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 14, padding: '28px 28px 24px', width: '100%', maxWidth: 420,
      }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 6 }}>Save Current Config</h2>
        <p style={{ fontSize: 13, color: 'var(--text-faint)', marginBottom: 24, lineHeight: 1.5 }}>
          Snapshot the active algorithm parameters and current P&L results as a new version.
        </p>
        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-faint)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Label (optional)
        </label>
        <input
          type="text"
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder="e.g. Conservative RSI 14"
          maxLength={60}
          autoFocus
          onKeyDown={e => { if (e.key === 'Enter' && !isPending) onSave(label) }}
          style={{
            display: 'block', width: '100%', marginTop: 8, marginBottom: 24,
            background: 'var(--surface-2)', border: '1px solid var(--border)',
            borderRadius: 7, padding: '9px 12px', fontSize: 13, color: 'var(--text)',
            outline: 'none', boxSizing: 'border-box',
          }}
        />
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{
            fontSize: 13, fontWeight: 500, color: 'var(--text-muted)',
            background: 'none', border: '1px solid var(--border)',
            borderRadius: 7, padding: '9px 18px', cursor: 'pointer',
          }}>Cancel</button>
          <button onClick={() => onSave(label)} disabled={isPending} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontSize: 13, fontWeight: 600,
            background: isPending ? 'var(--surface-2)' : 'var(--accent)',
            color: isPending ? 'var(--text-faint)' : '#fff',
            border: 'none', borderRadius: 7, padding: '9px 22px', cursor: isPending ? 'not-allowed' : 'pointer',
          }}>
            {isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────

export default function OptimizePage() {
  const router = useRouter()
  const { token } = useAppStore()
  const { data: versions, isLoading, isError, refetch } = useOptimize()
  const { data: settings } = useSettings()
  const { data: dashboard } = useDashboard()
  const { mutate: saveSnapshot, isPending: isSaving } = useSaveSnapshot()

  const [showSaveModal, setShowSaveModal] = useState(false)
  const [saveMsg, setSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const msgTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { if (!token) router.push('/login') }, [token, router])

  if (!token) return null

  const sorted = useMemo(
    () => (versions ? [...versions].sort((a, b) => b.result.totalProfit - a.result.totalProfit) : []),
    [versions],
  )
  const bestId = sorted[0]?.id
  const maxProfit = sorted[0]?.result.totalProfit ?? 0

  const displayOrder = useMemo(
    () => (versions ? [...versions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : []),
    [versions],
  )

  function handleSave(label: string) {
    if (!settings) return
    saveSnapshot(
      {
        params: settings.params as Record<string, number | string | boolean>,
        result: {
          totalTrades: 0,
          winRate: dashboard?.winRate ?? 0,
          totalProfit: dashboard?.totalPnL ?? 0,
          maxDrawdown: 0,
          sharpeRatio: null,
        },
        label: label.trim() || undefined,
      },
      {
        onSuccess: () => {
          setShowSaveModal(false)
          setSaveMsg({ type: 'success', text: 'Snapshot saved' })
          if (msgTimer.current) clearTimeout(msgTimer.current)
          msgTimer.current = setTimeout(() => setSaveMsg(null), 3000)
        },
        onError: (err) => {
          setShowSaveModal(false)
          setSaveMsg({ type: 'error', text: err.message })
          if (msgTimer.current) clearTimeout(msgTimer.current)
          msgTimer.current = setTimeout(() => setSaveMsg(null), 3000)
        },
      },
    )
  }

  return (
    <>
    {showSaveModal && (
      <SaveModal onClose={() => setShowSaveModal(false)} onSave={handleSave} isPending={isSaving} />
    )}
    <main style={{ flex: 1, background: 'var(--bg)', color: 'var(--text)' }}>
      <div style={{ position: 'relative', overflow: 'hidden', minHeight: 'calc(100vh - 56px)' }}>
        {/* Dot grid */}
        <div className="dot-grid" style={{ position: 'absolute', inset: 0, opacity: 0.05, pointerEvents: 'none' }} />
        {/* Orb */}
        <div style={{
          position: 'absolute', top: -80, left: '60%',
          width: 500, height: 500,
          background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.10) 0%, transparent 70%)',
          animation: 'orb-move 14s ease-in-out infinite',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', maxWidth: 960, margin: '0 auto', padding: '40px 24px' }}>
          <BackButton />

          {/* Header */}
          <div className="anim-fade-up" style={{ marginBottom: 32 }}>
            <p style={{ fontSize: 11, color: 'var(--text-faint)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>
              Optimize
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: 'clamp(20px, 4vw, 30px)', fontWeight: 700, letterSpacing: '-0.03em' }}>
                Algorithm Versions
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Link href="/optimize/history" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontSize: 13, fontWeight: 500, color: 'var(--text-muted)',
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 7, padding: '7px 14px', textDecoration: 'none',
                  transition: 'border-color 150ms, color 150ms',
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M12 8v4l3 3" /><circle cx="12" cy="12" r="10" />
                  </svg>
                  History
                </Link>
                <button
                  onClick={() => setShowSaveModal(true)}
                  disabled={!settings}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    fontSize: 13, fontWeight: 600,
                    background: settings ? 'var(--accent)' : 'var(--surface-2)',
                    color: settings ? '#fff' : 'var(--text-faint)',
                    border: 'none', borderRadius: 7, padding: '7px 16px', cursor: settings ? 'pointer' : 'not-allowed',
                    transition: 'background 150ms, transform 150ms',
                  }}
                  onMouseEnter={e => { if (settings) e.currentTarget.style.transform = 'translateY(-1px)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                    <polyline points="7 3 7 8 15 8" />
                  </svg>
                  Save Current Config
                </button>
              </div>
            </div>
            {/* Inline feedback */}
            {saveMsg && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 12,
                fontSize: 13, fontWeight: 500,
                color: saveMsg.type === 'success' ? '#4cb87a' : '#ef4444',
                background: saveMsg.type === 'success' ? 'rgba(76,184,122,0.08)' : 'rgba(239,68,68,0.08)',
                border: `1px solid ${saveMsg.type === 'success' ? 'rgba(76,184,122,0.25)' : 'rgba(239,68,68,0.25)'}`,
                borderRadius: 7, padding: '6px 14px',
              }}>
                {saveMsg.type === 'success'
                  ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                  : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                }
                {saveMsg.text}
              </div>
            )}
          </div>

          {/* Error */}
          {isError && (
            <div style={{
              background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 8, padding: '14px 18px', marginBottom: 24,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: 14, color: '#ef4444' }}>Failed to load versions</span>
              <button
                onClick={() => refetch()}
                style={{ fontSize: 13, color: '#ef4444', background: 'none', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, padding: '4px 12px', cursor: 'pointer' }}
              >
                Retry
              </button>
            </div>
          )}

          {/* Summary */}
          {!isLoading && versions && versions.length > 0 && (
            <SummaryBar versions={versions} />
          )}

          {/* Cards */}
          {isLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
              {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : !versions || versions.length === 0 ? (
            /* Empty state */
            <div style={{
              border: '1px dashed var(--border)', borderRadius: 'var(--radius)',
              padding: '64px 24px', textAlign: 'center',
            }}>
              <div style={{ width: 44, height: 44, margin: '0 auto 20px', borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-faint)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
              </div>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>No versions yet</p>
              <p style={{ fontSize: 13, color: 'var(--text-faint)', lineHeight: 1.6, maxWidth: 320, margin: '0 auto' }}>
                Algorithm version results will appear here once MT5 bridge starts sending data.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
              {displayOrder.map((v, i) => (
                <VersionCard
                  key={v.id}
                  v={v}
                  isBest={v.id === bestId}
                  maxProfit={maxProfit}
                  rank={i + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
    </>
  )
}
