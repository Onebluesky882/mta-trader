import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sendWelcomeEmail, sendNotificationEmail } from './email.handler'

vi.mock('@gover-agent/email', () => ({
  createResend: vi.fn(() => ({})),
  sendEmail: vi.fn().mockResolvedValue({ id: 'mock-id' }),
}))

import { sendEmail } from '@gover-agent/email'

beforeEach(() => vi.clearAllMocks())

describe('sendWelcomeEmail', () => {
  it('calls sendEmail with correct subject', async () => {
    await sendWelcomeEmail({ to: 'user@example.com', name: 'Alice', resendApiKey: 'test-key' })
    expect(sendEmail).toHaveBeenCalledOnce()
    const [, opts] = (sendEmail as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(opts.to).toBe('user@example.com')
    expect(opts.subject).toContain('Welcome')
    expect(opts.html).toContain('Alice')
  })
})

describe('sendNotificationEmail', () => {
  it('calls sendEmail with provided subject and message', async () => {
    await sendNotificationEmail({
      to: 'user@example.com',
      name: 'Bob',
      subject: 'Test Subject',
      message: 'Hello there',
      resendApiKey: 'test-key',
    })
    expect(sendEmail).toHaveBeenCalledOnce()
    const [, opts] = (sendEmail as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(opts.subject).toBe('Test Subject')
    expect(opts.html).toContain('Hello there')
    expect(opts.html).toContain('Bob')
  })
})
