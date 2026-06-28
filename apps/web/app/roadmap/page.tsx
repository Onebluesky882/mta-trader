'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import { BackButton } from '@/components/back-button'
import { RoadmapClient } from './roadmap-client'
import {
  ROADMAP_VISION,
  ROADMAP_PROGRESS,
  ROADMAP_NEXT_STEPS,
  ROADMAP_MILESTONES,
} from '@/lib/roadmap-data'

const OWNER_EMAIL = process.env.NEXT_PUBLIC_OWNER_EMAIL ?? 'wansing882@gmail.com'

export default function RoadmapPage() {
  const router = useRouter()
  const { user, token, isLoading } = useAuthStore()
  const [checked, setChecked] = useState(false)
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    if (isLoading) return
    if (!token || !user) {
      router.push('/login')
      return
    }
    if (user.email !== OWNER_EMAIL) {
      router.push('/')
      return
    }
    setAllowed(true)
    setChecked(true)
  }, [user, token, isLoading, router])

  if (isLoading || !checked || !allowed) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-faint)', fontSize: 14 }}>
        Loading...
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px 0' }}>
        <BackButton href="/" />
      </div>
      <div style={{ borderBottom: '1px solid var(--border)', padding: '0 24px 20px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.04em' }}>Project Roadmap</h1>
        </div>
      </div>
      <RoadmapClient data={{
        vision: ROADMAP_VISION,
        currentProgress: ROADMAP_PROGRESS,
        nextSteps: ROADMAP_NEXT_STEPS,
        milestones: ROADMAP_MILESTONES,
      }} />
    </div>
  )
}
