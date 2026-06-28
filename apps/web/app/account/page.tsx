'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { BackButton } from '@/components/back-button'
import { useApi } from '@/hooks/use-api'

type ApiKeyData = { apiKey: string; createdAt: string }

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function AccountPage() {
  const { apiFetch } = useApi()
  const queryClient = useQueryClient()
  const [copied, setCopied] = useState(false)
  const [showKey, setShowKey] = useState(false)

  const { data, isLoading } = useQuery<ApiKeyData>({
    queryKey: ['account-api-key'],
    queryFn: async () => {
      const res = await apiFetch('/api/account/api-key')
      if (!res.ok) throw new Error('Failed to fetch API key')
      return res.json() as Promise<ApiKeyData>
    },
  })

  const regen = useMutation<ApiKeyData, Error>({
    mutationFn: async () => {
      const res = await apiFetch('/api/account/api-key/regenerate', { method: 'POST' })
      if (!res.ok) throw new Error('Failed to regenerate')
      return res.json() as Promise<ApiKeyData>
    },
    onSuccess: (newData) => {
      queryClient.setQueryData(['account-api-key'], newData)
      setShowKey(true)
    },
  })

  function copyKey() {
    if (!data?.apiKey) return
    navigator.clipboard.writeText(data.apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const maskedKey = data?.apiKey
    ? data.apiKey.slice(0, 8) + '•'.repeat(24) + data.apiKey.slice(-4)
    : ''

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--fg)', padding: '24px 16px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <BackButton />

        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>MT5 API Key</h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 24 }}>
          ใช้ key นี้เป็น <code style={{ color: 'var(--accent)' }}>MT5_SECRET</code> ใน EA ของคุณ
        </p>

        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 10, padding: 24,
        }}>
          {isLoading ? (
            <p style={{ color: 'var(--muted)' }}>กำลังโหลด...</p>
          ) : data ? (
            <>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>
                  Personal API Key
                </label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <code style={{
                    flex: 1, background: '#0a0a0a', border: '1px solid var(--border)',
                    borderRadius: 6, padding: '10px 14px', fontSize: 13,
                    color: showKey ? 'var(--accent)' : 'var(--muted)',
                    fontFamily: 'monospace', wordBreak: 'break-all',
                  }}>
                    {showKey ? data.apiKey : maskedKey}
                  </code>
                  <button
                    onClick={() => setShowKey(v => !v)}
                    style={{
                      background: 'var(--surface)', border: '1px solid var(--border)',
                      borderRadius: 6, padding: '10px 14px', cursor: 'pointer',
                      color: 'var(--fg)', fontSize: 12, whiteSpace: 'nowrap',
                    }}
                  >
                    {showKey ? 'ซ่อน' : 'แสดง'}
                  </button>
                  <button
                    onClick={copyKey}
                    style={{
                      background: copied ? 'var(--accent)' : 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 6, padding: '10px 14px', cursor: 'pointer',
                      color: copied ? '#000' : 'var(--fg)', fontSize: 12, whiteSpace: 'nowrap',
                      transition: 'all 0.2s',
                    }}
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
                  สร้างเมื่อ: {fmtDate(data.createdAt)}
                </p>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '20px 0' }} />

              <div>
                <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>
                  Regenerate จะทำให้ key เดิมใช้ไม่ได้ — ต้องอัปเดต EA ทุกตัวที่ใช้ key นี้
                </p>
                <button
                  onClick={() => regen.mutate()}
                  disabled={regen.isPending}
                  style={{
                    background: 'transparent', border: '1px solid #e53e3e',
                    borderRadius: 7, padding: '10px 18px', cursor: 'pointer',
                    color: '#e53e3e', fontSize: 14, fontWeight: 600,
                    opacity: regen.isPending ? 0.5 : 1,
                  }}
                >
                  {regen.isPending ? 'กำลัง Regenerate...' : 'Regenerate Key'}
                </button>
                {regen.isError && (
                  <p style={{ color: '#e53e3e', fontSize: 13, marginTop: 8 }}>
                    {regen.error.message}
                  </p>
                )}
              </div>
            </>
          ) : (
            <p style={{ color: '#e53e3e' }}>ไม่สามารถโหลด key ได้</p>
          )}
        </div>

        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 10, padding: 20, marginTop: 20,
        }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>วิธีติดตั้ง EA</h2>
          <ol style={{ paddingLeft: 18, color: 'var(--muted)', fontSize: 13, lineHeight: 1.8 }}>
            <li>เปิด MetaTrader 5 → Expert Advisors</li>
            <li>เพิ่ม EA จาก <code style={{ color: 'var(--accent)' }}>docs/mt5-ea-template.mq5</code></li>
            <li>ตั้งค่า <code style={{ color: 'var(--accent)' }}>API_URL</code> = URL ของ API</li>
            <li>ตั้งค่า <code style={{ color: 'var(--accent)' }}>MT5_SECRET</code> = key ด้านบน</li>
            <li>คลิก OK และรัน EA บน chart ที่ต้องการ</li>
          </ol>
        </div>
      </div>
    </main>
  )
}
