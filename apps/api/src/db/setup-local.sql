-- ============================================================
-- mta-trader local dev setup
-- Apply with: npx wrangler d1 execute DB --local --file=src/db/setup-local.sql
-- ============================================================

-- better-auth: user (with role column)
CREATE TABLE IF NOT EXISTS `user` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `email` text NOT NULL UNIQUE,
  `email_verified` integer NOT NULL DEFAULT 0,
  `image` text,
  `role` text NOT NULL DEFAULT 'member',
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);

-- better-auth: session
CREATE TABLE IF NOT EXISTS `session` (
  `id` text PRIMARY KEY NOT NULL,
  `expires_at` integer NOT NULL,
  `token` text NOT NULL UNIQUE,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL,
  `ip_address` text,
  `user_agent` text,
  `user_id` text NOT NULL REFERENCES `user`(`id`) ON DELETE CASCADE
);

-- better-auth: account (stores bcrypt password)
CREATE TABLE IF NOT EXISTS `account` (
  `id` text PRIMARY KEY NOT NULL,
  `account_id` text NOT NULL,
  `provider_id` text NOT NULL,
  `user_id` text NOT NULL REFERENCES `user`(`id`) ON DELETE CASCADE,
  `access_token` text,
  `refresh_token` text,
  `id_token` text,
  `access_token_expires_at` integer,
  `refresh_token_expires_at` integer,
  `scope` text,
  `password` text,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);

-- better-auth: verification
CREATE TABLE IF NOT EXISTS `verification` (
  `id` text PRIMARY KEY NOT NULL,
  `identifier` text NOT NULL,
  `value` text NOT NULL,
  `expires_at` integer NOT NULL,
  `created_at` integer,
  `updated_at` integer
);

-- mta-trader: users (separate — for role tracking)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- mta-trader: trades
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

-- mta-trader: algorithm_settings
CREATE TABLE IF NOT EXISTS algorithm_settings (
  id TEXT PRIMARY KEY,
  version INTEGER NOT NULL DEFAULT 1,
  params TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- mta-trader: optimize_snapshots
CREATE TABLE IF NOT EXISTS optimize_snapshots (
  id TEXT PRIMARY KEY,
  version INTEGER NOT NULL,
  params TEXT NOT NULL,
  result TEXT NOT NULL,
  label TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- mta-trader: bot_status (singleton row — upserted by MT5 heartbeat)
CREATE TABLE IF NOT EXISTS bot_status (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  last_seen TEXT NOT NULL
);
