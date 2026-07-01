'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store/useAppStore'
import {
  useStrategies, useCreateStrategy, useActivateStrategy, useArchiveStrategy, useStrategyPerformance,
  type Strategy, type StrategyParams,
} from '@/hooks/useStrategy'
import { BackButton } from '@/components/back-button'

// ── helpers ──────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function biasColor(bias: StrategyParams['biasToday']) {
  return bias === 'BUY' ? 'var(--accent)' : bias === 'SELL' ? '#ef4444' : '#f59e0b'
}

// ── Feedback toast ────────────────────────────────────────────

function Feedback({ type, message }: { type: 'success' | 'error'; message: string }) {
  const ok = type === 'success'
  return (
    <div className="anim-fade-up" style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '12px 16px', borderRadius: 8, marginBottom: 20,
      background: ok ? 'rgba(76,184,122,0.08)' : 'rgba(239,68,68,0.08)',
      border: `1px solid ${ok ? 'rgba(76,184,122,0.25)' : 'rgba(239,68,68,0.25)'}`,
    }}>
      {ok ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4cb87a" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      )}
      <span style={{ fontSize: 13, fontWeight: 500, color: ok ? '#4cb87a' : '#ef4444' }}>{message}</span>
    </div>
  )
}

// ── Param chips ───────────────────────────────────────────────

function ParamChips({ params }: { params: StrategyParams }) {
  const summaryChips: Array<[string, string]> = [
    ['bias', params.biasToday],
    ['TP', `${params.tpPoints}pt`],
    ['SL', `${params.slPoints}pt`],
  ]
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
      {summaryChips.map(([k, v]) => (
        <span key={k} style={{
          fontSize: 10, fontWeight: 500, padding: '1px 6px', borderRadius: 3,
          background: 'var(--surface-2)', border: '1px solid var(--border)',
          color: k === 'bias' ? biasColor(params.biasToday) : 'var(--text-muted)',
          whiteSpace: 'nowrap',
        }}>
          {k === 'bias' ? v : `${k}=${v}`}
        </span>
      ))}
      {/* zones are pre-sorted biggest-timeframe-first by the backend (highest priority shown first).
          Fallback to [] for strategies saved before the zones[] refactor — those rows still
          have the old flat shape in the DB with no zones key at all. */}
      {(params.zones ?? []).map((z, i) => (
        <span key={`${z.timeframe}-${i}`} style={{
          fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 3,
          background: 'var(--accent-dim)', border: '1px solid var(--accent-line)',
          color: 'var(--accent)', whiteSpace: 'nowrap',
        }}>
          {z.timeframe}: {z.minWickTouches} touches ±{z.proximityPoints}pt{z.includeBody ? ' +body' : ''}
        </span>
      ))}
    </div>
  )
}

// ── Performance panel (fetched on expand) ────────────────────

function PerformancePanel({ id }: { id: string }) {
  const { data, isLoading, isError } = useStrategyPerformance(id, true)

  if (isLoading) return <p style={{ fontSize: 12, color: 'var(--text-faint)', padding: '12px 20px' }}>Loading performance…</p>
  if (isError || !data) return <p style={{ fontSize: 12, color: '#ef4444', padding: '12px 20px' }}>Failed to load performance</p>

  const stats: Array<[string, string, string]> = [
    ['Trades', String(data.totalTrades), 'var(--text)'],
    ['Wins', String(data.wins), 'var(--accent)'],
    ['Losses', String(data.losses), '#ef4444'],
    ['Win Rate', `${data.winRate}%`, data.winRate >= 60 ? 'var(--accent)' : data.winRate >= 45 ? '#f59e0b' : '#ef4444'],
    ['P&L', `${data.totalProfit >= 0 ? '+' : ''}${data.totalProfit.toFixed(2)}`, data.totalProfit >= 0 ? 'var(--accent)' : '#ef4444'],
  ]

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12,
      padding: '14px 20px', background: 'var(--surface-2)', borderTop: '1px solid var(--border-subtle)',
    }}>
      {stats.map(([label, value, color]) => (
        <div key={label}>
          <p style={{ fontSize: 10, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</p>
          <p style={{ fontSize: 15, fontWeight: 700, fontFamily: 'monospace', color }}>{value}</p>
        </div>
      ))}
    </div>
  )
}

