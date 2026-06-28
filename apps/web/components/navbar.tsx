'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'

const NAV_LINKS = [
  { href: '/', label: 'Dashboard' },
  { href: '/log', label: 'Log' },
  { href: '/settings', label: 'Settings' },
  { href: '/optimize', label: 'Optimize' },
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
        borderBottom: '1px solid var(--border)',
        background: 'rgba(13,13,13,0.92)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        height: 56, display: 'flex', alignItems: 'center',
        padding: '0 24px',
      }}>
        <div style={{ maxWidth: 960, margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <Link href="/" style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.04em', color: 'var(--text)', textDecoration: 'none' }}>
            ATP Bot Trader
          </Link>

          {/* Desktop nav */}
          {token && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }} className="nav-desktop">
              {NAV_LINKS.map(l => (
                <Link
                  key={l.href}
                  href={l.href}
                  style={{
                    fontSize: 13,
                    fontWeight: isActive(l.href) ? 600 : 400,
                    color: isActive(l.href) ? 'var(--text)' : 'var(--text-muted)',
                    textDecoration: 'none',
                    padding: '6px 12px',
                    borderRadius: 6,
                    transition: 'color 120ms',
                  }}
                >
                  {l.label}
                </Link>
              ))}
              <button
                onClick={handleSignOut}
                style={{
                  marginLeft: 12,
                  fontSize: 13,
                  color: 'var(--text-faint)',
                  background: 'none',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  padding: '5px 12px',
                  cursor: 'pointer',
                  transition: 'border-color 150ms, color 150ms',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'
                  e.currentTarget.style.color = '#ef4444'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border)'
                  e.currentTarget.style.color = 'var(--text-faint)'
                }}
              >
                Sign out
              </button>
            </div>
          )}

          {/* Hamburger — mobile only */}
          {token && (
            <button
              className="nav-hamburger"
              onClick={() => setOpen(o => !o)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, color: 'var(--text)', display: 'none' }}
              aria-label="Menu"
            >
              {open ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
              )}
            </button>
          )}
        </div>
      </nav>

      {/* Mobile drawer */}
      {open && token && (
        <div className="nav-mobile-menu" style={{
          position: 'fixed', top: 56, left: 0, right: 0, zIndex: 49,
          background: 'rgba(13,13,13,0.97)', backdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border)', padding: '16px 24px 24px',
          display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          {NAV_LINKS.map(l => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              style={{
                fontSize: 15, fontWeight: isActive(l.href) ? 600 : 400,
                color: isActive(l.href) ? 'var(--text)' : 'var(--text-muted)',
                textDecoration: 'none', padding: '12px 0',
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
              borderRadius: 8, padding: '10px', fontSize: 14,
              fontWeight: 500, cursor: 'pointer', textAlign: 'center',
            }}
          >
            Sign out
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
