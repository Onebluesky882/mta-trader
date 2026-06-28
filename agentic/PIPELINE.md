# PIPELINE.md

Status: PLANNING
Owner: CONDUCTOR
Conductor Branch: main

---

## Stage Overview

| Stage | Domain | Depends On | Status |
|-------|--------|------------|--------|
| stage-1-setup | root | none | DONE |
| stage-2-auth | packages/auth | stage-1-setup | DONE |
| stage-3-api-core | apps/api | stage-2-auth | DONE |
| stage-4-web-dashboard | apps/web | stage-3-api-core | IN_PROGRESS |
| stage-5-web-log | apps/web | stage-4-web-dashboard | IN_PROGRESS |
| stage-6-web-settings | apps/web | stage-4-web-dashboard | IN_PROGRESS |
| stage-7-web-optimize | apps/web | stage-6-web-settings | IN_PROGRESS |
| stage-8-mt5-bridge | apps/api | stage-3-api-core | PLANNING |

---

## Stage Detail

### stage-1-setup

**Domain:** root
**Depends On:** none
**Status:** `DONE`

**Acceptance Criteria:**
- [ ] pnpm workspace configured (apps/web, apps/api, packages/auth)
- [ ] Biome linting/formatting configured
- [ ] TypeScript configured across all packages
- [ ] Vitest configured for unit tests
- [ ] Playwright configured for e2e tests
- [ ] Base Cloudflare wrangler.toml for apps/api

**Dispatch-In:** `tasks/stage-1-setup.md`
**Gate-Out:** `gate-out/stage-1-setup.md`
**Merge-Approval:** `merge-approval/stage-1-setup.md`

---

### stage-2-auth

**Domain:** packages/auth
**Depends On:** stage-1-setup
**Status:** `DONE`

**Acceptance Criteria:**
- [ ] Bearer token generation and validation
- [ ] Login endpoint (`POST /api/auth/login`) per CONTRACTS.md
- [ ] Auth middleware for protected routes
- [ ] owner_email (wansing05@gmail.com) set to role = 'owner' in DB

**Dispatch-In:** `tasks/stage-2-auth.md`
**Gate-Out:** `gate-out/stage-2-auth.md`
**Merge-Approval:** `merge-approval/stage-2-auth.md`

---

### stage-3-api-core

**Domain:** apps/api
**Depends On:** stage-2-auth
**Status:** `DONE`

**Acceptance Criteria:**
- [ ] Hono app wired on Cloudflare Workers
- [ ] D1 database schema created (trades, settings, optimize_snapshots, users)
- [ ] All routes defined in CONTRACTS.md implemented
- [ ] Auth middleware applied to all protected routes
- [ ] Unit tests pass

**Dispatch-In:** `tasks/stage-3-api-core.md`
**Gate-Out:** `gate-out/stage-3-api-core.md`
**Merge-Approval:** `merge-approval/stage-3-api-core.md`

---

### stage-4-web-dashboard

**Domain:** apps/web
**Depends On:** stage-3-api-core
**Status:** `IN_PROGRESS`

**Acceptance Criteria:**
- [ ] Next.js app initialized on Cloudflare Pages
- [ ] Dashboard page (`/`) — bot status, open trades, today P&L, total P&L, win rate
- [ ] Navbar with logo linking to `/`
- [ ] TanStack Query wired for data fetching
- [ ] Zustand wired for client state
- [ ] apiFetch (Bearer token) used for all API calls

**Dispatch-In:** `tasks/stage-4-web-dashboard.md`
**Gate-Out:** `gate-out/stage-4-web-dashboard.md`
**Merge-Approval:** `merge-approval/stage-4-web-dashboard.md`

---

### stage-5-web-log

**Domain:** apps/web
**Depends On:** stage-4-web-dashboard
**Status:** `PLANNING`

**Acceptance Criteria:**
- [ ] Trade Log page (`/log`) with pagination and date filter
- [ ] Back button on `/log`
- [ ] Data fetched from `GET /api/trades`

**Dispatch-In:** `tasks/stage-5-web-log.md`
**Gate-Out:** `gate-out/stage-5-web-log.md`
**Merge-Approval:** `merge-approval/stage-5-web-log.md`

---

### stage-6-web-settings

**Domain:** apps/web
**Depends On:** stage-4-web-dashboard
**Status:** `PLANNING`

**Acceptance Criteria:**
- [ ] Algorithm Settings page (`/settings`)
- [ ] Form to view and update algorithm parameters
- [ ] Back button on `/settings`
- [ ] PUT /api/settings called via apiFetch

**Dispatch-In:** `tasks/stage-6-web-settings.md`
**Gate-Out:** `gate-out/stage-6-web-settings.md`
**Merge-Approval:** `merge-approval/stage-6-web-settings.md`

---

### stage-7-web-optimize

**Domain:** apps/web
**Depends On:** stage-6-web-settings
**Status:** `PLANNING`

**Acceptance Criteria:**
- [ ] Optimize page (`/optimize`) — เปรียบเทียบ config versions
- [ ] Optimize History page (`/optimize/history`) — ประวัติการแก้ไขพร้อม diff และผลลัพธ์
- [ ] Back buttons on both pages
- [ ] Data fetched from `GET /api/optimize`

**Dispatch-In:** `tasks/stage-7-web-optimize.md`
**Gate-Out:** `gate-out/stage-7-web-optimize.md`
**Merge-Approval:** `merge-approval/stage-7-web-optimize.md`

---

### stage-8-mt5-bridge

**Domain:** apps/api
**Depends On:** stage-3-api-core
**Status:** `PLANNING`

**Acceptance Criteria:**
- [ ] Bridge layer รับ signal จาก MT5 (MQL5 webhook หรือ Python script)
- [ ] Signal validated และ stored ใน D1
- [ ] Trade status updated จาก MT5 events

**Dispatch-In:** `tasks/stage-8-mt5-bridge.md`
**Gate-Out:** `gate-out/stage-8-mt5-bridge.md`
**Merge-Approval:** `merge-approval/stage-8-mt5-bridge.md`

---

## Deploy Checklist (run after every stage)

```bash
pnpm test
pnpm run build
# wrangler deploy (apps/api) — after Cloudflare setup
```

All checks must pass before Conductor writes merge-approval.
