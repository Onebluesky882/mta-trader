CREATE TABLE IF NOT EXISTS agent_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  session_id TEXT,
  vault_id TEXT,
  github_repo_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'vault_created',
  created_at INTEGER NOT NULL
);
