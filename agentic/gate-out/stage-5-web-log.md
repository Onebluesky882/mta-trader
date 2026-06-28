# Gate-Out: stage-5-web-log

**Stage ID:** stage-5-web-log
**Domain:** apps/web
**Status:** PASS
**Date:** 2026-06-28

---

## Deliverables Completed

- `apps/web/hooks/useTrades.ts` — TanStack Query hook for `GET /api/trades?page&limit&from&to`
- `apps/web/app/log/page.tsx` — Trade Log page at `/log`

## Features Implemented

- Table with 9 columns: Symbol, Direction, Open/Close Price, Open/Close Time, Volume, Profit, Status
- Direction badge: BUY (green) / SELL (red)
- Profit color: positive green / negative red / null = —
- Status badge: OPEN (accent + pulse dot) / CLOSED (muted)
- Date range filter (from / to) — resets page to 1 on change, Clear button when active
- Pagination: Previous / Next with total count display, disabled at boundaries
- Loading skeleton: 8 skeleton rows
- Error state: retry button
- Empty state: two variants (no trades / no filter results)
- Back button via `router.back()` (pre-existing component)
- Horizontal scroll on mobile (table min-width 780px)

## Acceptance Criteria

- [x] `/log` fetches and displays trades from `GET /api/trades`
- [x] Pagination works (Previous / Next), disabled correctly at boundaries
- [x] Date filter (from/to) refetches with query params, resets page to 1
- [x] Back button present, uses `router.back()`
- [x] Profit: green (positive) / red (negative)
- [x] No `<a href>` for internal navigation
- [x] No emoji in UI — inline SVG only
- [x] `pnpm type-check` passes

---

**Ready For Next Stage:** YES
**Submitted By:** Worker Agent (stage-5-web-log)
**Stop Condition:** STOPPED — awaiting `merge-approval/stage-5-web-log.md`
