import type { FileItem } from '@/hooks/use-storage'
import { FileRow } from './file-row'

type FileListProps = {
  files: FileItem[]
  onDelete: (key: string) => void
  onDownload: (key: string) => void
}

export function FileList({ files, onDelete, onDownload }: FileListProps) {
  if (files.length === 0) {
    return (
      <p style={{ color: '#64748b', marginTop: '16px' }}>No files found in storage.</p>
    )
  }

  return (
    <table
      style={{
        width: '100%',
        borderCollapse: 'collapse',
        background: '#ffffff',
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid #e2e8f0',
      }}
    >
      <thead>
        <tr style={{ background: '#f1f5f9' }}>
          {['File Name', 'Size', 'Last Modified', 'Actions'].map((col) => (
            <th
              key={col}
              style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontSize: '13px',
                color: '#64748b',
                fontWeight: 600,
              }}
            >
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {files.map((file) => (
          <FileRow key={file.key} file={file} onDelete={onDelete} onDownload={onDownload} />
        ))}
      </tbody>
    </table>
  )
}
