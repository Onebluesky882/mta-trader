'use client'
import { useRouter } from 'next/navigation'
import { useSession } from '@/hooks/use-session'
import { useAgent } from '@/hooks/use-agent'
import { RepoSetup } from '@/components/agent/repo-setup'
import { ChatWindow } from '@/components/agent/chat-window'
import { DeployResult } from '@/components/agent/deploy-result'

export default function AgentPage() {
  const router = useRouter()
  const { user, isLoading: sessionLoading } = useSession()
  const {
    isSetup,
    isSettingUp,
    isRestoring,
    sessionId,
    messages,
    isStreaming,
    currentTool,
    error,
    deployStatus,
    siteUrl,
    setupAgent,
    sendMessage,
    clearSession,
  } = useAgent()

  if (sessionLoading) return null

  if (!user || (user as any).role !== 'owner') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 64px)', gap: '12px' }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <p style={{ color: '#64748b', fontSize: '15px', margin: 0 }}>Access restricted to project owner only.</p>
        <button onClick={() => router.back()} style={{ fontSize: '13px', color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Go back</button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button
          onClick={() => router.back()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: '#64748b',
            fontSize: '14px',
            padding: '4px 0',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </button>
        <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
          AI Agent
        </h1>
      </div>

      {/* Content */}
      {isRestoring ? (
        <p style={{ color: '#94a3b8', fontSize: '14px' }}>Restoring session...</p>
      ) : !isSetup ? (
        <RepoSetup
          onSetup={setupAgent}
          isLoading={isSettingUp}
          error={error}
        />
      ) : (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '20px',
            overflow: 'hidden',
          }}
        >
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
            <button
              onClick={clearSession}
              disabled={isStreaming}
              style={{
                fontSize: '12px',
                color: '#94a3b8',
                background: 'none',
                border: 'none',
                cursor: isStreaming ? 'not-allowed' : 'pointer',
                padding: 0,
              }}
            >
              Change repository
            </button>
          </div>
          <ChatWindow
            messages={messages}
            isStreaming={isStreaming}
            currentTool={currentTool}
            error={error}
            sessionId={sessionId ?? ''}
            onSend={sendMessage}
          />
          <DeployResult status={deployStatus} siteUrl={siteUrl} />
        </div>
      )}
    </div>
  )
}
