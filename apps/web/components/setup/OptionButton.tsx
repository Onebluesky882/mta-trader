type Props = {
  label: string
  value: string
  selected: boolean
  color?: string
  onClick: (value: string) => void
}

export function OptionButton({ label, value, selected, color, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '12px 20px',
        border: selected ? '2px solid #2563EB' : '2px solid #E5E7EB',
        borderRadius: '8px',
        backgroundColor: selected ? '#EFF6FF' : '#fff',
        cursor: 'pointer',
        fontSize: '15px',
        fontWeight: selected ? 600 : 400,
        color: selected ? '#1D4ED8' : '#374151',
        transition: 'all 0.15s ease',
        textAlign: 'left',
        width: '100%',
      }}
    >
      {color !== undefined && (
        <span
          style={{
            display: 'inline-block',
            width: '22px',
            height: '22px',
            borderRadius: '50%',
            backgroundColor: color,
            border: '1px solid #D1D5DB',
            flexShrink: 0,
          }}
        />
      )}
      {label}
    </button>
  )
}
