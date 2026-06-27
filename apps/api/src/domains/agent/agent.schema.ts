import { z } from 'zod'

export const createVaultSchema = z.object({
  githubPat: z.string().min(1),
  githubRepoUrl: z.string().url(),
})

export const createSessionSchema = z.object({
  githubRepoUrl: z.string().url(),
  vaultId: z.string().min(1),
})

export const sendMessageSchema = z.object({
  sessionId: z.string().min(1),
  message: z.string().min(1),
})

export const streamQuerySchema = z.object({
  sessionId: z.string().min(1),
})

export const filesQuerySchema = z.object({
  sessionId: z.string().min(1),
})

export const deployNotifySchema = z.object({
  sessionId: z.string().min(1),
  siteUrl: z.string().url(),
})

export const deployCompleteSchema = z.object({
  workerName: z.string().optional(),
})

export const deployStatusQuerySchema = z.object({
  sessionId: z.string().min(1),
})
