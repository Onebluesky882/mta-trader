CREATE TABLE IF NOT EXISTS setup_submissions (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  language TEXT NOT NULL,
  business_name TEXT NOT NULL,
  business_description TEXT,
  target_customers TEXT,
  website_features TEXT,
  needs_admin_panel TEXT,
  online_payments TEXT,
  preferred_style TEXT,
  website_pages TEXT,
  timeline TEXT,
  submitted_at INTEGER NOT NULL
);
