type Props = {
  current: number
  total: number
}

export function ProgressBar({ current, total }: Props) {
  const percent = Math.min(100, Math.round((current / total) * 100))

  return (
    <div style={{ width: '100%', marginBottom: '24px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '8px',
          fontSize: '14px',
          color: '#666',
        }}
      >
        <span>Step {current} of {total}</span>
        <span>{percent}%</span>
      </div>
      <div
        style={{
          width: '100%',
          height: '6px',
          backgroundColor: '#E5E7EB',
          borderRadius: '999px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${percent}%`,
            height: '100%',
            backgroundColor: '#2563EB',
            borderRadius: '999px',
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  )
}
