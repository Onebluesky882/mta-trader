import type { ResendClient } from './resend'

type SendEmailOptions = {
  to: string
  subject: string
  html: string
  from?: string
}

export async function sendEmail(
  resend: ResendClient,
  { to, subject, html, from = 'noreply@yourdomain.com' }: SendEmailOptions,
) {
  const { data, error } = await resend.emails.send({ from, to, subject, html })
  if (error) throw new Error(error.message)
  return data
}
