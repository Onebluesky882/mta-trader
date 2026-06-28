# Gate-Out: stage-8-mt5-bridge

**Stage ID:** stage-8-mt5-bridge
**Domain:** apps/api
**Status:** PASS
**Date:** 2026-06-28

---

## Deliverables Completed

- `apps/api/src/routes/mt5.ts` — MT5 webhook routes (trade-open, trade-close, heartbeat)
- `apps/api/src/routes/mt5.test.ts` — 8 unit tests, all passing
- `apps/api/src/routes/dashboard.ts` — updated: botStatus from `bot_status` table (stale after 5 min)
- `apps/api/src/routes/dashboard.test.ts` — updated: mock 4th `first()` for bot_status
- `apps/api/src/index.ts` — registered `mt5Router` at `/api/mt5`, added `MT5_WEBHOOK_SECRET` binding
- `apps/api/wrangler.toml` — added `# MT5_WEBHOOK_SECRET` to secrets comment
- `apps/api/src/db/setup-local.sql` — added `bot_status` table
- `docs/mt5-ea-template.mq5` — MQL5 EA template with trade-open, trade-close, heartbeat

## Routes Implemented

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/mt5/trade-open` | X-MT5-Secret | Insert OPEN trade |
| POST | `/api/mt5/trade-close` | X-MT5-Secret | Update trade to CLOSED |
| POST | `/api/mt5/heartbeat` | X-MT5-Secret | Upsert bot_status singleton |

## Authentication

- Uses `X-MT5-Secret` header matched against `MT5_WEBHOOK_SECRET` Cloudflare secret
- Returns 401 if missing or wrong
- No Bearer token — MQL5 WebRequest doesn't support auth libraries

## Dashboard Update

- `GET /api/dashboard` now reads botStatus from `bot_status` table
- If `last_seen` > 5 minutes ago → `botStatus = 'STOPPED'`
- If no record → `botStatus = 'STOPPED'`

## Test Results

```
Tests  39 passed (39)   ← all pass including 8 new mt5 tests
```

## Acceptance Criteria

- [x] POST /api/mt5/trade-open inserts trade in D1
- [x] POST /api/mt5/trade-close updates trade status
- [x] POST /api/mt5/heartbeat updates bot_status
- [x] Dashboard botStatus reads from bot_status table
- [x] All routes return 401 without/wrong X-MT5-Secret
- [x] 8 unit tests pass (auth guard, trade-open, trade-close, heartbeat)
- [x] docs/mt5-ea-template.mq5 exists with full MQL5 code
- [x] MT5_WEBHOOK_SECRET is wrangler secret (not hardcoded)
- [x] pnpm type-check passes

---

**Ready For Next Stage:** YES (all planned stages complete)
**Submitted By:** Worker Agent (stage-8-mt5-bridge)
**Stop Condition:** STOPPED — awaiting `merge-approval/stage-8-mt5-bridge.md`
