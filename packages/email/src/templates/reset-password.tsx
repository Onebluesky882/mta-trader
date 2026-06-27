interface ResetPasswordEmailProps {
  name: string
  resetUrl: string
}

export function ResetPasswordEmail({ name, resetUrl }: ResetPasswordEmailProps) {
  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Reset your password</h1>
      <p>Hi {name}, we received a request to reset your password.</p>
      <a
        href={resetUrl}
        style={{
          display: 'inline-block',
          padding: '12px 24px',
          backgroundColor: '#dc2626',
          color: '#ffffff',
          textDecoration: 'none',
          borderRadius: '6px',
        }}
      >
        Reset password
      </a>
      <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '24px' }}>
        This link expires in 1 hour. If you did not request this, ignore this email.
      </p>
    </div>
  )
}
