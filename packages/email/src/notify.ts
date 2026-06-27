import { createResend } from './resend'
import { sendEmail } from './send'

type NotifyParams = {
  to: string
  name: string
  subject: string
  message: string
  resendApiKey: string
  fromEmail?: string
}

export async function sendNotificationEmail({ to, name, subject, message, resendApiKey, fromEmail }: NotifyParams) {
  const resend = createResend(resendApiKey)
  const html = `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
    <p style="color:#888;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:16px">GoverAgent Community</p>
    <h2 style="font-size:20px;font-weight:700;margin-bottom:8px;color:#111">${subject}</h2>
    <p style="color:#555;font-size:15px;line-height:1.6">Hi ${name},</p>
    <p style="color:#555;font-size:15px;line-height:1.6">${message}</p>
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0" />
    <p style="color:#aaa;font-size:12px">You received this because you participated in a forum thread. <a href="https://fullstack-builder-web.onebluesky882.workers.dev/forum" style="color:#7c3aed">Visit Forum</a></p>
  </div>`
  return sendEmail(resend, { to, subject, html, from: fromEmail })
}
