'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store/useAppStore'
import { useAiConfig, useUpdateAiConfig, type AiConfig } from '@/hooks/useAiConfig'

const DEFAULTS: AiConfig = {
  aiEnabled: false,
  symbol: 'XAUUSD',
  confidenceMin: 70,
  rrMin: 1.5,
  analyzeH1: true,
  analyzeH4: true,
  useDynamicSL: false,
  maxSignalAgeMin: 60,
}

const SYMBOLS = ['XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD']

// ── Components ────────────────────────────────────────────────

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      style={{
        width: 40, height: 22, borderRadius: 11,
        background: value ? 'var(--accent)' : 'var(--border)',
        border: 'none', cursor: 'pointer', position: 'relative',
        transition: 'background 200ms', flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: 3,
        left: value ? 21 : 3,
        width: 16, height: 16,
        borderRadius: '50%', background: '#fff',
        transition: 'left 200ms',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
      }} />
    </button>
  )
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 1fr',
      alignItems: 'center', gap: 16,
      padding: '14px 0', borderBottom: '1px solid var(--border-subtle)',
    }}>
      <div>
        <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 2 }}>{label}</p>
        {hint && <p style={{ fontSize: 11, color: 'var(--text-faint)' }}>{hint}</p>}
      </div>
      <div>{children}</div>
    </div>
  )
}

const inputBase: React.CSSProperties = {
  background: 'var(--surface-2)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  padding: '8px 12px',
  fontSize: 13,
  color: 'var(--text)',
  outline: 'none',
  width: '100%',
  transition: 'border-color 150ms',
}

function Feedback({ type, message }: { type: 'success' | 'error'; message: string }) {
  const ok = type === 'success'
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '12px 16px', borderRadius: 8, marginBottom: 20,
      background: ok ? 'rgba(76,184,122,0.08)' : 'rgba(239,68,68,0.08)',
      border: `1px solid ${ok ? 'rgba(76,184,122,0.25)' : 'rgba(239,68,68,0.25)'}`,
    }}>
      {ok ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4cb87a" strokeWidth="2.5" strokeLinecap="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      )}
      <span style={{ fontSize: 13, fontWeight: 500, color: ok ? '#4cb87a' : '#ef4444' }}>{message}</span>
    </div>
  )
}

function SkeletonForm() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: '14px 0', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ height: 12, width: `${60 + i * 10}px`, background: 'var(--border)', borderRadius: 4 }} />
            <div style={{ height: 9, width: '80px', background: 'var(--border)', borderRadius: 4 }} />
          </div>
          <div style={{ height: 34, background: 'var(--border)', borderRadius: 6 }} />
        </div>
      ))}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────

