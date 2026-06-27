import { z } from 'zod'

export const saveSetupSchema = z.object({
  language: z.string().min(1),
  businessName: z.string().min(1),
  businessDescription: z.string().optional(),
  targetCustomers: z.string().optional(),
  websiteFeatures: z.array(z.string()).optional(),
  needsAdminPanel: z.string().optional(),
  onlinePayments: z.string().optional(),
  preferredStyle: z.string().optional(),
  websitePages: z.array(z.string()).optional(),
  timeline: z.string().optional(),
})
