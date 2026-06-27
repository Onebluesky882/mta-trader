import { Hono } from 'hono'
import { presignUploadSchema, presignDownloadSchema, deleteFileSchema } from './storage.schema'
import { generateUploadUrl, generateDownloadUrl, deleteFile, listFiles } from './storage.handler'

type Bindings = {
  DB: D1Database
  RESEND_API_KEY: string
  R2_ACCOUNT_ID: string
  R2_ACCESS_KEY_ID: string
  R2_SECRET_ACCESS_KEY: string
  R2_BUCKET_NAME: string
  BUCKET: R2Bucket
}

const storageRouter = new Hono<{ Bindings: Bindings }>()

function getR2Config(env: Bindings) {
  return {
    accountId: env.R2_ACCOUNT_ID,
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    bucketName: env.R2_BUCKET_NAME,
  }
}

// Generate presigned URL for direct client upload to R2
storageRouter.post('/presign/upload', async (c) => {
  const body = await c.req.json()
  const parsed = presignUploadSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Invalid request' }, 400)
  const { key, contentType, expiresIn } = parsed.data
  const result = await generateUploadUrl(getR2Config(c.env), key, contentType, expiresIn)
  return c.json(result)
})

// Generate presigned URL for direct client download from R2
storageRouter.post('/presign/download', async (c) => {
  const body = await c.req.json()
  const parsed = presignDownloadSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Invalid request' }, 400)
  const { key, expiresIn } = parsed.data
  const result = await generateDownloadUrl(getR2Config(c.env), key, expiresIn)
  return c.json(result)
})

// Delete a file via native R2 binding
storageRouter.delete('/file', async (c) => {
  const body = await c.req.json()
  const parsed = deleteFileSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Invalid request' }, 400)
  await c.env.BUCKET.delete(parsed.data.key)
  return c.json({ deleted: parsed.data.key })
})

// List files via native R2 binding (no DOMParser needed)
storageRouter.get('/files', async (c) => {
  const prefix = c.req.query('prefix') ?? undefined
  try {
    const listed = await c.env.BUCKET.list({ prefix })
    const files = listed.objects.map((o) => ({
      key: o.key,
      size: o.size,
      lastModified: o.uploaded,
    }))
    return c.json({ files })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return c.json({ error: msg, files: [] }, 500)
  }
})

export { storageRouter }
