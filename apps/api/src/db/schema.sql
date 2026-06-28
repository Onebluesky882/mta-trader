-- users (from stage-2)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- trades
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
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- algorithm_settings
CREATE TABLE IF NOT EXISTS algorithm_settings (
  id TEXT PRIMARY KEY,
  version INTEGER NOT NULL DEFAULT 1,
  params TEXT NOT NULL,  -- JSON string
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ai_config
CREATE TABLE IF NOT EXISTS ai_config (
  id TEXT PRIMARY KEY DEFAULT 'singleton',
  params TEXT NOT NULL,  -- JSON string
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- optimize_snapshots
CREATE TABLE IF NOT EXISTS optimize_snapshots (
  id TEXT PRIMARY KEY,
  version INTEGER NOT NULL,
  params TEXT NOT NULL,     -- JSON string
  result TEXT NOT NULL,     -- JSON string
  label TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
