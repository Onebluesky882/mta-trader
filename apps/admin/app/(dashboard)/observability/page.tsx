'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL ?? ''

type AgentLog = {
  id: string
  correlation_id: string
  session_id: string | null
  agent_id: string | null
  output_preview: string | null
  tool_calls: string[]
  tokens_input: number
  tokens_output: number
  latency_ms: number
  status: string
  error_message: string | null
  created_at: number
}

export default function ObservabilityPage() {
  const router = useRouter()
  const [logs, setLogs] = useState<AgentLog[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/api/agent/logs`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setLogs(d.logs ?? []))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button
          onClick={() => router.back()}
          style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '14px', padding: 0 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </button>
        <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: '#0f172a' }}>Observability</h1>
      </div>

      {isLoading ? (
        <p style={{ color: '#94a3b8', fontSize: '14px' }}>Loading logs...</p>
      ) : logs.length === 0 ? (
        <p style={{ color: '#94a3b8', fontSize: '14px' }}>No agent runs yet.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                {['Time', 'Status', 'Latency', 'Tokens in', 'Tokens out', 'Tools', 'Output preview'].map((h) => (
                  <th key={h} style={{ padding: '10px 12px', fontWeight: 600, color: '#475569', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 12px', color: '#64748b', whiteSpace: 'nowrap' }}>
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{
                      display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 500,
                      background: log.status === 'success' ? '#dcfce7' : '#fee2e2',
                      color: log.status === 'success' ? '#16a34a' : '#dc2626',
                    }}>
                      {log.status}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', color: '#0f172a' }}>{log.latency_ms.toLocaleString()} ms</td>
                  <td style={{ padding: '10px 12px', color: '#0f172a' }}>{log.tokens_input.toLocaleString()}</td>
                  <td style={{ padding: '10px 12px', color: '#0f172a' }}>{log.tokens_output.toLocaleString()}</td>
                  <td style={{ padding: '10px 12px', color: '#64748b' }}>
                    {log.tool_calls.length > 0 ? log.tool_calls.join(', ') : '—'}
                  </td>
                  <td style={{ padding: '10px 12px', color: '#64748b', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {log.error_message ?? log.output_preview ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