export default function AiConfigPage() {
  const router = useRouter()
  const { token, isLoading: authLoading } = useAppStore()
  const { data, isLoading, isError } = useAiConfig()
  const { mutate, isPending, isSuccess, isError: isMutateError, error, reset } = useUpdateAiConfig()

  const [local, setLocal] = useState<AiConfig | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { if (authLoading) return; if (!token) router.push('/login') }, [token, authLoading, router])

  useEffect(() => {
    if (data && !local) setLocal(data.params)
  }, [data, local])

  useEffect(() => {
    if (isSuccess || isMutateError) {
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current)
      feedbackTimer.current = setTimeout(() => reset(), 3000)
    }
    return () => { if (feedbackTimer.current) clearTimeout(feedbackTimer.current) }
  }, [isSuccess, isMutateError, reset])

  if (authLoading || !token) return null

  function set<K extends keyof AiConfig>(key: K, value: AiConfig[K]) {
    setLocal(prev => prev ? { ...prev, [key]: value } : prev)
    setIsDirty(true)
  }

  function handleSave() {
    if (!local) return
    mutate(local, { onSuccess: () => setIsDirty(false) })
  }

  function handleReset() {
    if (data) { setLocal(data.params); setIsDirty(false) }
  }

  const params = local ?? DEFAULTS

  return (
    <main style={{ background: 'var(--bg)', color: 'var(--text)', minHeight: '100vh' }}>

      {/* Dot grid */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: 'radial-gradient(circle, rgba(128,128,128,0.06) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 680, margin: '0 auto', padding: '40px 24px' }}>

        {/* Back */}
        <button
          onClick={() => router.back()}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13, padding: 0, marginBottom: 28 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M5 12l7 7M5 12l7-7" />
          </svg>
          Back
        </button>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 11, color: 'var(--text-faint)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>
            Claude AI
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <h1 style={{ fontSize: 'clamp(20px, 4vw, 28px)', fontWeight: 700, letterSpacing: '-0.03em' }}>AI Strategy Config</h1>
            {data?.updatedAt && (
              <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>
                Updated {new Date(data.updatedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>

        {isSuccess && <Feedback type="success" message="AI config saved — bot will use new strategy on next analysis" />}
        {isMutateError && <Feedback type="error" message={error?.message ?? 'Save failed'} />}
        {isError && (
          <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '14px 18px', marginBottom: 20 }}>
            <span style={{ fontSize: 14, color: '#ef4444' }}>Failed to load AI config</span>
          </div>
        )}

        {isLoading || !local ? (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '8px 24px 24px' }}>
            <SkeletonForm />
          </div>
        ) : (
          <>
            {/* Section: General */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '8px 24px 4px', marginBottom: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '14px 0 4px' }}>
                General
              </p>

              <Row label="Enable AI Analysis" hint="ให้ Claude วิเคราะห์ H1+H4 ก่อนเปิด position">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Toggle value={params.aiEnabled} onChange={v => set('aiEnabled', v)} />
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{params.aiEnabled ? 'Enabled' : 'Disabled'}</span>
                </div>
              </Row>

              <Row label="Symbol" hint="สกุลเงินที่ AI จะวิเคราะห์">
                <select
                  value={params.symbol}
                  onChange={e => set('symbol', e.target.value)}
                  style={{ ...inputBase, cursor: 'pointer' }}
                  onFocus={e => (e.target.style.borderColor = 'var(--accent-line)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                >
                  {SYMBOLS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Row>
            </div>

            {/* Section: Signal Filter */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '8px 24px 4px', marginBottom: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '14px 0 4px' }}>
                Signal Filter
              </p>

              <Row label="Min Confidence" hint="AI ต้องมั่นใจ % ขึ้นไปจึงส่ง signal">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="range" min={50} max={95} step={5}
                    value={params.confidenceMin}
                    onChange={e => set('confidenceMin', Number(e.target.value))}
                    style={{ flex: 1, accentColor: 'var(--accent)' }}
                  />
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)', minWidth: 36, textAlign: 'right' }}>
                    {params.confidenceMin}%
                  </span>
                </div>
              </Row>

              <Row label="Min Risk:Reward" hint="ต่ำกว่านี้ AI จะแนะนำ HOLD">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="range" min={1.0} max={3.0} step={0.1}
                    value={params.rrMin}
                    onChange={e => set('rrMin', Number(e.target.value))}
                    style={{ flex: 1, accentColor: 'var(--accent)' }}
                  />
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)', minWidth: 36, textAlign: 'right' }}>
                    1:{params.rrMin.toFixed(1)}
                  </span>
                </div>
              </Row>

              <Row label="Max Signal Age" hint="signal เก่าเกินนี้จะถูก ignore (นาที)">
                <input
                  type="number" min={5} max={240} step={5}
                  value={params.maxSignalAgeMin}
                  onChange={e => set('maxSignalAgeMin', Number(e.target.value))}
                  style={inputBase}
                  onFocus={e => (e.target.style.borderColor = 'var(--accent-line)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                />
              </Row>
            </div>

            {/* Section: Timeframes */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '8px 24px 4px', marginBottom: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '14px 0 4px' }}>
                Timeframes
              </p>

              <Row label="Analyze H1" hint="วิเคราะห์ทุกครั้งที่ H1 candle ปิด">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Toggle value={params.analyzeH1} onChange={v => set('analyzeH1', v)} />
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{params.analyzeH1 ? 'On' : 'Off'}</span>
                </div>
              </Row>

              <Row label="Analyze H4" hint="วิเคราะห์ทุกครั้งที่ H4 candle ปิด">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Toggle value={params.analyzeH4} onChange={v => set('analyzeH4', v)} />
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{params.analyzeH4 ? 'On' : 'Off'}</span>
                </div>
              </Row>
            </div>

            {/* Section: Execution */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '8px 24px 4px', marginBottom: 24 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '14px 0 4px' }}>
                Execution
              </p>

              <Row label="Dynamic SL/TP" hint="AI กำหนด SL/TP แทนค่าใน Settings">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Toggle value={params.useDynamicSL} onChange={v => set('useDynamicSL', v)} />
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {params.useDynamicSL ? 'AI decides' : 'Use fixed settings'}
                  </span>
                </div>
              </Row>
            </div>

            {/* Info box */}
            <div style={{
              background: 'var(--accent-dim)', border: '1px solid var(--accent-line)',
              borderRadius: 10, padding: '14px 18px', marginBottom: 24,
              display: 'flex', gap: 12, alignItems: 'flex-start',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="8"/><line x1="12" y1="12" x2="12" y2="16"/>
              </svg>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                การตั้งค่านี้จะถูก EA อ่านผ่าน <code style={{ fontSize: 11, background: 'var(--surface-2)', padding: '1px 5px', borderRadius: 4 }}>GET /api/ai-config/active</code> ทุก 5 นาที
                — AI จะเช็ค H1/H4 และส่ง signal กลับมาให้ bot ตัดสินใจเปิด position
              </p>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              {isDirty && (
                <button
                  onClick={handleReset}
                  style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', background: 'none', border: '1px solid var(--border)', borderRadius: 7, padding: '9px 18px', cursor: 'pointer' }}
                >
                  Discard
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={isPending || !isDirty}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  fontSize: 13, fontWeight: 600,
                  background: isPending || !isDirty ? 'var(--surface-2)' : 'var(--accent)',
                  color: isPending || !isDirty ? 'var(--text-faint)' : '#000',
                  border: 'none', borderRadius: 7, padding: '9px 22px',
                  cursor: isPending || !isDirty ? 'not-allowed' : 'pointer',
                  transition: 'all 150ms ease',
                }}
              >
                {isPending ? 'Saving…' : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Save Config
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
