'use client'
import { useCallback, useEffect, useState } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL ?? ''

export type FileItem = {
  key: string
  size?: number
  lastModified?: Date
}

type StorageHook = {
  files: FileItem[]
  isLoading: boolean
  isUploading: boolean
  fetchFiles: () => Promise<void>
  uploadFile: (file: File) => Promise<void>
  deleteFile: (key: string) => Promise<void>
  downloadFile: (key: string) => Promise<void>
}

export function useStorage(): StorageHook {
  const [files, setFiles] = useState<FileItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)

  const fetchFiles = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`${API}/api/storage/files`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        const raw: Array<{ key: string; size?: number; lastModified?: string }> =
          data?.files ?? data ?? []
        const items: FileItem[] = raw.map((f) => ({
          key: f.key,
          size: f.size,
          lastModified: f.lastModified ? new Date(f.lastModified) : undefined,
        }))
        setFiles(items)
      }
    } catch {
      // leave files as-is on error
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchFiles()
  }, [fetchFiles])

  const uploadFile = useCallback(
    async (file: File) => {
      setIsUploading(true)
      try {
        const presignRes = await fetch(`${API}/api/storage/presign/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ key: file.name, contentType: file.type }),
        })
        if (!presignRes.ok) throw new Error('Failed to get presigned URL')
        const { url } = (await presignRes.json()) as { url: string }

        const putRes = await fetch(url, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type },
        })
        if (!putRes.ok) throw new Error('Upload to R2 failed')

        await fetchFiles()
      } finally {
        setIsUploading(false)
      }
    },
    [fetchFiles]
  )

  const deleteFile = useCallback(
    async (key: string) => {
      const res = await fetch(`${API}/api/storage/file`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ key }),
      })
      if (!res.ok) throw new Error('Delete failed')
      await fetchFiles()
    },
    [fetchFiles]
  )

  const downloadFile = useCallback(async (key: string) => {
    const res = await fetch(`${API}/api/storage/presign/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ key }),
    })
    if (!res.ok) throw new Error('Failed to get download URL')
    const { url } = (await res.json()) as { url: string }
    window.open(url, '_blank')
  }, [])

  return { files, isLoading, isUploading, fetchFiles, uploadFile, deleteFile, downloadFile }
}
