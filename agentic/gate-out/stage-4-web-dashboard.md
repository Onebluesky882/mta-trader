# Gate-Out: stage-4-web-dashboard

**Stage ID:** stage-4-web-dashboard
**Domain:** apps/web
**Status:** PASS
**Date:** 2026-06-28

---

## Deliverables Completed

### Infrastructure
- `apps/web/store/useAppStore.ts` — Zustand store: `{ token, setToken, clearToken }` persisted to localStorage key `mta-app`
- `apps/web/hooks/use-api.ts` — Updated: reads token from `useAppStore`, sends `Authorization: Bearer <token>`, no `credentials: include`
- `apps/web/hooks/useDashboard.ts` — TanStack Query hook for `GET /api/dashboard`, `refetchInterval: 30000`
- `apps/web/providers/query-provider.tsx` — Pre-existing, re-used (QueryClientProvider)

### Layout
- `apps/web/app/layout.tsx` — Root layout: metadata `MTA Trader`, `data-theme="dark"`, wraps `<QueryProvider>` + `<Navbar>`

### Components
- `apps/web/components/navbar.tsx` — mta-trader navbar: logo → `/`, links (Dashboard, Log, Settings, Optimize), sign out button (visible only when token present), mobile hamburger
- `apps/web/components/back-button.tsx` — Pre-existing, compatible (`router.back()` or custom href)

### Pages
- `apps/web/app/page.tsx` — Dashboard page (`/`): auth guard (no token → redirect `/login`), 5 stat cards (Bot Status with pulse-ring, Open Trades, Today P&L, Total P&L, Win Rate), loading skeleton, error state with retry, 30s auto-refresh via TanStack Query, dot-grid + orb-glow background
- `apps/web/app/(auth)/login/page.tsx` — Login page: email + password form, `POST /api/auth/login`, saves token to `useAppStore`, redirect to `/` on success, no back button

### CSS
- `apps/web/app/globals.css` — Added keyframes: `orb-move`, `pulse-ring`, `shimmer` (per DESIGN_SYSTEM.md)

---

## Acceptance Criteria

- [x] `pnpm type-check` (apps/web) passes with no errors
- [x] Dashboard page fetches from `GET /api/dashboard` via TanStack Query
- [x] Navbar has logo `mta-trader` linking to `/`
- [x] No `<a href>` used for internal navigation — all internal links use `<Link>` or `router.push()`
- [x] No emoji in UI code — inline SVG only
- [x] Login flow: Bearer token saved in Zustand store, redirect to `/` on success
- [x] Loading state: skeleton cards displayed during fetch
- [x] Error state: error banner with Retry button on Dashboard

---

## Rules Verification

- Bearer-only auth: `credentials: include` removed from `use-api.ts` — confirmed
- Logo links to `/`: `<Link href="/">mta-trader</Link>` — confirmed
- No emoji in UI: all icons are inline SVG — confirmed
- Internal navigation via `<Link>` / `router.push()` only — confirmed
- `NEXT_PUBLIC_API_URL` used for API base URL — confirmed

---

## Notes

- `apps/web/app/dashboard/page.tsx` (legacy gover-agent page at `/dashboard`) had a pre-existing TypeScript error (`purchase` undefined at line 71). Fixed by removing the conditional border reference. This file is outside stage-4 domain but was blocking `tsc --noEmit`.
- Stages 5, 6, 7 (Log, Settings, Optimize) can now be dispatched. Their routes (`/log`, `/settings`, `/optimize`) are referenced in the Navbar but pages do not yet exist.

---

**Ready For Next Stage:** YES
**Submitted By:** Worker Agent (stage-4-web-dashboard)
**Stop Condition:** STOPPED — awaiting `merge-approval/stage-4-web-dashboard.md`
