'use client'
import { useEffect, useRef } from 'react'
import type { Message } from '@/hooks/use-agent'

type Props = {
  messages: Message[]
}

export function MessageList({ messages }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (messages.length === 0) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#94a3b8',
          fontSize: '14px',
        }}
      >
        Describe what you want to change and Claude will edit your code.
      </div>
    )
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {messages.map((msg) => (
        <div
          key={msg.id}
          style={{
            display: 'flex',
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
          }}
        >
          <div
            style={{
              maxWidth: '72%',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '14px',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              background: msg.role === 'user' ? '#1e293b' : '#f1f5f9',
              color: msg.role === 'user' ? '#f8fafc' : '#0f172a',
            }}
          >
            {msg.text || (msg.role === 'assistant' ? '...' : '')}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
