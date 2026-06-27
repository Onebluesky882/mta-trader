import { Resend } from 'resend'

export function createResend(apiKey: string) {
  return new Resend(apiKey)
}

export type ResendClient = ReturnType<typeof createResend>
