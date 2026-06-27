'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { BackButton } from '@/components/back-button'
import { uploadForumImage } from '@/hooks/use-image-upload'
import { useApi } from '@/hooks/use-api'

const API = process.env.NEXT_PUBLIC_API_URL ?? ''

function isToday(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
}

type Category = 'all' | 'general' | 'problem' | 'feature' | 'howto'
type Post = {
  id: string; postNumber: number; title: string; body: string
  category: Exclude<Category, 'all'>
  status: 'open' | 'closed'
  isPinned: boolean; imageUrl?: string | null; createdAt: string
  user: { id: string; name: string }
}

const TABS: { key: Category; label: string }[] = [
  { key: 'all',     label: 'All' },
  { key: 'general', label: 'General' },
  { key: 'problem', label: 'Problem' },
  { key: 'feature', label: 'Feature' },
  { key: 'howto',   label: 'How To' },
]

const CATEGORY_COLORS: Record<Exclude<Category, 'all'>, { bg: string; text: string }> = {
  general: { bg: 'rgba(99,102,241,0.12)', text: '#818cf8' },
  problem: { bg: 'rgba(239,68,68,0.10)',  text: '#f87171' },
  feature: { bg: 'rgba(34,197,94,0.10)',  text: '#4ade80' },
  howto:   { bg: 'rgba(234,179,8,0.10)',  text: '#facc15' },
}

const CATEGORY_LABELS: Record<Exclude<Category, 'all'>, string> = {
  general: 'General', problem: 'Problem', feature: 'Feature', howto: 'How To',
}

function CategoryBadge({ category }: { category: Exclude<Category, 'all'> }) {
  const c = CATEGORY_COLORS[category]
  return (
    <span style={{ fontSize: 10, fontWeight: 700, background: c.bg, color: c.text, borderRadius: 100, padding: '2px 9px', letterSpacing: '0.05em' }}>
      {CATEGORY_LABELS[category]}
    </span>
  )
}

