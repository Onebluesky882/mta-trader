'use client'
import { useEmails } from '@/hooks/use-emails'
import { SendTestButton } from '@/components/emails/send-test-button'
import { EmailLog } from '@/components/emails/email-log'

export default function EmailsPage() {
  const { send, isSending, result } = useEmails()

  return (
    <div>
      <h1 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: 700 }}>Email Log</h1>
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '24px',
          marginBottom: '24px',
        }}
      >
        <p style={{ color: '#64748b', margin: '0 0 16px', fontSize: '14px' }}>
          Email logs will appear here after emails are sent.
        </p>
        <SendTestButton onSend={send} isLoading={isSending} />
        <EmailLog message={result} />
      </div>
    </div>
  )
}
