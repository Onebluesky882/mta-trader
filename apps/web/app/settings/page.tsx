'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store/useAppStore'
import { useSettings, useUpdateSettings } from '@/hooks/useSettings'
import { BackButton } from '@/components/back-button'

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

type ParamValue = number | string | boolean

// ── Field definitions — group + control type ──────────────────

type FieldDef = {
  key: string
  label: string
  group: string
  type: 'number' | 'select' | 'text' | 'boolean'
  options?: string[]
  step?: number
  hint?: string
}

const FIELD_DEFS: FieldDef[] = [
  // Trading
  { key: 'symbol',      label: 'Symbol',        group: 'Trading',    type: 'select',  options: ['EURUSD','GBPUSD','USDJPY','XAUUSD','AUDUSD','USDCAD'] },
  { key: 'direction',   label: 'Direction',      group: 'Trading',    type: 'select',  options: ['BUY','SELL','BOTH'] },
  { key: 'maxTrades',   label: 'Max Trades',     group: 'Trading',    type: 'number',  step: 1,     hint: 'จำนวน position ที่เปิดพร้อมกันสูงสุด' },
  { key: 'lotSize',     label: 'Lot Size',       group: 'Trading',    type: 'number',  step: 0.01,  hint: 'ขนาด lot ต่อ position' },
  { key: 'stopLoss',    label: 'Stop Loss (pips)',   group: 'Trading',type: 'number',  step: 1,     hint: 'ระยะ Stop Loss เป็น pips' },
  { key: 'takeProfit',  label: 'Take Profit (pips)', group: 'Trading',type: 'number',  step: 1,     hint: 'ระยะ Take Profit เป็น pips' },
  // Algorithm
  { key: 'rsiPeriod',   label: 'RSI Period',     group: 'Algorithm',  type: 'number',  step: 1 },
  { key: 'macdFast',    label: 'MACD Fast',      group: 'Algorithm',  type: 'number',  step: 1 },
  { key: 'macdSlow',    label: 'MACD Slow',      group: 'Algorithm',  type: 'number',  step: 1 },
  { key: 'macdSignal',  label: 'MACD Signal',    group: 'Algorithm',  type: 'number',  step: 1 },
]

const GROUPS = ['Trading', 'Algorithm']

// ── ParamField ────────────────────────────────────────────────

function ParamField({ def, value, onChange }: {
  def: FieldDef
  value: ParamValue
  onChange: (v: ParamValue) => void
}) {
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

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      alignItems: 'center',
      gap: 16,
      padding: '14px 0',
      borderBottom: '1px solid var(--border-subtle)',
    }}>
      <div>
        <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 2 }}>{def.label}</p>
        {def.hint && <p style={{ fontSize: 11, color: 'var(--text-faint)' }}>{def.hint}</p>}
        {!def.hint && <p style={{ fontSize: 11, color: 'var(--text-faint)', fontFamily: 'monospace' }}>{def.key}</p>}
      </div>

      {def.type === 'select' ? (
        <select
          value={value as string}
          onChange={e => onChange(e.target.value)}
          style={{ ...inputBase, cursor: 'pointer' }}
          onFocus={e => (e.target.style.borderColor = 'var(--accent-line)')}
          onBlur={e => (e.target.style.borderColor = 'var(--border)')}
        >
          {def.options!.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      ) : def.type === 'number' ? (
        <input
          type="number"
          value={value as number}
          step={def.step ?? 1}
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          style={inputBase}
          onFocus={e => (e.target.style.borderColor = 'var(--accent-line)')}
          onBlur={e => (e.target.style.borderColor = 'var(--border)')}
        />
      ) : def.type === 'boolean' ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            role="switch"
            aria-checked={value as boolean}
            onClick={() => onChange(!(value as boolean))}
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
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{value ? 'Enabled' : 'Disabled'}</span>
        </div>
      ) : (
        <input
          type="text"
          value={value as string}
          onChange={e => onChange(e.target.value)}
          style={inputBase}
          onFocus={e => (e.target.style.borderColor = 'var(--accent-line)')}
          onBlur={e => (e.target.style.borderColor = 'var(--border)')}
        />
      )}
    </div>
  )
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

// ── Skeleton ─────────────────────────────────────────────────

