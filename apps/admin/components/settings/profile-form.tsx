type ProfileFormProps = {
  user: { name: string; email: string } | null
  isLoading: boolean
}

export function ProfileForm({ user, isLoading }: ProfileFormProps) {
  if (isLoading) {
    return <p style={{ color: '#64748b' }}>Loading profile...</p>
  }

  if (!user) {
    return <p style={{ color: '#64748b' }}>No user information available.</p>
  }

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '24px',
        maxWidth: '480px',
      }}
    >
      <div style={{ marginBottom: '16px' }}>
        <label
          style={{
            display: 'block',
            marginBottom: '6px',
            fontSize: '14px',
            fontWeight: 600,
            color: '#374151',
          }}
        >
          Name
        </label>
        <input
          type="text"
          value={user.name}
          readOnly
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            fontSize: '14px',
            background: '#f8fafc',
            color: '#0f172a',
            cursor: 'default',
            boxSizing: 'border-box',
          }}
        />
      </div>
      <div>
        <label
          style={{
            display: 'block',
            marginBottom: '6px',
            fontSize: '14px',
            fontWeight: 600,
            color: '#374151',
          }}
        >
          Email
        </label>
        <input
          type="email"
          value={user.email}
          readOnly
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            fontSize: '14px',
            background: '#f8fafc',
            color: '#0f172a',
            cursor: 'default',
            boxSizing: 'border-box',
          }}
        />
      </div>
    </div>
  )
}
