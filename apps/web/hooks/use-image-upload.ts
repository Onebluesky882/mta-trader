'use client'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://fullstack-builder-api.onebluesky882.workers.dev'

async function convertToWebP(file: File, maxWidth = 1200, quality = 0.85): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width)
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(url)
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Conversion failed')), 'image/webp', quality)
    }
    img.onerror = () => reject(new Error('Image load failed'))
    img.src = url
  })
}

export async function uploadForumImage(file: File, folder = 'forum'): Promise<string> {
  const key = `${folder}/${crypto.randomUUID()}.webp`

  // Convert to WebP
  const webpBlob = await convertToWebP(file)

  // Get presigned upload URL
  const uploadRes = await fetch(`${API}/api/storage/presign/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ key, contentType: 'image/webp', expiresIn: 300 }),
  })
  if (!uploadRes.ok) throw new Error('Failed to get upload URL')
  const { url: uploadUrl } = await uploadRes.json() as { url: string; key: string }

  // Upload directly to R2
  const putRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'image/webp' },
    body: webpBlob,
  })
  if (!putRes.ok) throw new Error('Upload to R2 failed')

  // Get presigned download URL (7 days)
  const downloadRes = await fetch(`${API}/api/storage/presign/download`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ key, expiresIn: 604800 }),
  })
  if (!downloadRes.ok) throw new Error('Failed to get download URL')
  const { url: downloadUrl } = await downloadRes.json() as { url: string }

  return downloadUrl
}