// ── Strategy row ──────────────────────────────────────────────

function StrategyRow({ s, expandedId, onToggleExpand }: {
  s: Strategy
  expandedId: string | null
  onToggleExpand: (id: string) => void
}) {
  const { mutate: activate, isPending } = useActivateStrategy()
  const { mutate: archive, isPending: isArchiving } = useArchiveStrategy()
  const isExpanded = expandedId === s.id

  function handleArchive() {
    if (window.confirm('เก็บกลยุทธ์นี้เข้า archive? จะไม่แสดงในลิสต์อีก (ถ้า active อยู่จะถูกปิดด้วย)')) {
      archive(s.id)
    }
  }

  return (
    <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, padding: '16px 20px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            {s.isActive && (
              <span style={{
                fontSize: 10, fontWeight: 700, color: '#000', background: 'var(--accent)',
                padding: '1px 7px', borderRadius: 3, letterSpacing: '0.04em',
              }}>
                ACTIVE
              </span>
            )}
            <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>{fmtDate(s.updatedAt)}</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text)', marginBottom: 8, lineHeight: 1.5 }}>{s.rawText}</p>
          <ParamChips params={s.params} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
          <button
            onClick={() => onToggleExpand(s.id)}
            style={{
              fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', background: 'none',
              border: '1px solid var(--border)', borderRadius: 6, padding: '6px 12px', cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {isExpanded ? 'Hide Performance' : 'View Performance'}
          </button>
          {/* Active -> solid green button. Not active -> white button with green border/text (click to activate). */}
          <button
            onClick={() => !s.isActive && activate(s.id)}
            disabled={isPending || s.isActive}
            style={{
              fontSize: 12, fontWeight: 600,
              color: s.isActive ? '#fff' : (isPending ? 'var(--text-faint)' : 'var(--accent)'),
              background: s.isActive ? 'var(--accent)' : (isPending ? 'var(--surface-2)' : '#fff'),
              border: s.isActive ? 'none' : `1px solid var(--accent)`,
              borderRadius: 6, padding: '6px 12px',
              cursor: s.isActive ? 'default' : (isPending ? 'not-allowed' : 'pointer'),
              whiteSpace: 'nowrap',
            }}
          >
            {s.isActive ? 'Active' : (isPending ? 'Activating…' : 'Activate')}
          </button>
          <button
            onClick={handleArchive}
            disabled={isArchiving}
            style={{
              fontSize: 12, fontWeight: 500, color: 'var(--text-faint)', background: 'none',
              border: '1px solid var(--border)', borderRadius: 6, padding: '6px 12px',
              cursor: isArchiving ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap',
            }}
          >
            {isArchiving ? 'Archiving…' : 'Archive'}
          </button>
        </div>
      </div>

      {isExpanded && <PerformancePanel id={s.id} />}
    </div>
  )
}

// ── Skeleton ─────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-subtle)' }}>
      <div style={{ height: 10, width: 100, background: 'var(--border)', borderRadius: 4, marginBottom: 10 }} />
      <div style={{ height: 13, width: '70%', background: 'var(--border)', borderRadius: 4, marginBottom: 10 }} />
      <div style={{ height: 18, width: '50%', background: 'var(--border)', borderRadius: 4 }} />
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────

