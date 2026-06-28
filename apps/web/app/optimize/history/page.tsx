'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store/useAppStore'
import { useOptimize, type AlgorithmVersion } from '@/hooks/useOptimize'
import { BackButton } from '@/components/back-button'

// ── helpers ──────────────────────────────────────────────────

function pct(v: number) {
  return `${(v * 100).toFixed(1)}%`
}

function fmtProfit(v: number) {
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}`
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function toLabel(key: string) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())
}

// ── Diff view ─────────────────────────────────────────────────

function DiffView({ a, b }: { a: AlgorithmVersion; b: AlgorithmVersion }) {
  const allKeys = Array.from(new Set([...Object.keys(a.params), ...Object.keys(b.params)]))

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 12, overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
        background: 'var(--surface-2)', borderBottom: '1px solid var(--border)',
        padding: '12px 20px', gap: 16,
      }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Parameter
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>v{a.version}{a.label ? ` — ${a.label}` : ''}</span>
          <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>{fmtDate(a.createdAt)}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>v{b.version}{b.label ? ` — ${b.label}` : ''}</span>
          <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>{fmtDate(b.createdAt)}</span>
        </div>
      </div>

      {/* Param rows */}
      <div>
        {allKeys.map((key, i) => {
          const va = a.params[key]
          const vb = b.params[key]
          const changed = String(va) !== String(vb)
          return (
            <div
              key={key}
              style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                gap: 16, padding: '11px 20px',
                background: changed ? 'rgba(234,179,8,0.04)' : 'transparent',
                borderTop: i === 0 ? 'none' : '1px solid var(--border-subtle)',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: 12, color: 'var(--text-faint)', fontWeight: 500 }}>{toLabel(key)}</span>
              <span style={{
                fontFamily: 'monospace', fontSize: 13, fontWeight: 600,
                color: changed ? '#f59e0b' : 'var(--text-muted)',
              }}>
                {va !== undefined ? String(va) : <span style={{ color: 'var(--text-faint)' }}>—</span>}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {changed && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                )}
                <span style={{
                  fontFamily: 'monospace', fontSize: 13, fontWeight: 600,
                  color: changed ? '#4cb87a' : 'var(--text-muted)',
                }}>
                  {vb !== undefined ? String(vb) : <span style={{ color: 'var(--text-faint)' }}>—</span>}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Result comparison */}
      <div style={{ borderTop: '1px solid var(--border)', background: 'var(--surface-2)', padding: '14px 20px' }}>
        <p style={{ fontSize: 11, color: 'var(--text-faint)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
          Results
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          {(['winRate', 'totalProfit', 'maxDrawdown', 'totalTrades'] as const).map(key => {
            const ra = a.result[key]
            const rb = b.result[key]
            const changed = ra !== rb
            const fmt = (v: number) =>
              key === 'winRate' ? pct(v)
              : key === 'totalProfit' ? fmtProfit(v)
              : key === 'maxDrawdown' ? `${v.toFixed(1)}%`
              : String(v)

            return (
              <div key={key} style={{ display: 'contents' }}>
                <span style={{ fontSize: 12, color: 'var(--text-faint)', alignSelf: 'center' }}>{toLabel(key)}</span>
                <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 600, color: changed ? '#f59e0b' : 'var(--text-muted)' }}>
                  {fmt(ra)}
                </span>
                <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 600, color: changed ? '#4cb87a' : 'var(--text-muted)' }}>
                  {fmt(rb)}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Snapshot row ──────────────────────────────────────────────

function SnapshotRow({ v, selectedIds, onToggle, selectionFull }: {
  v: AlgorithmVersion
  selectedIds: string[]
  onToggle: (id: string) => void
  selectionFull: boolean
}) {
  const isSelected = selectedIds.includes(v.id)
  const isDisabled = selectionFull && !isSelected
  const order = isSelected ? selectedIds.indexOf(v.id) + 1 : null

  return (
    <div
      onClick={() => { if (!isDisabled) onToggle(v.id) }}
      style={{
        display: 'grid',
        gridTemplateColumns: '36px auto 1fr repeat(3, 100px) 140px',
        alignItems: 'center', gap: 12, padding: '14px 20px',
        borderTop: '1px solid var(--border-subtle)',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.4 : 1,
        background: isSelected ? 'rgba(124,58,237,0.05)' : 'transparent',
        transition: 'background 120ms ease',
      }}
    >
      {/* Checkbox indicator */}
      <div style={{
        width: 22, height: 22, borderRadius: 6, flexShrink: 0,
        border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
        background: isSelected ? 'var(--accent)' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'border-color 150ms, background 150ms',
      }}>
        {isSelected && <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{order}</span>}
      </div>

      {/* Version + label */}
      <div>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>v{v.version}</span>
        {v.label && <span style={{ fontSize: 12, color: 'var(--text-faint)', marginLeft: 8 }}>{v.label}</span>}
      </div>

      {/* Params chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, minWidth: 0 }}>
        {Object.entries(v.params).slice(0, 5).map(([k, val]) => (
          <span key={k} style={{
            fontSize: 10, fontWeight: 500, padding: '1px 6px', borderRadius: 3,
            background: 'var(--surface-2)', border: '1px solid var(--border)',
            color: 'var(--text-muted)', whiteSpace: 'nowrap',
          }}>
            {k}={String(val)}
          </span>
        ))}
        {Object.keys(v.params).length > 5 && (
          <span style={{ fontSize: 10, color: 'var(--text-faint)', padding: '1px 4px' }}>
            +{Object.keys(v.params).length - 5}
          </span>
        )}
      </div>

      {/* Win rate */}
      <span style={{ fontSize: 13, fontWeight: 600, textAlign: 'right', color: v.result.winRate >= 0.6 ? '#4cb87a' : v.result.winRate >= 0.45 ? '#f59e0b' : '#ef4444' }}>
        {pct(v.result.winRate)}
      </span>

      {/* Profit */}
      <span style={{ fontSize: 13, fontWeight: 600, textAlign: 'right', fontFamily: 'monospace', color: v.result.totalProfit >= 0 ? '#4cb87a' : '#ef4444' }}>
        {fmtProfit(v.result.totalProfit)}
      </span>

      {/* Date */}
      <span style={{ fontSize: 11, color: 'var(--text-faint)', textAlign: 'right' }}>
        {fmtDate(v.createdAt)}
      </span>
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '36px auto 1fr repeat(3, 100px) 140px',
      gap: 12, padding: '14px 20px', borderTop: '1px solid var(--border-subtle)', alignItems: 'center',
    }}>
      <div style={{ width: 22, height: 22, borderRadius: 6, background: 'var(--border)' }} />
      <div style={{ width: 60, height: 12, borderRadius: 4, background: 'var(--border)' }} />
      <div style={{ width: 140, height: 12, borderRadius: 4, background: 'var(--border)' }} />
      <div style={{ width: 50, height: 12, borderRadius: 4, background: 'var(--border)', marginLeft: 'auto' }} />
      <div style={{ width: 60, height: 12, borderRadius: 4, background: 'var(--border)', marginLeft: 'auto' }} />
      <div style={{ width: 80, height: 12, borderRadius: 4, background: 'var(--border)', marginLeft: 'auto' }} />
      <div style={{ width: 90, height: 12, borderRadius: 4, background: 'var(--border)', marginLeft: 'auto' }} />
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────

const TH: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
  textTransform: 'uppercase', color: 'var(--text-faint)',
  padding: '10px 20px', background: 'var(--surface)',
}

export default function HistoryPage() {
  const router = useRouter()
  const { token } = useAppStore()
  const { data: snapshots, isLoading, isError, refetch } = useOptimize()

  const [selectedIds, setSelectedIds] = useState<string[]>([])

  useEffect(() => { if (!token) router.push('/login') }, [token, router])
  if (!token) return null

  const displayOrder = useMemo(
    () => snapshots ? [...snapshots].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : [],
    [snapshots],
  )

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id)
      if (prev.length >= 2) return prev
      return [...prev, id]
    })
  }

  const diffPair = useMemo(() => {
    if (selectedIds.length !== 2 || !snapshots) return null
    const a = snapshots.find(s => s.id === selectedIds[0])
    const b = snapshots.find(s => s.id === selectedIds[1])
    return a && b ? { a, b } : null
  }, [selectedIds, snapshots])

  return (
    <main style={{ flex: 1, background: 'var(--bg)', color: 'var(--text)', minHeight: 'calc(100vh - 56px)' }}>
      <div style={{ maxWidth: 1060, margin: '0 auto', padding: '40px 24px' }}>
        <BackButton />

        {/* Header */}
        <div className="anim-fade-up" style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 11, color: 'var(--text-faint)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>
            Optimize
          </p>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 'clamp(20px, 4vw, 28px)', fontWeight: 700, letterSpacing: '-0.03em' }}>
              Version History
            </h1>
            {selectedIds.length > 0 && (
              <button
                onClick={() => setSelectedIds([])}
                style={{
                  fontSize: 13, color: 'var(--text-faint)', background: 'none',
                  border: '1px solid var(--border)', borderRadius: 6, padding: '5px 12px', cursor: 'pointer',
                }}
              >
                Clear selection
              </button>
            )}
          </div>
          {selectedIds.length < 2 && !isLoading && displayOrder.length > 0 && (
            <p style={{ fontSize: 13, color: 'var(--text-faint)', marginTop: 6 }}>
              Select {selectedIds.length === 0 ? 'two' : 'one more'} version{selectedIds.length === 0 ? 's' : ''} to compare
            </p>
          )}
        </div>

        {/* Error */}
        {isError && (
          <div style={{
            background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 8, padding: '14px 18px', marginBottom: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 14, color: '#ef4444' }}>Failed to load history</span>
            <button onClick={() => refetch()} style={{ fontSize: 13, color: '#ef4444', background: 'none', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, padding: '4px 12px', cursor: 'pointer' }}>Retry</button>
          </div>
        )}

        {/* Diff panel */}
        {diffPair && (
          <div className="anim-fade-up" style={{ marginBottom: 28 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
              Comparison — v{diffPair.a.version} vs v{diffPair.b.version}
            </p>
            <DiffView a={diffPair.a} b={diffPair.b} />
          </div>
        )}

        {/* Snapshot list */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
          {/* Table header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '36px auto 1fr repeat(3, 100px) 140px',
            gap: 12, borderBottom: '1px solid var(--border)', alignItems: 'center',
          }}>
            <div style={TH} />
            <div style={TH}>Version</div>
            <div style={TH}>Parameters</div>
            <div style={{ ...TH, textAlign: 'right' }}>Win Rate</div>
            <div style={{ ...TH, textAlign: 'right' }}>Profit</div>
            <div style={{ ...TH, textAlign: 'right' }}>Drawdown</div>
            <div style={{ ...TH, textAlign: 'right' }}>Saved At</div>
          </div>

          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
            : displayOrder.length === 0
              ? (
                <div style={{ padding: '56px 24px', textAlign: 'center' }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>No snapshots yet</p>
                  <p style={{ fontSize: 13, color: 'var(--text-faint)' }}>Save a config snapshot from the Optimize page</p>
                </div>
              )
              : displayOrder.map(v => (
                <SnapshotRow
                  key={v.id}
                  v={v}
                  selectedIds={selectedIds}
                  onToggle={toggleSelect}
                  selectionFull={selectedIds.length >= 2}
                />
              ))
          }
        </div>
      </div>
    </main>
  )
}
