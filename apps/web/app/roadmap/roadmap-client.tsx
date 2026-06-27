'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'

type TaskStatus = 'done' | 'in-progress' | 'planned'

type Milestone = {
  id: string
  name: string
  goal: string
  status: string
}

type RoadmapData = {
  vision: string
  currentProgress: string
  nextSteps: string
  milestones: Milestone[]
}

const STATUS_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  COMPLETE:    { color: '#2d8a5e', bg: 'rgba(91,186,138,0.12)', border: 'rgba(91,186,138,0.25)' },
  IN_PROGRESS: { color: '#c94e66', bg: 'rgba(232,100,122,0.10)', border: 'rgba(232,100,122,0.2)' },
  APPROVED:    { color: '#5b7fd4', bg: 'rgba(91,127,212,0.10)', border: 'rgba(91,127,212,0.2)' },
  PLANNING:    { color: 'var(--text-faint)', bg: 'var(--cream)', border: 'var(--border)' },
  CANCELLED:   { color: '#b0a09a', bg: 'var(--surface-2)', border: 'var(--border)' },
}

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold })
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, visible }
}

function FadeSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, visible } = useInView()
  return (
    <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transition: `opacity 0.55s ${delay}s ease, transform 0.55s ${delay}s ease` }}>
      {children}
    </div>
  )
}

export function RoadmapClient({ data }: { data: RoadmapData }) {
  const router = useRouter()
  const { user, isLoading } = useAuthStore()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (isLoading) return
    if (!user) {
      router.push('/login')
      return
    }
    setChecked(true)
  }, [user, isLoading, router])

  const allMilestones = data.milestones
  const done = allMilestones.filter(m => m.status === 'COMPLETE').length
  const total = allMilestones.length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  if (isLoading || !checked) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'var(--text-faint)', fontSize: 14 }}>
        Loading...
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px 80px' }}>

      {/* Progress bar */}
      <FadeSection>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '24px 28px', marginBottom: 28, boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)' }}>Overall Progress</span>
            <span style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', color: pct === 100 ? 'var(--green)' : 'var(--accent)' }}>{pct}%</span>
          </div>
          <div style={{ height: 10, background: 'var(--surface-2)', borderRadius: 100, overflow: 'hidden', border: '1px solid var(--border)' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, var(--accent), var(--pink))', borderRadius: 100, transition: 'width 1s ease' }} />
          </div>
          <div style={{ marginTop: 10, fontSize: 13, color: 'var(--text-faint)' }}>
            {done} of {total} milestones completed
          </div>
        </div>
      </FadeSection>

      {/* Vision */}
      {data.vision && data.vision !== '[TBD]' && (
        <FadeSection delay={0.05}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '24px 28px', marginBottom: 20, boxShadow: 'var(--shadow-sm)' }}>
            <p style={{ fontSize: 11, color: 'var(--accent)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 10 }}>✨ Vision</p>
            <p style={{ fontSize: 15, lineHeight: 1.75, color: 'var(--text-muted)', margin: 0 }}>{data.vision}</p>
          </div>
        </FadeSection>
      )}

      {/* Current Progress */}
      {data.currentProgress && data.currentProgress !== '[TBD]' && (
        <FadeSection delay={0.1}>
          <div style={{ background: 'var(--green-dim)', border: '1px solid rgba(91,186,138,0.2)', borderRadius: 16, padding: '24px 28px', marginBottom: 20 }}>
            <p style={{ fontSize: 11, color: '#2d8a5e', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 10 }}>Current Progress</p>
            <p style={{ fontSize: 14, lineHeight: 1.75, color: 'var(--text-muted)', margin: 0, whiteSpace: 'pre-line' }}>{data.currentProgress}</p>
          </div>
        </FadeSection>
      )}

      {/* Milestones */}
      {allMilestones.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <FadeSection delay={0.12}>
            <p style={{ fontSize: 11, color: 'var(--text-faint)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 14 }}>Milestones</p>
          </FadeSection>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {allMilestones.map((m, i) => {
              const style = STATUS_STYLE[m.status] ?? STATUS_STYLE['PLANNING']
              return (
                <FadeSection key={m.id} delay={0.1 + i * 0.05}>
                  <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: 'var(--shadow-sm)', transition: 'box-shadow 200ms' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-faint)', minWidth: 52, fontFamily: 'monospace' }}>{m.id}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: m.goal && m.goal !== 'TBD' ? 3 : 0 }}>{m.name}</div>
                      {m.goal && m.goal !== 'TBD' && (
                        <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>{m.goal}</div>
                      )}
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: style.color, background: style.bg, border: `1px solid ${style.border}`, padding: '4px 12px', borderRadius: 100, whiteSpace: 'nowrap' }}>
                      {m.status}
                    </span>
                  </div>
                </FadeSection>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {allMilestones.length === 0 && !data.vision && !data.currentProgress && (
        <FadeSection>
          <div style={{ textAlign: 'center', padding: '64px 24px', color: 'var(--text-faint)', fontSize: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--surface-2)', border: '1px solid var(--border)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-faint)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 0 1 10 10"/><path d="M12 2v10l4 4"/></svg>
            </div>
            <p>No roadmap yet — the project owner will add milestones soon.</p>
          </div>
        </FadeSection>
      )}

      {/* Next Steps */}
      {data.nextSteps && data.nextSteps !== '[TBD]' && (
        <FadeSection delay={0.15}>
          <div style={{ background: 'var(--pink-dim)', border: '1px solid rgba(232,100,122,0.15)', borderRadius: 16, padding: '24px 28px', marginTop: 8 }}>
            <p style={{ fontSize: 11, color: 'var(--accent)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 10 }}>Next Steps</p>
            <p style={{ fontSize: 14, lineHeight: 1.75, color: 'var(--text-muted)', margin: 0, whiteSpace: 'pre-line' }}>{data.nextSteps}</p>
          </div>
        </FadeSection>
      )}

      <FadeSection delay={0.2}>
        <p style={{ marginTop: 40, fontSize: 13, color: 'var(--text-faint)', textAlign: 'center', lineHeight: 1.7 }}>
          This roadmap is managed by the project owner.<br />Questions? Reach out via the Forum.
        </p>
      </FadeSection>
    </div>
  )
}
