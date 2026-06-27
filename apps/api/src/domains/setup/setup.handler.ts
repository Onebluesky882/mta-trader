import type { z } from 'zod'
import type { saveSetupSchema } from './setup.schema'

type SetupData = z.infer<typeof saveSetupSchema>

export async function saveSetup(db: D1Database, data: SetupData): Promise<string> {
  const id = crypto.randomUUID()

  await db
    .prepare(
      `INSERT INTO setup_submissions (
        id, language, business_name, business_description, target_customers,
        website_features, needs_admin_panel, online_payments,
        preferred_style, website_pages, timeline, submitted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      data.language,
      data.businessName,
      data.businessDescription ?? null,
      data.targetCustomers ?? null,
      data.websiteFeatures ? JSON.stringify(data.websiteFeatures) : null,
      data.needsAdminPanel ?? null,
      data.onlinePayments ?? null,
      data.preferredStyle ?? null,
      data.websitePages ? JSON.stringify(data.websitePages) : null,
      data.timeline ?? null,
      Date.now(),
    )
    .run()

  return id
}
