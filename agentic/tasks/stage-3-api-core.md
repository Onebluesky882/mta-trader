# Dispatch-In: stage-3-api-core

**Stage ID:** stage-3-api-core
**Domain:** apps/api
**Branch:** stage-3-api-core
**Gate-In Verified:** YES

---

## Mission

สร้าง Hono API backend ที่รันบน Cloudflare Workers — implement ทุก endpoint ตาม CONTRACTS.md พร้อม D1 database schema ครบ

---

## Context

- Backend: **Hono** บน Cloudflare Workers
- Database: **Cloudflare D1** (SQLite)
- Auth: import `authMiddleware` จาก `packages/auth`
- ทุก route ที่ต้อง auth ใช้ Bearer token — ดู CONTRACTS.md
- stage นี้ implement **data layer** เท่านั้น — ไม่มี UI

---

## Deliverables

### 1. โครงสร้าง apps/api

```
apps/api/
├── src/
│   ├── index.ts           # Hono app entry point
│   ├── db/
│   │   ├── schema.sql     # D1 schema ทั้งหมด
│   │   └── client.ts      # D1 helper
│   └── routes/
│       ├── auth.ts        # POST /api/auth/login (จาก stage-2)
│       ├── dashboard.ts   # GET /api/dashboard
│       ├── trades.ts      # GET /api/trades
│       ├── settings.ts    # GET + PUT /api/settings
│       └── optimize.ts    # GET + POST /api/optimize
├── wrangler.toml
└── package.json
```

### 2. D1 Database Schema (schema.sql)

```sql
-- users (จาก stage-2)
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

-- optimize_snapshots
CREATE TABLE IF NOT EXISTS optimize_snapshots (
  id TEXT PRIMARY KEY,
  version INTEGER NOT NULL,
  params TEXT NOT NULL,     -- JSON string
  result TEXT NOT NULL,     -- JSON string
  label TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### 3. Hono App (index.ts)

```ts
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { authRouter } from './routes/auth'
import { dashboardRouter } from './routes/dashboard'
import { tradesRouter } from './routes/trades'
import { settingsRouter } from './routes/settings'
import { optimizeRouter } from './routes/optimize'

const app = new Hono()
app.use('*', cors())
app.route('/api/auth', authRouter)
app.route('/api/dashboard', dashboardRouter)    // protected
app.route('/api/trades', tradesRouter)          // protected
app.route('/api/settings', settingsRouter)      // protected
app.route('/api/optimize', optimizeRouter)      // protected
```

### 4. Routes — ตาม CONTRACTS.md

**GET /api/dashboard**
- return: `{ botStatus, openTrades, todayPnL, totalPnL, winRate, lastUpdated }`
- query D1: count OPEN trades, sum profit WHERE close_time = today, sum profit ทั้งหมด

**GET /api/trades**
- query params: `page`, `limit`, `from`, `to`
- return: `{ trades[], total, page, limit }`
- pagination ด้วย LIMIT + OFFSET

**GET /api/settings**
- return: row ล่าสุดจาก `algorithm_settings`
- ถ้าไม่มี record → insert default row

**PUT /api/settings**
- รับ `{ params: Record<string, ...> }`
- update row + bump version
- return: updated settings

**GET /api/optimize**
- return: `{ snapshots[] }` — เรียง created_at DESC

**POST /api/optimize**
- รับ `{ params, result, label? }`
- insert snapshot + auto-increment version
- return: created snapshot

### 5. Error Format (ทุก route)

```ts
// 401
return c.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, 401)

// 400
return c.json({ error: 'Invalid parameters', code: 'INVALID_PARAMS' }, 400)

// 500
return c.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, 500)
```

### 6. Unit Tests

`apps/api/src/routes/*.test.ts` สำหรับแต่ละ route:
- happy path (200)
- unauthorized (401)
- invalid params (400)

ใช้ Hono test helpers + Vitest

---

## Acceptance Criteria

- [ ] `pnpm build` (apps/api) ผ่าน TypeScript compile
- [ ] `pnpm test` unit tests ผ่านทั้งหมด
- [ ] ทุก endpoint ใน CONTRACTS.md มี route รองรับ
- [ ] ทุก protected route return 401 ถ้าไม่มี Bearer token
- [ ] D1 schema สร้างได้ด้วย `wrangler d1 execute`
- [ ] ไม่มี route ที่ไม่ได้กำหนดใน CONTRACTS.md

---

## Rules

- ห้าม expose route ที่ไม่ได้กำหนดใน CONTRACTS.md
- ทุก protected route ต้อง apply `authMiddleware` ก่อน handler
- params ใน D1 ต้อง store เป็น JSON string — parse/stringify เมื่อ read/write
- ห้าม commit secrets หรือ `wrangler.toml` ที่มี database_id จริง (ใช้ PLACEHOLDER)
- verify package versions ก่อน install

---

## Gate-Out

เมื่อเสร็จแล้ว สร้าง `agentic/gate-out/stage-3-api-core.md` และ STOP
