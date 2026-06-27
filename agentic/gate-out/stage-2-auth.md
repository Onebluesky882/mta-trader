# Gate-Out: stage-2-auth

**Stage ID:** stage-2-auth
**Status:** PASS
**Date:** 2026-06-27

---

## Files Created

| File | Description |
|------|-------------|
| `packages/auth/src/auth.ts` | Replaced with custom jose-based `generateToken` / `verifyToken` (WebCrypto, Cloudflare Workers compatible) |
| `packages/auth/src/middleware.ts` | New Hono `authMiddleware` — reads `JWT_SECRET` from `c.env`, sets `c.get('user')`, returns 401 on failure |
| `packages/auth/src/better-auth.ts` | Extracted legacy better-auth `createAuth` / `Auth` to preserve backward compatibility for existing domain routes |
| `packages/auth/src/auth.test.ts` | 7 unit tests: valid token round-trip, invalid string, wrong secret, expired token, empty string |
| `packages/auth/vitest.config.ts` | Vitest config for the auth package (environment: node) |
| `apps/api/src/routes/auth.ts` | `POST /api/auth/login` — looks up user in D1, compares bcrypt hash, returns `{ token, expiresAt }` |
| `apps/api/src/db/schema.sql` | D1 `users` table schema (`id`, `email`, `password_hash`, `role`, `created_at`) |
| `apps/api/src/db/seed-owner.sql` | Seed script for owner user (`wansing05@gmail.com`, role=`owner`) — placeholder for bcrypt hash |

## Files Modified

| File | Change |
|------|--------|
| `packages/auth/package.json` | Added `jose ^6.2.3`, `bcryptjs ^3.0.3`, `hono latest`, `@types/bcryptjs ^3.0.0`, `vitest ^4.1.9`; added `test` script |
| `packages/auth/src/index.ts` | Updated exports: new token utils + middleware; re-exports legacy better-auth symbols |
| `apps/api/package.json` | Added `bcryptjs ^3.0.3` (dep) and `@types/bcryptjs ^3.0.0` (devDep) |

---

## Dependencies Added

| Package | Verified Version | Purpose |
|---------|-----------------|---------|
| `jose` | 6.2.3 (verified: `npm info jose version`) | WebCrypto-compatible JWT signing/verification for Cloudflare Workers |
| `bcryptjs` | 3.0.3 (verified: `npm info bcryptjs version`) | Password hashing — pure-JS, no native bindings required |
| `@types/bcryptjs` | 3.0.0 (verified: `npm info @types/bcryptjs version`) | TypeScript types for bcryptjs |
| `vitest` | 4.1.9 (verified: `npm info vitest version`) | Unit test runner for auth package |

---

## How Acceptance Criteria Were Verified

| Criterion | Result |
|-----------|--------|
| `packages/auth` builds without TypeScript error | PASS — `tsc --noEmit` exits 0 with no output |
| Unit tests pass (`pnpm test`) | PASS — 7/7 tests passed in packages/auth |
| `POST /api/auth/login` implemented | PASS — `apps/api/src/routes/auth.ts` implements the exact contract from CONTRACTS.md |
| JWT has no hardcoded secret | PASS — `generateToken` and `verifyToken` accept `secret` as a parameter; middleware reads from `c.env.JWT_SECRET` |
| Password never logged or returned | PASS — `password_hash` is selected only for bcrypt comparison; never included in any response |
| Users table schema for D1 | PASS — `apps/api/src/db/schema.sql` matches the exact schema specified in the task |

---

## Security Checklist

- No secrets committed (JWT_SECRET is runtime env only; seed-owner.sql contains `<bcrypt-hash>` placeholder)
- No backdoors or auth bypass
- No undocumented APIs (only `POST /api/auth/login`, which is defined in CONTRACTS.md)
- No unauthorized dependencies (all packages approved by task spec)
- No dangerous operations performed
- No governance files modified

---

## Notes

- The pre-existing TypeScript errors in `src/domains/payment/` (Stripe API version `"2026-05-27.dahlia"`) are unrelated to this stage and were present before any changes.
- `apps/api/src/index.ts` was NOT modified — the new `authRoute` from `src/routes/auth.ts` can be wired in by the next stage or the Conductor as needed.
- Owner seed: the `<bcrypt-hash>` placeholder in `seed-owner.sql` must be replaced with an actual bcrypt hash before running. Generation command is documented in the file.

---

**Ready For Next Stage:** YES
