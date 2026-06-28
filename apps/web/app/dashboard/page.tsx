'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import { useAuth } from '@/hooks/use-auth'
import { Navbar } from '@/components/navbar'
import { BackButton } from '@/components/back-button'

const API = process.env.NEXT_PUBLIC_API_URL ?? ''

type Post = {
  id: string; title: string; postNumber: number
  status: 'open' | 'closed'; createdAt: string
  category: string; user: { id: string; name: string }
}

const QUICK_LINKS = [
  { label: 'Forum', desc: 'Ask questions & get help', href: '/forum' },
  { label: 'Roadmap', desc: 'Track project milestones', href: '/roadmap' },
]

function isToday(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
}

export default function DashboardPage() {
  const { user, isLoading } = useAuthStore()
  const { signOut } = useAuth()
  const router = useRouter()
  const [myPosts, setMyPosts] = useState<Post[]>([])

  useEffect(() => {
    if (!isLoading && !user) router.push('/login')
  }, [user, isLoading, router])

  useEffect(() => {
    if (!user) return
    fetch(`${API}/api/forum`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then((posts: Post[]) => setMyPosts(posts))
      .catch(() => {})
  }, [user])

  if (isLoading || !user) {
    return <div style={{ background: 'var(--bg)', minHeight: '100vh' }} />
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)' }}>
      <Navbar />

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 24px 0' }}><BackButton href="/" /></div>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 24px' }}>

        {/* Welcome */}
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 8 }}>Welcome back</p>
          <h1 style={{ fontSize: 'clamp(24px, 5vw, 36px)', fontWeight: 800, letterSpacing: '-0.03em' }}>
            {user.name}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>{user.email}</p>
        </div>

        {/* Template access */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '24px', marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: 200, height: 200, background: 'radial-gradient(ellipse at top right, rgba(124,58,237,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <p style={{ fontSize: 11, color: 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 10 }}>Your App</p>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{process.env.NEXT_PUBLIC_APP_NAME ?? 'My App'}</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 20 }}>
            Welcome to your dashboard. Manage your project and track progress here.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link href="/roadmap"
              style={{ background: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none', padding: '9px 18px', borderRadius: 8, display: 'inline-block' }}>
              View Roadmap →
            </Link>
            <Link href="/forum"
              style={{ background: 'var(--surface-2)', color: 'var(--text-muted)', border: '1px solid var(--border)', fontSize: 13, textDecoration: 'none', padding: '9px 18px', borderRadius: 8, display: 'inline-block' }}>
              Ask a question
            </Link>
          </div>
        </div>

        {/* My Forum Posts */}
        {myPosts.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <p style={{ fontSize: 12, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Recent posts</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {myPosts.slice(0, 5).map(post => {
                const isNew = isToday(post.createdAt)
                const isClosed = post.status === 'closed'
                return (
                  <Link key={post.id} href={`/forum/${post.id}`} style={{ textDecoration: 'none' }}>
                    <div className="card-hover" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                      {/* Status badge top-left */}
                      <div style={{ flexShrink: 0 }}>
                        {isClosed ? (
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#888', background: 'rgba(136,136,136,0.1)', border: '1px solid rgba(136,136,136,0.2)', borderRadius: 100, padding: '2px 8px', whiteSpace: 'nowrap' }}>
                            Closed
                          </span>
                        ) : isNew ? (
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#22c55e', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 100, padding: '2px 8px', whiteSpace: 'nowrap' }}>
                            New
                          </span>
                        ) : (
                          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-dim)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 100, padding: '2px 8px', whiteSpace: 'nowrap' }}>
                            Open
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: 14, color: isClosed ? 'var(--text-muted)' : 'var(--text)', fontWeight: 500, flex: 1, lineHeight: 1.3 }}>
                        {post.title}
                      </p>
                      <span style={{ fontSize: 11, color: 'var(--text-faint)', whiteSpace: 'nowrap' }}>#{post.postNumber}</span>
                    </div>
                  </Link>
                )
              })}
            </div>
            {myPosts.length > 5 && (
              <Link href="/forum" style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none', display: 'block', marginTop: 10 }}>
                View all {myPosts.length} posts →
              </Link>
            )}
          </div>
        )}

        {/* Quick links */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 40 }}>
          {QUICK_LINKS.map((link) => (
            <Link key={link.href} href={link.href} style={{ textDecoration: 'none' }}>
              <div className="card-hover" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{link.label}</p>
                <p style={{ fontSize: 12, color: 'var(--text-faint)' }}>{link.desc}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Sign out */}
        <button onClick={signOut} style={{ fontSize: 13, color: 'var(--text-faint)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          Sign out
        </button>

      </div>
    </div>
  )
}
