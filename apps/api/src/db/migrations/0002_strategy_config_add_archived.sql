-- One-time patch for databases created before the archive feature existed.
-- Fresh databases already get this column via schema.sql's CREATE TABLE strategy_config.
-- Not idempotent (SQLite has no ADD COLUMN IF NOT EXISTS) — run once per DB.
--
-- Apply with:
--   wrangler d1 execute DB --local  --file=src/db/migrations/0002_strategy_config_add_archived.sql
--   wrangler d1 execute DB --remote --file=src/db/migrations/0002_strategy_config_add_archived.sql

ALTER TABLE strategy_config ADD COLUMN archived INTEGER NOT NULL DEFAULT 0;
