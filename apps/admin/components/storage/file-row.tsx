import type { FileItem } from '@/hooks/use-storage'

type FileRowProps = {
  file: FileItem
  onDelete: (key: string) => void
  onDownload: (key: string) => void
}

function formatBytes(bytes?: number): string {
  if (bytes === undefined) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function FileRow({ file, onDelete, onDownload }: FileRowProps) {
  const name = file.key.split('/').pop() ?? file.key

  return (
    <tr style={{ borderTop: '1px solid #e2e8f0' }}>
      <td style={{ padding: '12px 16px' }}>{name}</td>
      <td style={{ padding: '12px 16px', color: '#64748b' }}>{formatBytes(file.size)}</td>
      <td style={{ padding: '12px 16px', color: '#64748b' }}>
        {file.lastModified ? file.lastModified.toLocaleDateString() : '—'}
      </td>
      <td style={{ padding: '12px 16px' }}>
        <button
          onClick={() => onDownload(file.key)}
          style={{
            marginRight: '8px',
            padding: '4px 10px',
            fontSize: '13px',
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Download
        </button>
        <button
          onClick={() => onDelete(file.key)}
          style={{
            padding: '4px 10px',
            fontSize: '13px',
            background: '#dc2626',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Delete
        </button>
      </td>
    </tr>
  )
}
