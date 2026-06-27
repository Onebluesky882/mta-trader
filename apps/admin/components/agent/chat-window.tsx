'use client'
import { useState } from 'react'
import { MessageList } from './message-list'
import { ToolIndicator } from './tool-indicator'
import type { Message } from '@/hooks/use-agent'

type Props = {
  messages: Message[]
  isStreaming: boolean
  currentTool: string | null
  error: string | null
  sessionId: string
  onSend: (text: string) => Promise<void>
}

export function ChatWindow({ messages, isStreaming, currentTool, error, onSend }: Props) {
  const [input, setInput] = useState('')

  const handleSend = async () => {
    const text = input.trim()
    if (!text || isStreaming) return
    setInput('')
    await onSend(text)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSend()
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '12px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }} />
        <span style={{ fontSize: '13px', color: '#64748b' }}>เชื่อมต่อ repository แล้ว</span>
      </div>

      {/* Messages */}
      <MessageList messages={messages} />

      {/* Tool indicator */}
      <ToolIndicator tool={currentTool} />

      {/* Error */}
      {error && (
        <div
          style={{
            padding: '8px 12px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            fontSize: '13px',
            color: '#dc2626',
          }}
        >
          {error}
        </div>
      )}

      {/* Input */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'flex-end',
          padding: '12px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
        }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe what you want to change... (Enter to send, Shift+Enter for new line)"
          disabled={isStreaming}
          rows={2}
          style={{
            flex: 1,
            resize: 'none',
            border: 'none',
            background: 'transparent',
            fontSize: '14px',
            outline: 'none',
            color: '#0f172a',
            lineHeight: '1.5',
          }}
        />
        <button
          onClick={handleSend}
          disabled={isStreaming || !input.trim()}
          style={{
            padding: '8px 16px',
            background: isStreaming || !input.trim() ? '#94a3b8' : '#1e293b',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 500,
            cursor: isStreaming || !input.trim() ? 'not-allowed' : 'pointer',
            flexShrink: 0,
          }}
        >
          {isStreaming ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="6" y="6" width="12" height="12" rx="1" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}
