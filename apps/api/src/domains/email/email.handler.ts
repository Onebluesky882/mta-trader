import { createResend, sendEmail } from '@gover-agent/email'

type SendWelcomeParams = { to: string; name: string; resendApiKey: string }
type SendNotificationParams = { to: string; name: string; subject: string; message: string; resendApiKey: string }

function welcomeHtml(name: string) {
  return `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
    <h1>Welcome, ${name}!</h1>
    <p>Your account has been created successfully.</p>
    <a href="https://gover-agent.dev/login" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px">Sign in to your account</a>
    <p style="color:#6b7280;font-size:14px;margin-top:24px">If you did not create this account, you can safely ignore this email.</p>
  </div>`
}

function notificationHtml(name: string, subject: string, message: string) {
  return `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
    <h1>${subject}</h1>
    <p>Hi ${name},</p>
    <p>${message}</p>
    <p style="color:#6b7280;font-size:14px;margin-top:24px">You are receiving this because you have an account with us.</p>
  </div>`
}

export async function sendWelcomeEmail({ to, name, resendApiKey }: SendWelcomeParams) {
  const resend = createResend(resendApiKey)
  return sendEmail(resend, { to, subject: 'Welcome to Fullstack Builder', html: welcomeHtml(name) })
}

export async function sendNotificationEmail({ to, name, subject, message, resendApiKey }: SendNotificationParams) {
  const resend = createResend(resendApiKey)
  return sendEmail(resend, { to, subject, html: notificationHtml(name, subject, message) })
}
