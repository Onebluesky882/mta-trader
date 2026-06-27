interface WelcomeEmailProps {
  name: string;
  loginUrl: string;
}

export function WelcomeEmail({ name, loginUrl }: WelcomeEmailProps) {
  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Welcome, {name}!</h1>
      <p>Your account has been created successfully.</p>
      <a
        href={loginUrl}
        style={{
          display: 'inline-block',
          padding: '12px 24px',
          backgroundColor: '#2563eb',
          color: '#ffffff',
          textDecoration: 'none',
          borderRadius: '6px',
        }}
      >
        Sign in to your account
      </a>
      <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '24px' }}>
        If you did not create this account, you can safely ignore this email.
      </p>
    </div>
  );
}
