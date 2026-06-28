'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

// ── Mock data ─────────────────────────────────────────────────
const MOCK_SIGNAL = {
  signal: 'BUY' as 'BUY' | 'SELL' | 'HOLD',
  confidence: 78,
  symbol: 'XAUUSD',
  price: 3315.20,
  analyzedAt: '2026-06-28 14:00',
  reason: 'H4 uptrend ยังแข็งแกร่ง — price ทะลุ EMA 50 ขึ้นมาพร้อม volume H4 สูงกว่าค่าเฉลี่ย 1.4x ส่วน H1 RSI pullback กลับจาก oversold (38→52) ยืนยัน momentum กลับมา',
  sl: 3298.00,
  tp: 3345.00,
  h4: {
    trend: 'UPTREND',
    rsi: 62.1,
    macd: 'Bullish cross',
    ema: 'Price above EMA 50 & 200',
  },
  h1: {
    trend: 'PULLBACK RECOVERY',
    rsi: 52.3,
    macd: 'Histogram turning positive',
    ema: 'Bounced off EMA 21',
  },
}

const MOCK_HISTORY = [
  { id: 1, signal: 'BUY', symbol: 'XAUUSD', confidence: 78, time: '14:00', result: 'TP HIT', profit: '+18.40' },
  { id: 2, signal: 'HOLD', symbol: 'XAUUSD', confidence: 52, time: '10:00', result: 'SKIPPED', profit: '—' },
  { id: 3, signal: 'SELL', symbol: 'XAUUSD', confidence: 71, time: '06:00', result: 'SL HIT', profit: '-9.20' },
  { id: 4, signal: 'BUY', symbol: 'XAUUSD', confidence: 85, time: '02:00', result: 'TP HIT', profit: '+22.10' },
]

// ── Sub-components ────────────────────────────────────────────

function SignalBadge({ signal }: { signal: 'BUY' | 'SELL' | 'HOLD' }) {
  const cfg = {
    BUY:  { color: '#4cb87a', bg: 'rgba(76,184,122,0.12)', border: 'rgba(76,184,122,0.25)', label: 'BUY' },
    SELL: { color: '#e86090', bg: 'rgba(232,96,144,0.12)', border: 'rgba(232,96,144,0.25)', label: 'SELL' },
    HOLD: { color: '#888',    bg: 'rgba(136,136,136,0.1)', border: 'rgba(136,136,136,0.2)', label: 'HOLD' },
  }[signal]

  return (
    <span style={{
      fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
      color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`,
      borderRadius: 100, padding: '3px 10px',
    }}>
      {cfg.label}
    </span>
  )
}

function ResultBadge({ result, profit }: { result: string; profit: string }) {
  const isWin = result === 'TP HIT'
  const isLoss = result === 'SL HIT'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{
        fontSize: 10, fontWeight: 600,
        color: isWin ? '#4cb87a' : isLoss ? '#e86090' : '#888',
      }}>
        {result}
      </span>
      <span style={{
        fontSize: 12, fontWeight: 700,
        color: isWin ? '#4cb87a' : isLoss ? '#e86090' : '#888',
      }}>
        {profit}
      </span>
    </div>
  )
}

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 70 ? '#4cb87a' : value >= 50 ? '#f5a623' : '#e86090'
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>AI Confidence</span>
        <span style={{ fontSize: 13, fontWeight: 700, color }}>{value}%</span>
      </div>
      <div style={{ height: 4, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${value}%`, background: color,
          borderRadius: 4, transition: 'width 600ms ease',
        }} />
      </div>
    </div>
  )
}

