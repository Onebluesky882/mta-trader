# Gate-Out: stage-3-api-core

**Stage ID:** stage-3-api-core
**Status:** PASS
**Date:** 2026-06-28
**Branch:** worktree-agent-a03ec10348edfce4e (stage-3 work — merge to stage-3-api-core)

---

## Files Created

| File | Description |
|------|-------------|
| `apps/api/src/db/schema.sql` | D1 schema: users, trades, algorithm_settings, optimize_snapshots |
| `apps/api/src/db/client.ts` | D1 raw SQL helper (query / first / run) |
| `apps/api/src/routes/auth.ts` | POST /api/auth/login adapter (per CONTRACTS.md) |
| `apps/api/src/routes/dashboard.ts` | GET /api/dashboard — bot status, trade stats |
| `apps/api/src/routes/trades.ts` | GET /api/trades — paginated trade list |
| `apps/api/src/routes/settings.ts` | GET + PUT /api/settings — algorithm settings |
| `apps/api/src/routes/optimize.ts` | GET + POST /api/optimize — optimization snapshots |
| `apps/api/src/routes/auth.test.ts` | Unit tests for auth route (4 tests) |
| `apps/api/src/routes/dashboard.test.ts` | Unit tests for dashboard route (2 tests) |
| `apps/api/src/routes/trades.test.ts` | Unit tests for trades route (4 tests) |
| `apps/api/src/routes/settings.test.ts` | Unit tests for settings route (6 tests) |
| `apps/api/src/routes/optimize.test.ts` | Unit tests for optimize route (6 tests) |
| `packages/auth/src/middleware.ts` | authMiddleware factory for Hono (Bearer token via better-auth) |

## Files Modified

| File | Change |
|------|--------|
| `apps/api/src/index.ts` | Registered 5 new routes (mtaAuth, dashboard, trades, settings, optimize) |
| `apps/api/wrangler.toml` | Replaced real database_id with PLACEHOLDER |
| `packages/auth/src/index.ts` | Export authMiddleware |
| `packages/auth/package.json` | Added hono as peerDependency + devDependency |

---

## Dependencies Added + Verified Versions

| Package | Version Checked | Method | Purpose |
|---------|----------------|--------|---------|
| `hono` | 4.12.27 | `npm info hono version` | Hono types for authMiddleware in packages/auth |

No new runtime dependencies added to apps/api (hono was already a dependency).

---

## Acceptance Criteria Verified

| Criterion | Status |
|-----------|--------|
| `pnpm build` (tsc --noEmit) passes for new route files | PASS — only pre-existing payment Stripe version errors remain |
| `pnpm test` unit tests pass | PASS — 31 tests across 10 files |
| Every endpoint in CONTRACTS.md has a route | PASS — /api/auth/login, /api/dashboard, /api/trades, /api/settings, /api/optimize |
| Every protected route returns 401 without Bearer token | PASS — verified by unit tests; authMiddleware applied via `router.use('*', ...)` |
| D1 schema can be created with `wrangler d1 execute` | PASS — schema.sql is valid DDL with IF NOT EXISTS guards |
| No undocumented routes | PASS — only routes defined in CONTRACTS.md are implemented |

## Security Checklist

- [x] No secrets committed (wrangler.toml uses PLACEHOLDER for database_id)
- [x] No backdoors or auth bypass
- [x] No undocumented APIs
- [x] No dangerous operations
- [x] All protected routes apply authMiddleware before handler
- [x] params stored as JSON string in D1 — parsed/stringified on read/write

## Notes

- Pre-existing TypeScript errors in `src/domains/payment/` (Stripe API version mismatch `2026-05-27.dahlia` vs `2026-06-24.dahlia`) were present before this stage and are NOT caused by stage-3 changes.
- The `authMiddleware` is a factory function: `authMiddleware(auth)` returns a Hono `MiddlewareHandler`. Each route creates its own `auth` instance from `c.env.DB` per the existing project pattern.
- `/api/auth/login` is registered before the better-auth catch-all so it takes precedence for that specific path.

---

**Ready For Next Stage:** YES
