'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { BackButton } from '@/components/back-button'
import { uploadForumImage } from '@/hooks/use-image-upload'
import { useAuthStore } from '@/store/auth.store'
import { useApi } from '@/hooks/use-api'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://fullstack-builder-api.onebluesky882.workers.dev'

type Reply = {
  id: string; body: string; imageUrl?: string | null; createdAt: string
  parentReplyId: string | null
  user: { id: string; name: string }
}
type Post = {
  id: string; postNumber: number; title: string; body: string; imageUrl?: string | null
  status: 'open' | 'closed'; createdAt: string
  user: { id: string; name: string }
  forumReplies: Reply[]
}

function Avatar({ name, size = 28 }: { name: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'var(--accent-dim)', border: '1px solid rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.43, color: 'var(--accent)', fontWeight: 700, flexShrink: 0 }}>
      {name[0].toUpperCase()}
    </div>
  )
}

function ReplyCard({
  reply, depth = 0, onReply,
}: {
  reply: Reply & { children?: Reply[] }
  depth?: number
  onReply: (replyId: string, username: string) => void
}) {
  return (
    <div style={{ marginLeft: depth > 0 ? 36 : 0 }}>
      <div style={{ display: 'flex', gap: 10 }}>
        <Avatar name={reply.user.name} size={depth > 0 ? 22 : 28} />
        <div style={{ flex: 1, background: depth > 0 ? 'var(--surface-2)' : 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: depth > 0 ? 12 : 13, fontWeight: 600, color: 'var(--text)' }}>{reply.user.name}</span>
            <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>
              {new Date(reply.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            </span>
            <button
              onClick={() => onReply(reply.id, reply.user.name)}
              style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-faint)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', borderRadius: 4, transition: 'color 150ms' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-faint)')}
            >
              ↩ Reply
            </button>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {reply.body.startsWith('@') ? (
              <>
                <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{reply.body.split(' ')[0]}</span>
                {' ' + reply.body.split(' ').slice(1).join(' ')}
              </>
            ) : reply.body}
          </p>
          {reply.imageUrl && <img src={reply.imageUrl} alt="" style={{ maxWidth: '100%', borderRadius: 6, marginTop: 8, maxHeight: 300, objectFit: 'cover' }} />}
        </div>
      </div>

      {/* Nested children */}
      {reply.children && reply.children.length > 0 && (
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {reply.children.map(child => (
            <ReplyCard key={child.id} reply={child} depth={depth + 1} onReply={onReply} />
          ))}
        </div>
      )}
    </div>
  )
}

function buildTree(replies: Reply[]): (Reply & { children: Reply[] })[] {
  const map = new Map<string, Reply & { children: Reply[] }>()
  replies.forEach(r => map.set(r.id, { ...r, children: [] }))
  const roots: (Reply & { children: Reply[] })[] = []
  map.forEach(r => {
    if (r.parentReplyId && map.has(r.parentReplyId)) {
      map.get(r.parentReplyId)!.children.push(r)
    } else {
      roots.push(r)
    }
  })
  return roots
}

