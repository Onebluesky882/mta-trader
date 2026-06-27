ALTER TABLE agent_sessions ADD COLUMN deploy_status TEXT NOT NULL DEFAULT 'idle';
ALTER TABLE agent_sessions ADD COLUMN site_url TEXT;
ALTER TABLE agent_sessions ADD COLUMN pushed_at INTEGER;
ALTER TABLE agent_sessions ADD COLUMN deployed_at INTEGER;
