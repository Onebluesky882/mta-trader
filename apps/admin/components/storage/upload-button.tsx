import { useRef } from 'react'

type UploadButtonProps = {
  onFileSelect: (file: File) => void
  isUploading: boolean
}

export function UploadButton({ onFileSelect, isUploading }: UploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      onFileSelect(file)
      // reset input so same file can be re-selected
      e.target.value = ''
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        style={{ display: 'none' }}
        onChange={handleChange}
        disabled={isUploading}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        style={{
          padding: '8px 20px',
          background: isUploading ? '#94a3b8' : '#2563eb',
          color: '#ffffff',
          border: 'none',
          borderRadius: '6px',
          cursor: isUploading ? 'not-allowed' : 'pointer',
          fontSize: '14px',
        }}
      >
        {isUploading ? 'Uploading...' : 'Upload File'}
      </button>
    </>
  )
}