function PostCard({ post }: { post: Post }) {
  return (
    <Link href={`/forum/${post.id}`} style={{ textDecoration: 'none', display: 'block', marginBottom: 8 }}>
      <div className="card-hover" style={{
        background: post.isPinned ? 'rgba(124,58,237,0.04)' : 'var(--surface)',
        border: post.isPinned ? '1px solid rgba(124,58,237,0.25)' : '1px solid var(--border)',
        borderRadius: 10, padding: '16px 20px', transition: 'border-color 150ms',
      }}>
        {/* Top row — pinned + category */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          {post.isPinned && (
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-dim)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 100, padding: '2px 8px', letterSpacing: '0.06em' }}>
              📌 PINNED
            </span>
          )}
          <CategoryBadge category={post.category} />
        </div>

        <h2 style={{ fontSize: 15, fontWeight: 600, color: post.status === 'closed' ? 'var(--text-muted)' : 'var(--text)', marginBottom: 6, lineHeight: 1.4 }}>
          {post.title}
          <span style={{ fontSize: 11, color: 'var(--text-faint)', fontWeight: 400, marginLeft: 8 }}>#{post.postNumber}</span>
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: post.imageUrl ? 10 : 12, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{post.body}</p>
        {post.imageUrl && <img src={post.imageUrl} alt="" style={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 6, marginBottom: 10 }} />}

        {/* Bottom row — author + date + status badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--accent-dim)', border: '1px solid rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--accent)', fontWeight: 700 }}>
            {post.user.name[0].toUpperCase()}
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>{post.user.name}</span>
          <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>
            {new Date(post.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </span>
          <span style={{ marginLeft: 'auto' }}>
            {post.status === 'closed' ? (
              <span style={{ fontSize: 10, fontWeight: 700, color: '#888', background: 'rgba(136,136,136,0.1)', border: '1px solid rgba(136,136,136,0.2)', borderRadius: 100, padding: '2px 8px' }}>Closed</span>
            ) : isToday(post.createdAt) ? (
              <span style={{ fontSize: 10, fontWeight: 700, color: '#22c55e', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 100, padding: '2px 8px' }}>New</span>
            ) : (
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-dim)', border: '1px solid rgba(124,58,237,0.15)', borderRadius: 100, padding: '2px 8px' }}>Open</span>
            )}
          </span>
        </div>
      </div>
    </Link>
  )
}

export default function ForumPage() {
  const { apiFetch, API: BASE } = useApi()
  const [posts, setPosts] = useState<Post[]>([])
  const [tab, setTab] = useState<Category>('all')
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [category, setCategory] = useState<Exclude<Category, 'all'>>('general')
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function load(cat: Category) {
    const url = cat === 'all' ? `${API}/api/forum` : `${API}/api/forum?category=${cat}`
    const res = await fetch(url, { credentials: 'include' })
    if (res.ok) setPosts(await res.json())
  }

  useEffect(() => { load(tab) }, [tab])

  useEffect(() => {
    if (open) setTimeout(() => titleRef.current?.focus(), 100)
  }, [open])

  async function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImagePreview(URL.createObjectURL(file))
    setUploading(true)
    setError('')
    try {
      const url = await uploadForumImage(file)
      setImageUrl(url)
    } catch (err) {
      setError(`Upload error: ${err instanceof Error ? err.message : String(err)}`)
      setImagePreview(null)
    } finally {
      setUploading(false)
    }
  }

  async function handlePost(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !body.trim()) return
    setPosting(true)
    setError('')
    try {
      const res = await apiFetch(`/api/forum`, {
        method: 'POST',
        body: JSON.stringify({ title, body, category, imageUrl }),
      })
      if (res.ok) {
        setTitle(''); setBody(''); setImageUrl(null); setImagePreview(null); setOpen(false); load(tab)
      } else {
        const d = await res.json() as { error?: string }
        setError(d.error === 'Unauthorized' ? 'Please sign in to post.' : (d.error ?? 'Failed'))
      }
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setPosting(false)
    }
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)', paddingBottom: 80 }}>
      <Navbar />

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px 24px' }}>
        <BackButton href="/" />

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 11, color: 'var(--accent)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10, fontWeight: 600 }}>Forum</p>
          <h1 style={{ fontSize: 'clamp(24px, 5vw, 36px)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 8 }}>Community Q&A</h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Ask questions, share what you built, get help from the community.</p>
        </div>

        {/* Category tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 28, flexWrap: 'wrap' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              fontSize: 13, fontWeight: tab === t.key ? 600 : 400,
              color: tab === t.key ? 'var(--text)' : 'var(--text-muted)',
              background: tab === t.key ? 'var(--surface)' : 'transparent',
              border: tab === t.key ? '1px solid var(--border)' : '1px solid transparent',
              borderRadius: 8, padding: '6px 14px', cursor: 'pointer', transition: 'all 150ms',
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Post list */}
        {posts.length === 0 ? (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '48px 24px', textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: 'var(--text-faint)' }}>No posts yet — be the first to ask.</p>
          </div>
        ) : (
          posts.map(post => <PostCard key={post.id} post={post} />)
        )}
      </div>

      {/* Sticky bottom bar */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
        borderTop: '1px solid var(--border)',
        background: 'rgba(8,8,8,0.92)', backdropFilter: 'blur(16px)',
        transition: 'all 250ms cubic-bezier(0.4,0,0.2,1)',
      }}>
        {/* Collapsed — just a trigger bar */}
        {!open && (
          <div style={{ maxWidth: 720, margin: '0 auto', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => setOpen(true)}
              style={{
                flex: 1, textAlign: 'left', background: 'var(--surface)',
                border: '1px solid var(--border)', borderRadius: 8,
                padding: '10px 16px', fontSize: 14, color: 'var(--text-faint)',
                cursor: 'pointer',
              }}
            >
              Ask a question…
            </button>
            <button
              onClick={() => setOpen(true)}
              style={{
                background: 'var(--accent)', color: '#fff', border: 'none',
                borderRadius: 8, padding: '10px 20px', fontSize: 14,
                fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              + Post
            </button>
          </div>
        )}

        {/* Expanded — full form */}
        {open && (
          <div style={{ maxWidth: 720, margin: '0 auto', padding: '16px 24px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <p style={{ fontSize: 13, fontWeight: 700 }}>New post</p>
              <button onClick={() => { setOpen(false); setError('') }} style={{ background: 'none', border: 'none', color: 'var(--text-faint)', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>

            {/* Category selector */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
              {(Object.keys(CATEGORY_LABELS) as Exclude<Category, 'all'>[]).map(cat => {
                const c = CATEGORY_COLORS[cat]
                const active = category === cat
                return (
                  <button key={cat} type="button" onClick={() => setCategory(cat)} style={{
                    fontSize: 11, fontWeight: 600,
                    background: active ? c.bg : 'transparent',
                    color: active ? c.text : 'var(--text-faint)',
                    border: active ? `1px solid ${c.text}44` : '1px solid var(--border)',
                    borderRadius: 100, padding: '3px 12px', cursor: 'pointer', transition: 'all 150ms',
                  }}>
                    {CATEGORY_LABELS[cat]}
                  </button>
                )
              })}
            </div>

            <form onSubmit={handlePost} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                ref={titleRef}
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Title — what's your question?"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: 14, color: 'var(--text)', outline: 'none' }}
              />
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="Describe in detail…"
                rows={3}
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: 14, color: 'var(--text)', outline: 'none', resize: 'none', fontFamily: 'inherit' }}
              />
              {/* Image upload */}
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImagePick} />
              {imagePreview && (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <img src={imagePreview} alt="" style={{ maxHeight: 120, borderRadius: 6, objectFit: 'cover' }} />
                  <button type="button" onClick={() => { setImageUrl(null); setImagePreview(null) }} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: 20, height: 20, fontSize: 12, cursor: 'pointer', lineHeight: 1 }}>×</button>
                </div>
              )}
              {error && <p style={{ fontSize: 12, color: '#ef4444' }}>{error}</p>}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} style={{ fontSize: 12, color: uploading ? 'var(--text-faint)' : 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  {uploading ? 'Uploading…' : '📎 Add image'}
                </button>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={() => { setOpen(false); setError(''); setImageUrl(null); setImagePreview(null) }} style={{ background: 'var(--surface-2)', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 16px', fontSize: 13, cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={posting || uploading} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: (posting || uploading) ? 'not-allowed' : 'pointer', opacity: (posting || uploading) ? 0.6 : 1 }}>
                    {posting ? 'Posting…' : 'Post question'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
