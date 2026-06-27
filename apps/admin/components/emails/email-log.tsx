type EmailLogProps = {
  message: string
}

export function EmailLog({ message }: EmailLogProps) {
  if (!message) return null

  return (
    <div
      style={{
        marginTop: '16px',
        padding: '12px 16px',
        background: '#f1f5f9',
        border: '1px solid #e2e8f0',
        borderRadius: '6px',
        fontSize: '14px',
        color: '#0f172a',
      }}
    >
      {message}
    </div>
  )
}
