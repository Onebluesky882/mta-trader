'use client'
import { useStorage } from '@/hooks/use-storage'
import { FileList } from '@/components/storage/file-list'
import { UploadButton } from '@/components/storage/upload-button'

export default function StoragePage() {
  const { files, isLoading, isUploading, uploadFile, deleteFile, downloadFile } = useStorage()

  if (isLoading) {
    return (
      <div>
        <h1 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: 700 }}>Storage</h1>
        <p style={{ color: '#64748b' }}>Loading files...</p>
      </div>
    )
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
        }}
      >
        <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>Storage</h1>
        <UploadButton onFileSelect={uploadFile} isUploading={isUploading} />
      </div>
      <FileList files={files} onDelete={deleteFile} onDownload={downloadFile} />
    </div>
  )
}
