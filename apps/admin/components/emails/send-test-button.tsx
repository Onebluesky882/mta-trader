type SendTestButtonProps = {
  onSend: () => void
  isLoading: boolean
}

export function SendTestButton({ onSend, isLoading }: SendTestButtonProps) {
  return (
    <button
      onClick={onSend}
      disabled={isLoading}
      style={{
        padding: '8px 20px',
        background: isLoading ? '#94a3b8' : '#2563eb',
        color: '#ffffff',
        border: 'none',
        borderRadius: '6px',
        cursor: isLoading ? 'not-allowed' : 'pointer',
        fontSize: '14px',
      }}
    >
      {isLoading ? 'Sending...' : 'Send Test Email'}
    </button>
  )
}