function SkeletonForm() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: '14px 0', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ height: 12, width: `${60 + i * 8}px`, background: 'var(--border)', borderRadius: 4 }} />
            <div style={{ height: 9, width: '80px', background: 'var(--border)', borderRadius: 4 }} />
          </div>
          <div style={{ height: 34, background: 'var(--border)', borderRadius: 6 }} />
        </div>
      ))}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────

export default function SettingsPage() {
  const router = useRouter()
  const { token, isLoading: authLoading } = useAppStore()
  const { data, isLoading, isError } = useSettings()
  const { mutate, isPending, isSuccess, isError: isMutateError, error, reset } = useUpdateSettings()

  const [localParams, setLocalParams] = useState<Record<string, ParamValue> | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { if (authLoading) return; if (!token) router.push('/login') }, [token, authLoading, router])

  useEffect(() => {
    if (data && !localParams) setLocalParams(data.params)
  }, [data, localParams])

  useEffect(() => {
    if (isSuccess || isMutateError) {
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current)
      feedbackTimer.current = setTimeout(() => reset(), 3000)
    }
    return () => { if (feedbackTimer.current) clearTimeout(feedbackTimer.current) }
  }, [isSuccess, isMutateError, reset])

  if (authLoading || !token) return null

  function handleChange(key: string, value: ParamValue) {
    setLocalParams(prev => prev ? { ...prev, [key]: value } : prev)
    setIsDirty(true)
  }

  function handleSave() {
    if (!localParams) return
    mutate(localParams, { onSuccess: () => setIsDirty(false) })
  }

  function handleReset() {
    if (data) { setLocalParams(data.params); setIsDirty(false) }
  }

  return (
    <main style={{ flex: 1, background: 'var(--bg)', color: 'var(--text)', minHeight: 'calc(100vh - 56px)' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 24px' }}>
        <BackButton />

        {/* Header */}
        <div className="anim-fade-up" style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 11, color: 'var(--text-faint)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>
            Algorithm
          </p>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 'clamp(20px, 4vw, 28px)', fontWeight: 700, letterSpacing: '-0.03em' }}>Settings</h1>
            {data && (
              <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-faint)' }}>
                <span>v{data.version}</span>
                <span>Updated {fmtDate(data.updatedAt)}</span>
              </div>
            )}
          </div>
        </div>

        {isSuccess && <Feedback type="success" message="Settings saved successfully" />}
        {isMutateError && <Feedback type="error" message={error?.message ?? 'Save failed'} />}
        {isError && (
          <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '14px 18px', marginBottom: 20 }}>
            <span style={{ fontSize: 14, color: '#ef4444' }}>Failed to load settings</span>
          </div>
        )}

        {/* Form */}
        {isLoading || !localParams ? (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '8px 24px 24px' }}>
            <SkeletonForm />
          </div>
        ) : (
          <>
            {GROUPS.map(group => {
              const fields = FIELD_DEFS.filter(f => f.group === group && f.key in localParams)
              if (fields.length === 0) return null
              return (
                <div key={group} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '8px 24px 4px', marginBottom: 16 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '14px 0 4px' }}>
                    {group}
                  </p>
                  {fields.map(def => (
                    <ParamField
                      key={def.key}
                      def={def}
                      value={localParams[def.key]}
                      onChange={v => handleChange(def.key, v)}
                    />
                  ))}
                </div>
              )
            })}

            {/* Unknown params (not in FIELD_DEFS) */}
            {(() => {
              const known = new Set(FIELD_DEFS.map(f => f.key))
              const extra = Object.entries(localParams).filter(([k]) => !known.has(k))
              if (extra.length === 0) return null
              return (
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '8px 24px 4px', marginBottom: 16 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '14px 0 4px' }}>Other</p>
                  {extra.map(([key, val]) => (
                    <ParamField
                      key={key}
                      def={{ key, label: key, group: 'Other', type: typeof val === 'boolean' ? 'boolean' : typeof val === 'number' ? 'number' : 'text' }}
                      value={val}
                      onChange={v => handleChange(key, v)}
                    />
                  ))}
                </div>
              )
            })()}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
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
                  color: isPending || !isDirty ? 'var(--text-faint)' : '#fff',
                  border: 'none', borderRadius: 7, padding: '9px 22px',
                  cursor: isPending || !isDirty ? 'not-allowed' : 'pointer',
                }}
              >
                {isPending ? 'Saving…' : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                    Save
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
