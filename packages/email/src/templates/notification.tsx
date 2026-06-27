interface NotificationEmailProps {
  name: string
  subject: string
  message: string
}

export function NotificationEmail({ name, subject, message }: NotificationEmailProps) {
  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <h1>{subject}</h1>
      <p>Hi {name},</p>
      <p>{message}</p>
      <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '24px' }}>
        You are receiving this because you have an account with us.
      </p>
    </div>
  )
}
