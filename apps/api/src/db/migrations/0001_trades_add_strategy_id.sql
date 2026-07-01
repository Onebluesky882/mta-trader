-- One-time patch for databases created before strategy_config existed.
-- Fresh databases already get this column via schema.sql's CREATE TABLE trades.
-- Not idempotent (SQLite has no ADD COLUMN IF NOT EXISTS) — run once per DB.
--
-- Apply with:
--   wrangler d1 execute DB --local  --file=src/db/migrations/0001_trades_add_strategy_id.sql
--   wrangler d1 execute DB --remote --file=src/db/migrations/0001_trades_add_strategy_id.sql
--
-- Already applied: local dev DB (2026-07-01). Remote: not yet applied.

ALTER TABLE trades ADD COLUMN strategy_id TEXT REFERENCES strategy_config(id);
CREATE INDEX IF NOT EXISTS idx_trades_strategy_id ON trades(strategy_id);
