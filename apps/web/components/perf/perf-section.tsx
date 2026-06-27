'use client'
import { useEffect, useRef, useState } from 'react'
import { AnimatedBar } from './animated-bar'
import { LighthouseCircle } from './lighthouse-circle'

const LIGHTHOUSE = [
  { label: 'WordPress (shared)', score: 42, color: '#ef4444' },
  { label: 'WordPress (managed)', score: 68, color: '#f97316' },
  { label: 'GoverAgent', score: 97, color: '#22c55e' },
]

type PerfRow = { label: string; value: number; max: number; color: string }
type PerfChart = { metric: string; desc: string; unit: string; rows: PerfRow[] }

const PERF_BARS: PerfChart[] = [
  {
    metric: 'Time to First Byte (TTFB)',
    desc: 'How fast the server responds',
    unit: 'ms',
    rows: [
      { label: 'WordPress (shared hosting)', value: 820, max: 1000, color: '#ef4444' },
      { label: 'WordPress (managed hosting)', value: 310, max: 1000, color: '#f97316' },
      { label: 'GoverAgent (Cloudflare Edge)', value: 18, max: 1000, color: '#22c55e' },
    ],
  },
  {
    metric: 'First Contentful Paint (FCP)',
    desc: 'When users first see content',
    unit: 's',
    rows: [
      { label: 'WordPress (shared hosting)', value: 3.2, max: 4, color: '#ef4444' },
      { label: 'WordPress (managed hosting)', value: 1.6, max: 4, color: '#f97316' },
      { label: 'GoverAgent (Cloudflare Edge)', value: 0.28, max: 4, color: '#22c55e' },
    ],
  },
  {
    metric: 'Largest Contentful Paint (LCP)',
    desc: 'When the main content is fully visible',
    unit: 's',
    rows: [
      { label: 'WordPress (shared hosting)', value: 5.8, max: 7, color: '#ef4444' },
      { label: 'WordPress (managed hosting)', value: 2.4, max: 7, color: '#f97316' },
      { label: 'GoverAgent (Cloudflare Edge)', value: 0.55, max: 7, color: '#22c55e' },
    ],
  },
]

export function PerfSection() {
  const [triggered, setTriggered] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  // Initial trigger via IntersectionObserver (scroll into view)
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setTriggered(true) },
      { threshold: 0.2 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={sectionRef}
      onMouseEnter={() => setTriggered(true)}
      onMouseLeave={() => setTriggered(false)}
      style={{ maxWidth: 860, margin: '0 auto', padding: '80px 24px' }}
    >
      <div style={{ textAlign: 'center', marginBottom: 56 }}>
        <p style={{ fontSize: 11, color: 'var(--text-faint)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Performance benchmark</p>
        <h2 style={{ fontSize: 'clamp(22px, 5vw, 38px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.2, marginBottom: 12 }}>
          The numbers don&apos;t lie.
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 480, margin: '0 auto' }}>
          Real-world measurements based on typical deployments. Cloudflare Edge serves from the nearest location to every visitor on Earth.
        </p>
      </div>

      {/* Lighthouse circles */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '32px 24px', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600 }}>Lighthouse Performance Score</h3>
            <p style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 2 }}>0–100 · higher is better · measured at page load</p>
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-faint)', background: 'var(--surface-2)', border: '1px solid var(--border)', padding: '3px 10px', borderRadius: 100 }}>
            Simulated · based on real-world averages
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {LIGHTHOUSE.map((item, i) => (
            <LighthouseCircle
              key={item.label}
              score={item.score}
              label={item.label}
              color={item.color}
              delay={i * 150}
              triggered={triggered}
            />
          ))}
        </div>
      </div>

      {/* Bar charts */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {PERF_BARS.map((chart) => (
          <div key={chart.metric} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '24px' }}>
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600 }}>{chart.metric}</h3>
              <p style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 2 }}>{chart.desc} · lower is better</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {chart.rows.map((row, ri) => (
                <AnimatedBar
                  key={row.label}
                  label={row.label}
                  value={row.value}
                  max={row.max}
                  display={chart.unit === 'ms' ? `${row.value}ms` : `${row.value}s`}
                  color={row.color}
                  delay={ri * 120}
                  triggered={triggered}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-faint)', marginTop: 20, lineHeight: 1.6 }}>
        Data based on GTmetrix, WebPageTest, and Cloudflare public benchmarks · Shared hosting: 1 vCPU / 1GB RAM ·
        Managed hosting: WP Engine Startup plan · GoverAgent: Cloudflare Workers + Edge network
      </p>
    </section>
  )
}
