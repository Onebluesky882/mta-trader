import { z } from 'zod'

export const presignUploadSchema = z.object({
  key: z.string().min(1),
  contentType: z.string().min(1),
  expiresIn: z.number().int().min(60).max(3600).default(300),
})

export const presignDownloadSchema = z.object({
  key: z.string().min(1),
  expiresIn: z.number().int().min(60).max(604800).default(3600),
})

export const deleteFileSchema = z.object({
  key: z.string().min(1),
})
