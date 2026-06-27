'use client'
import { useEffect, useState } from 'react'

type Props = {
  label: string
  value: number
  max: number
  display: string
  color: string
  delay?: number
  triggered: boolean
}

export function AnimatedBar({ label, value, max, display, color, delay = 0, triggered }: Props) {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    if (triggered) {
      const t = setTimeout(() => setWidth((value / max) * 100), delay)
      return () => clearTimeout(t)
    } else {
      setWidth(0)
    }
  }, [triggered, value, max, delay])

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color, minWidth: 48, textAlign: 'right' }}>{display}</span>
      </div>
      <div style={{ height: 6, background: 'var(--surface-2)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${width}%`,
          background: color,
          borderRadius: 3,
          opacity: color === '#22c55e' ? 1 : 0.7,
          transition: triggered ? `width 1s cubic-bezier(0.16,1,0.3,1)` : 'width 0.3s ease',
        }} />
      </div>
    </div>
  )
}