function TFCard({ label, data }: { label: string; data: typeof MOCK_SIGNAL.h4 }) {
  const isBull = data.trend.includes('UP') || data.trend.includes('RECOVERY')
  return (
    <div style={{
      flex: 1, background: 'var(--surface-2)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}</span>
        <span style={{
          fontSize: 10, fontWeight: 600, color: isBull ? '#4cb87a' : '#e86090',
          background: isBull ? 'rgba(76,184,122,0.1)' : 'rgba(232,96,144,0.1)',
          border: `1px solid ${isBull ? 'rgba(76,184,122,0.2)' : 'rgba(232,96,144,0.2)'}`,
          borderRadius: 100, padding: '2px 8px',
        }}>
          {data.trend}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Row label="RSI" value={String(data.rsi)} highlight={data.rsi > 50} />
        <Row label="MACD" value={data.macd} highlight={data.macd.includes('Bullish') || data.macd.includes('positive')} />
        <Row label="EMA" value={data.ema} />
      </div>
    </div>
  )
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
      <span style={{ fontSize: 11, color: 'var(--text-faint)', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 12, color: highlight ? '#4cb87a' : 'var(--text-muted)', textAlign: 'right', lineHeight: 1.4 }}>
        {value}
      </span>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────

export default function AiSignalPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const s = MOCK_SIGNAL

  const signalColor = s.signal === 'BUY' ? '#4cb87a' : s.signal === 'SELL' ? '#e86090' : '#888'
  const riskReward = ((s.tp - s.price) / (s.price - s.sl)).toFixed(1)

  function handleAnalyze() {
    setLoading(true)
    setTimeout(() => setLoading(false), 1800)
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)' }}>

      {/* Dot grid bg */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: 'radial-gradient(circle, rgba(128,128,128,0.06) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 680, margin: '0 auto', padding: '24px 20px 64px' }}>

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
          <p style={{ fontSize: 11, color: 'var(--text-faint)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
            AI Analysis · H1 + H4
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em' }}>Market Signal</h1>
            <button
              onClick={handleAnalyze}
              disabled={loading}
              style={{
                background: loading ? 'var(--surface-2)' : 'var(--text)',
                color: loading ? 'var(--text-muted)' : 'var(--bg)',
                border: 'none', borderRadius: 8, padding: '9px 18px',
                fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 150ms ease',
              }}
            >
              {loading ? 'Analyzing…' : 'Run Analysis'}
            </button>
          </div>
        </div>

        {/* Signal card */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 14, padding: '24px', marginBottom: 16, position: 'relative', overflow: 'hidden',
        }}>
          {/* glow */}
          <div style={{
            position: 'absolute', top: -60, right: -60, width: 240, height: 240,
            background: `radial-gradient(ellipse, ${signalColor}18 0%, transparent 70%)`,
            pointerEvents: 'none',
          }} />

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>{s.symbol}</span>
                <SignalBadge signal={s.signal} />
              </div>
              <span style={{ fontSize: 13, color: 'var(--text-faint)' }}>@ {s.price.toFixed(2)} · {s.analyzedAt}</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 36, fontWeight: 900, color: signalColor, letterSpacing: '-0.04em', lineHeight: 1 }}>
                {s.signal}
              </div>
            </div>
          </div>

          <ConfidenceBar value={s.confidence} />

          {/* SL / TP / RR */}
          <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
            {[
              { label: 'Stop Loss', value: s.sl.toFixed(2), color: '#e86090' },
              { label: 'Take Profit', value: s.tp.toFixed(2), color: '#4cb87a' },
              { label: 'Risk:Reward', value: `1 : ${riskReward}`, color: 'var(--text-muted)' },
            ].map(item => (
              <div key={item.label} style={{
                flex: 1, minWidth: 100, background: 'var(--surface-2)',
                border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px',
              }}>
                <p style={{ fontSize: 10, color: 'var(--text-faint)', marginBottom: 4 }}>{item.label}</p>
                <p style={{ fontSize: 15, fontWeight: 700, color: item.color }}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* AI Reason */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 12, padding: '18px 20px', marginBottom: 16,
        }}>
          <p style={{ fontSize: 10, color: 'var(--text-faint)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
            AI Reasoning
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
            {s.reason}
          </p>
        </div>

        {/* H4 + H1 breakdown */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <TFCard label="H4 — Trend" data={s.h4} />
          <TFCard label="H1 — Entry" data={s.h1} />
        </div>

        {/* Signal history */}
        <div>
          <p style={{ fontSize: 11, color: 'var(--text-faint)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>
            Recent Signals
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {MOCK_HISTORY.map((h, i) => (
              <div key={h.id} style={{
                background: 'var(--surface)', borderRadius: i === 0 ? '10px 10px 0 0' : i === MOCK_HISTORY.length - 1 ? '0 0 10px 10px' : 0,
                border: '1px solid var(--border)', marginBottom: i === MOCK_HISTORY.length - 1 ? 0 : -1,
                padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <SignalBadge signal={h.signal as 'BUY' | 'SELL' | 'HOLD'} />
                <span style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>{h.symbol}</span>
                <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>{h.time}</span>
                <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>{h.confidence}%</span>
                <ResultBadge result={h.result} profit={h.profit} />
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