export default function StrategyPage() {
  const router = useRouter()
  const { token, isLoading: authLoading } = useAppStore()
  const { data: strategies, isLoading, isError, refetch } = useStrategies()
  const { mutate: createStrategy, isPending, isSuccess, isError: isCreateError, error, reset, data: created } = useCreateStrategy()

  const [rawText, setRawText] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { if (authLoading) return; if (!token) router.push('/login') }, [token, authLoading, router])

  useEffect(() => {
    if (isSuccess || isCreateError) {
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current)
      feedbackTimer.current = setTimeout(() => reset(), 4000)
    }
    return () => { if (feedbackTimer.current) clearTimeout(feedbackTimer.current) }
  }, [isSuccess, isCreateError, reset])

  if (authLoading || !token) return null

  function handleSubmit() {
    if (!rawText.trim()) return
    createStrategy(rawText, { onSuccess: () => setRawText('') })
  }

  // Active strategy is pinned to the top regardless of timestamps — the rest
  // fall back to most-recently-updated first.
  const displayOrder = strategies
    ? [...strategies].sort((a, b) => {
        if (a.isActive !== b.isActive) return a.isActive ? -1 : 1
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      })
    : []

  return (
    <main style={{ flex: 1, background: 'var(--bg)', color: 'var(--text)', minHeight: 'calc(100vh - 56px)' }}>
      <div style={{ maxWidth: 780, margin: '0 auto', padding: '40px 24px' }}>
        <BackButton />

        {/* Header */}
        <div className="anim-fade-up" style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 11, color: 'var(--text-faint)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>
            AI Strategy Engine
          </p>
          <h1 style={{ fontSize: 'clamp(20px, 4vw, 28px)', fontWeight: 700, letterSpacing: '-0.03em' }}>Strategy</h1>
          <p style={{ fontSize: 13, color: 'var(--text-faint)', marginTop: 6 }}>
            อธิบายกลยุทธ์เป็นข้อความ — AI จะแปลงเป็นค่า config ครั้งเดียว แล้ว EA จะคำนวณ zone และเข้าเทรดจริงเอง
          </p>
        </div>

        {isSuccess && created && (
          <Feedback type="success" message={`บันทึกกลยุทธ์แล้ว — bias: ${created.params.biasToday}, ${created.params.zones.length} zone rule(s)`} />
        )}
        {isCreateError && <Feedback type="error" message={error?.message ?? 'Failed to parse strategy'} />}

        {/* Create form */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 24 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
            กลยุทธ์ใหม่
          </p>
          <textarea
            value={rawText}
            onChange={e => setRawText(e.target.value)}
            placeholder="เช่น: lower wick cluster ที่โซนเดียวกัน 5 แท่งขึ้นไปใน H1 ถือเป็น demand zone วันนี้เล่น BUY เท่านั้น TP 300 จุด SL 150 จุด"
            rows={4}
            style={{
              width: '100%', resize: 'vertical', background: 'var(--surface-2)',
              border: '1px solid var(--border)', borderRadius: 6, padding: '10px 12px',
              fontSize: 13, color: 'var(--text)', outline: 'none', fontFamily: 'inherit',
              marginBottom: 12,
            }}
            onFocus={e => (e.target.style.borderColor = 'var(--accent-line)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border)')}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={handleSubmit}
              disabled={isPending || !rawText.trim()}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                fontSize: 13, fontWeight: 600,
                background: isPending || !rawText.trim() ? 'var(--surface-2)' : 'var(--accent)',
                color: isPending || !rawText.trim() ? 'var(--text-faint)' : '#fff',
                border: 'none', borderRadius: 7, padding: '9px 22px',
                cursor: isPending || !rawText.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              {isPending ? 'กำลังแปลงกลยุทธ์…' : 'บันทึกกลยุทธ์'}
            </button>
          </div>
        </div>

        {/* Error loading list */}
        {isError && (
          <div style={{
            background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 8, padding: '14px 18px', marginBottom: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 14, color: '#ef4444' }}>Failed to load strategies</span>
            <button onClick={() => refetch()} style={{ fontSize: 13, color: '#ef4444', background: 'none', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, padding: '4px 12px', cursor: 'pointer' }}>Retry</button>
          </div>
        )}

        {/* Strategy list */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-faint)', padding: '12px 20px', background: 'var(--surface-2)' }}>
            All Strategies
          </p>

          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
            : displayOrder.length === 0
              ? (
                <div style={{ padding: '56px 24px', textAlign: 'center', borderTop: '1px solid var(--border-subtle)' }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>ยังไม่มีกลยุทธ์</p>
                  <p style={{ fontSize: 13, color: 'var(--text-faint)' }}>พิมพ์กลยุทธ์แรกของคุณด้านบน</p>
                </div>
              )
              : displayOrder.map(s => (
                <StrategyRow
                  key={s.id}
                  s={s}
                  expandedId={expandedId}
                  onToggleExpand={id => setExpandedId(prev => prev === id ? null : id)}
                />
              ))
          }
        </div>
      </div>
    </main>
  )
}