export default function ForumPostPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuthStore()
  const { apiFetch, API: BASE } = useApi()
  const [post, setPost] = useState<Post | null>(null)
  const [isClosed, setIsClosed] = useState(false)
  const [body, setBody] = useState('')
  const [parentReplyId, setParentReplyId] = useState<string | null>(null)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replying, setReplying] = useState(false)
  const [error, setError] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function load() {
    const res = await fetch(`${API}/api/forum/${id}`, { credentials: 'include' })
    if (res.ok) {
      const data = await res.json()
      setPost(data)
      setIsClosed(data.status === 'closed')
    }
  }

  useEffect(() => { if (id) load() }, [id])

  function handleReplyTo(replyId: string, username: string) {
    setParentReplyId(replyId)
    setReplyingTo(username)
    setBody(`@${username} `)
    setTimeout(() => {
      textareaRef.current?.focus()
      textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
  }

  function clearReplyTo() {
    setParentReplyId(null)
    setReplyingTo(null)
    setBody('')
  }

  async function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImagePreview(URL.createObjectURL(file))
    setUploading(true)
    try {
      const url = await uploadForumImage(file, 'forum/replies')
      setImageUrl(url)
    } catch {
      setError('Image upload failed')
      setImagePreview(null)
    } finally {
      setUploading(false)
    }
  }

  function handleClose() {
    setIsClosed(true)
    router.push('/forum')
    apiFetch(`/api/forum/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'closed' }),
    }).catch(() => {})
  }

  async function handleReply(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim()) return
    setReplying(true)
    setError('')
    try {
      const res = await apiFetch(`/api/forum/${id}/reply`, {
        method: 'POST',
        body: JSON.stringify({ body, parentReplyId, imageUrl }),
      })
      if (res.ok) {
        setBody(''); setParentReplyId(null); setReplyingTo(null); setImageUrl(null); setImagePreview(null); load()
      } else {
        const d = await res.json() as { error?: string }
        setError(d.error === 'Unauthorized' ? 'Please sign in to reply.' : (d.error ?? 'Failed'))
      }
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setReplying(false)
    }
  }

  if (!post) return <div style={{ background: 'var(--bg)', minHeight: '100vh' }} />

  const tree = buildTree(post.forumReplies)

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)' }}>
      <Navbar />

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px' }}>

        <BackButton href="/forum" />

        {/* Post */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}>
            <h1 style={{ fontSize: 'clamp(20px, 4vw, 28px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.3 }}>{post.title}</h1>
            <span style={{ fontSize: 12, color: 'var(--text-faint)', fontWeight: 400, whiteSpace: 'nowrap' }}>#{post.postNumber}</span>
          </div>
          {post.status === 'closed' && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(136,136,136,0.08)', border: '1px solid rgba(136,136,136,0.2)', borderRadius: 8, padding: '6px 12px', marginBottom: 16 }}>
              <span style={{ fontSize: 12, color: '#888' }}>This post is closed — no new replies accepted.</span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <Avatar name={post.user.name} />
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{post.user.name}</span>
            <span style={{ fontSize: 12, color: 'var(--text-faint)', marginLeft: 4 }}>
              {new Date(post.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            <button onClick={() => handleReplyTo('', post.user.name)} style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--accent)', background: 'var(--accent-dim)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 6, padding: '3px 10px', cursor: 'pointer' }}>
              Reply
            </button>
          </div>
          <p style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{post.body}</p>
          {post.imageUrl && <img src={post.imageUrl} alt="" style={{ maxWidth: '100%', borderRadius: 8, marginTop: 16, maxHeight: 400, objectFit: 'cover' }} />}
        </div>

        <div style={{ borderTop: '1px solid var(--border-subtle)', marginBottom: 32 }} />

        {/* Replies tree */}
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 12, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>
            {post.forumReplies.length} {post.forumReplies.length === 1 ? 'reply' : 'replies'}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {tree.map(reply => (
              <ReplyCard key={reply.id} reply={reply} onReply={handleReplyTo} />
            ))}
          </div>
        </div>

        {/* Reply form — hidden if closed */}
        <div style={{ background: 'var(--surface)', border: `1px solid ${post.status === 'closed' ? 'rgba(136,136,136,0.2)' : 'var(--border)'}`, borderRadius: 12, padding: '20px', opacity: post.status === 'closed' ? 0.5 : 1, pointerEvents: post.status === 'closed' ? 'none' : 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <p style={{ fontSize: 13, fontWeight: 600 }}>
              {replyingTo ? `Replying to @${replyingTo}` : 'Write a reply'}
            </p>
            {replyingTo && (
              <button onClick={clearReplyTo} style={{ fontSize: 12, color: 'var(--text-faint)', background: 'none', border: 'none', cursor: 'pointer' }}>
                Cancel reply
              </button>
            )}
          </div>
          <form onSubmit={handleReply} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <textarea
              ref={textareaRef}
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Your answer or comment…"
              rows={4}
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: 14, color: 'var(--text)', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
            />
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImagePick} />
            {imagePreview && (
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img src={imagePreview} alt="" style={{ maxHeight: 120, borderRadius: 6, objectFit: 'cover' }} />
                <button type="button" onClick={() => { setImageUrl(null); setImagePreview(null) }} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: 20, height: 20, fontSize: 12, cursor: 'pointer' }}>×</button>
              </div>
            )}
            {error && <p style={{ fontSize: 12, color: '#ef4444' }}>{error}</p>}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} style={{ fontSize: 12, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                {uploading ? 'Uploading…' : '📎 Add image'}
              </button>
              <button type="submit" disabled={replying || uploading} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 14, fontWeight: 600, cursor: (replying || uploading) ? 'not-allowed' : 'pointer', opacity: (replying || uploading) ? 0.6 : 1 }}>
                {replying ? 'Posting…' : 'Post reply'}
              </button>
            </div>
          </form>
        </div>

        {/* Owner controls — close / reopen */}
        {user?.id === post.user.id && (
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
            {error.startsWith('Close failed') && <p style={{ fontSize: 12, color: '#ef4444' }}>{error}</p>}
            {!isClosed ? (
              <button
                onClick={handleClose}
                onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-faint)'; e.currentTarget.style.borderColor = 'var(--border)' }}
                style={{ fontSize: 13, fontWeight: 500, cursor: 'pointer', borderRadius: 8, padding: '8px 16px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-faint)', transition: 'all 150ms' }}
              >
                Close post
              </button>
            ) : (
              <span style={{ fontSize: 13, fontWeight: 500, color: '#888', border: '1px solid rgba(136,136,136,0.2)', borderRadius: 8, padding: '8px 16px' }}>
                Closed
              </span>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
