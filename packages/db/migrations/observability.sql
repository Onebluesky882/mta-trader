CREATE TABLE IF NOT EXISTS agent_logs (
  id TEXT PRIMARY KEY,
  correlation_id TEXT NOT NULL,
  user_id TEXT,
  session_id TEXT,
  agent_id TEXT,
  input_preview TEXT,
  output_preview TEXT,
  tool_calls TEXT,
  tokens_input INTEGER DEFAULT 0,
  tokens_output INTEGER DEFAULT 0,
  latency_ms INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'success',
  error_message TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_agent_logs_user ON agent_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_logs_correlation ON agent_logs(correlation_id);
