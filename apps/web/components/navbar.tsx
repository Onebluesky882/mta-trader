'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'

const NAV_LINKS = [
  { href: '/',           label: 'Dashboard' },
  { href: '/log',        label: 'Trade Log' },
  { href: '/settings',   label: 'Settings' },
  { href: '/optimize',   label: 'Optimize' },
  { href: '/ai-config',  label: 'AI Config' },
]

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { token, clearToken } = useAppStore()
  const [open, setOpen] = useState(false)

  function handleSignOut() {
    clearToken()
    setOpen(false)
    router.push('/login')
  }

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <>
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(8,8,8,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        height: 64,
        display: 'flex',
        alignItems: 'center',
        padding: '0 32px',
      }}>
        {/* scan line */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', left: 0, right: 0, height: 1,
            background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
            opacity: 0, animation: 'scan 6s ease-in-out infinite',
          }} />
        </div>

        <div style={{
          maxWidth: 1200, margin: '0 auto', width: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'linear-gradient(135deg, var(--accent) 0%, #006644 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 14px var(--accent-glow)',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                <polyline points="16 7 22 7 22 13" />
              </svg>
            </div>
            <div>
              <span style={{ fontWeight: 800, fontSize: 14, letterSpacing: '-0.04em', color: '#fff' }}>ATP</span>
              <span style={{ fontWeight: 400, fontSize: 14, letterSpacing: '-0.02em', color: 'var(--text-muted)', marginLeft: 4 }}>Bot Trader</span>
            </div>
          </Link>

          {/* Desktop nav */}
          {token && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 0 }} className="nav-desktop">
              {NAV_LINKS.map(l => (
                <Link
                  key={l.href}
                  href={l.href}
                  style={{
                    position: 'relative',
                    fontSize: 13,
                    fontWeight: isActive(l.href) ? 600 : 400,
                    color: isActive(l.href) ? '#fff' : 'var(--text-muted)',
                    textDecoration: 'none',
                    padding: '6px 14px',
                    borderRadius: 6,
                    transition: 'color 120ms',
                    letterSpacing: '0.01em',
                  }}
                >
                  {l.label}
                  {isActive(l.href) && (
                    <span style={{
                      position: 'absolute', bottom: -1, left: 14, right: 14, height: 2,
                      background: 'var(--accent)',
                      borderRadius: 2,
                      boxShadow: '0 0 8px var(--accent)',
                    }} />
                  )}
                </Link>
              ))}
            </div>
          )}

          {/* Right CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} className="nav-desktop">
            {token ? (
              <button
                onClick={handleSignOut}
                style={{
                  fontSize: 13, fontWeight: 600,
                  color: 'var(--text-muted)',
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: '7px',
                  padding: '8px 16px', cursor: 'pointer',
                  transition: 'border-color 150ms, color 150ms',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'; e.currentTarget.style.color = '#ef4444' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)' }}
              >
                Sign Out
              </button>
            ) : (
              <>
                <Link href="/login" style={{
                  fontSize: 13, fontWeight: 600, color: 'var(--text)',
                  textDecoration: 'none', padding: '8px 18px',
                  border: '1px solid var(--border)', borderRadius: '7px',
                  transition: 'border-color 150ms',
                }}>
                  Client Login
                </Link>
                <Link href="/register" className="btn-primary" style={{ padding: '8px 18px', fontSize: 13 }}>
                  Start Trading
                </Link>
              </>
            )}
          </div>

          {/* Hamburger — mobile */}
          {token && (
            <button
              className="nav-hamburger"
              onClick={() => setOpen(o => !o)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, color: 'var(--text)', display: 'none' }}
              aria-label="Menu"
            >
              {open
                ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
              }
            </button>
          )}
        </div>
      </nav>

      {/* Mobile drawer */}
      {open && token && (
        <div style={{
          position: 'fixed', top: 64, left: 0, right: 0, zIndex: 49,
          background: 'rgba(8,8,8,0.98)', backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border)', padding: '16px 24px 24px',
          display: 'flex', flexDirection: 'column', gap: 4,
        }} className="nav-mobile-menu">
          {NAV_LINKS.map(l => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              style={{
                fontSize: 15, fontWeight: isActive(l.href) ? 700 : 400,
                color: isActive(l.href) ? 'var(--accent)' : 'var(--text-muted)',
                textDecoration: 'none', padding: '14px 0',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              {l.label}
            </Link>
          ))}
          <button
            onClick={handleSignOut}
            style={{
              marginTop: 16, background: 'transparent',
              border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444',
              borderRadius: 8, padding: '12px', fontSize: 14,
              fontWeight: 600, cursor: 'pointer',
            }}
          >
            Sign Out
          </button>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .nav-desktop { display: none !important; }
          .nav-hamburger { display: flex !important; }
        }
        @media (min-width: 769px) {
          .nav-mobile-menu { display: none !important; }
        }
      `}</style>
    </>
  )
}
