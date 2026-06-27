'use client'
import { useState } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL ?? ''

type EmailsHook = {
  send: () => Promise<void>
  isSending: boolean
  result: string
}

export function useEmails(): EmailsHook {
  const [isSending, setIsSending] = useState(false)
  const [result, setResult] = useState('')

  async function send() {
    setIsSending(true)
    setResult('')
    try {
      const res = await fetch(`${API}/api/email/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          to: 'test@example.com',
          subject: 'Test Email from Admin',
          message: 'This is a test notification sent from the admin dashboard.',
        }),
      })
      if (res.ok) {
        setResult('Test email sent successfully.')
      } else {
        setResult('Failed to send test email.')
      }
    } catch {
      setResult('Error: could not reach the API.')
    } finally {
      setIsSending(false)
    }
  }

  return { send, isSending, result }
}
