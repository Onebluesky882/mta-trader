# Gate-Out: stage-7-web-optimize

**Stage ID:** stage-7-web-optimize
**Domain:** apps/web
**Status:** PASS
**Date:** 2026-06-28

---

## Deliverables Completed

- `apps/web/hooks/useOptimize.ts` — updated: added `useSaveSnapshot` mutation + `SnapshotResult` type
- `apps/web/app/optimize/page.tsx` — updated: Save Current Config button + History link
- `apps/web/app/optimize/history/page.tsx` — created: version history with diff view

## Features Implemented

### /optimize (updated)
- "Save Current Config" button: opens modal with optional label input, POSTs snapshot with current settings params + dashboard P&L data
- Label input with keyboard Enter to save
- History link (`<Link href="/optimize/history">`) using Next.js Link
- Inline success/error feedback (auto-dismiss 3s)
- Save button disabled if settings not loaded

### /optimize/history (new)
- Full snapshot list ordered by newest first
- Table: version, parameter chips (top 5 + overflow count), win rate, profit, drawdown, saved-at
- Select up to 2 versions via checkbox — numbered in selection order
- Diff panel appears when exactly 2 selected, showing:
  - Params diff: each key row, highlight changed values amber (old) → green (new)
  - Results diff: win rate, profit, drawdown, total trades
- Clear selection button
- Loading skeleton (5 rows)
- Empty state
- Back button via `router.back()`

### hooks/useOptimize.ts
- Added `SnapshotResult` type
- Added `useSaveSnapshot` mutation: POST /api/optimize, invalidates `['optimize']` on success

## Acceptance Criteria

- [x] `/optimize` displays snapshot list from API
- [x] "Save Current Config" saves snapshot (POST /api/optimize)
- [x] `/optimize/history` shows history with full params
- [x] Diff view compares 2 selected versions
- [x] Back buttons on both pages use `router.back()`
- [x] No `<a href>` or emoji in UI
- [x] Internal navigation uses `<Link>`
- [x] `pnpm type-check` passes

---

**Ready For Next Stage:** YES
**Submitted By:** Worker Agent (stage-7-web-optimize)
**Stop Condition:** STOPPED — awaiting `merge-approval/stage-7-web-optimize.md`
