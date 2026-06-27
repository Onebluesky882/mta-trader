import { z } from 'zod'

export const sendNotificationSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  message: z.string().min(1),
})

export const sendWelcomeSchema = z.object({
  to: z.string().email(),
  name: z.string().min(1),
})
