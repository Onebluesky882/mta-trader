-- users (from stage-2)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- trades (multi-user)
-- strategy_id: added to existing DBs via migrations/0001_trades_add_strategy_id.sql
-- (kept here too so a fresh database gets it directly via CREATE TABLE)
CREATE TABLE IF NOT EXISTS trades (
  id TEXT PRIMARY KEY,
  symbol TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('BUY', 'SELL')),
  open_price REAL NOT NULL,
  close_price REAL,
  open_time TEXT NOT NULL,
  close_time TEXT,
  profit REAL,
  volume REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED')),
  user_id TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  strategy_id TEXT REFERENCES strategy_config(id)
);

-- algorithm_settings (multi-user)
CREATE TABLE IF NOT EXISTS algorithm_settings (
  id TEXT PRIMARY KEY,
  version INTEGER NOT NULL DEFAULT 1,
  params TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  user_id TEXT NOT NULL DEFAULT ''
);

-- ai_config (multi-user)
CREATE TABLE IF NOT EXISTS ai_config (
  id TEXT PRIMARY KEY,
  params TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  user_id TEXT NOT NULL DEFAULT ''
);

-- optimize_snapshots (multi-user)
CREATE TABLE IF NOT EXISTS optimize_snapshots (
  id TEXT PRIMARY KEY,
  version INTEGER NOT NULL,
  params TEXT NOT NULL,
  result TEXT NOT NULL,
  label TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  user_id TEXT NOT NULL DEFAULT ''
);

-- bot_status (multi-user)
CREATE TABLE IF NOT EXISTS bot_status (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'STOPPED',
  last_seen TEXT NOT NULL DEFAULT (datetime('now')),
  user_id TEXT NOT NULL DEFAULT ''
);

-- ai_signals (multi-user)
CREATE TABLE IF NOT EXISTS ai_signals (
  id TEXT PRIMARY KEY,
  symbol TEXT NOT NULL,
  signal TEXT NOT NULL,
  confidence INTEGER NOT NULL DEFAULT 50,
  reason TEXT NOT NULL DEFAULT '',
  sl REAL,
  tp REAL,
  price REAL,
  h4_analysis TEXT NOT NULL DEFAULT '{}',
  h1_analysis TEXT NOT NULL DEFAULT '{}',
  analyzed_at TEXT NOT NULL DEFAULT (datetime('now')),
  user_id TEXT NOT NULL DEFAULT ''
);

-- user_api_keys — personal MT5 API key per user
CREATE TABLE IF NOT EXISTS user_api_keys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  api_key TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- strategy_config — client-authored strategy text + AI-parsed trading rules
-- user_id references the better-auth `user` table (session/account/user/verification,
-- managed by packages/auth's drizzle schema) — NOT the legacy `users` table above,
-- which nothing in apps/api actually reads or writes to anymore.
-- archived: added to existing DBs via migrations/0002_strategy_config_add_archived.sql
-- (kept here too so a fresh database gets it directly via CREATE TABLE)
CREATE TABLE IF NOT EXISTS strategy_config (
  id TEXT PRIMARY KEY,
  raw_text TEXT NOT NULL,
  params TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 0,
  archived INTEGER NOT NULL DEFAULT 0,
  user_id TEXT NOT NULL REFERENCES `user`(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_strategy_config_user ON strategy_config(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_strategy_id ON trades(strategy_id);
