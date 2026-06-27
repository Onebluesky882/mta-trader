'use client'

const TOOL_LABELS: Record<string, string> = {
  bash: 'Running command',
  read: 'Reading file',
  write: 'Writing file',
  edit: 'Editing file',
  glob: 'Searching files',
  grep: 'Searching content',
  web_search: 'Searching the web',
  web_fetch: 'Fetching URL',
}

type Props = {
  tool: string | null
}

export function ToolIndicator({ tool }: Props) {
  if (!tool) return null

  const label = TOOL_LABELS[tool] ?? `Using ${tool}`

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        background: '#f0f9ff',
        border: '1px solid #bae6fd',
        borderRadius: '6px',
        fontSize: '13px',
        color: '#0369a1',
        margin: '8px 0',
      }}
    >
      {/* Spinner */}
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }}
      >
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
      <span>{label}...</span>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
