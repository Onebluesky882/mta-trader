type StatCardProps = {
  label: string
  value: string
  status?: 'ok' | 'error'
}

export function StatCard({ label, value, status }: StatCardProps) {
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '20px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          color: '#64748b',
          fontSize: '14px',
          marginBottom: '8px',
        }}
      >
        {status !== undefined && (
          <span
            style={{
              display: 'inline-block',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: status === 'ok' ? '#16a34a' : '#dc2626',
              flexShrink: 0,
            }}
          />
        )}
        {label}
      </div>
      <div style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>{value}</div>
    </div>
  )
}
