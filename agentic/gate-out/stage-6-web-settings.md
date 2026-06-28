# Gate-Out: stage-6-web-settings

**Stage ID:** stage-6-web-settings
**Domain:** apps/web
**Status:** PASS
**Date:** 2026-06-28

---

## Deliverables Completed

- `apps/web/hooks/useSettings.ts` — TanStack Query hooks for GET + PUT `/api/settings`
- `apps/web/app/settings/page.tsx` — Algorithm Settings page at `/settings`

## Features Implemented

- Dynamic parameter form: renders input per key from API (number → `<input type="number">`, boolean → toggle switch, string → `<input type="text">`)
- `camelCase` keys converted to readable labels (e.g., `rsiPeriod` → "Rsi Period")
- Key shown in monospace below label for reference
- Version number and `updatedAt` displayed in header
- Save button: disabled when no changes, spinner while pending, green accent when dirty
- Discard button: appears when form is dirty, resets to API data
- Success feedback: green toast, auto-dismisses after 3s
- Error feedback: red toast with API error message, auto-dismisses after 3s
- Loading skeleton: 6 skeleton rows matching form layout
- Error loading state
- Back button via `router.back()`
- `useUpdateSettings` mutation invalidates `['settings']` query on success

## Acceptance Criteria

- [x] `/settings` displays current params from `GET /api/settings`
- [x] Editing params and Save calls `PUT /api/settings`
- [x] Version and `updatedAt` displayed correctly
- [x] Back button uses `router.back()`
- [x] Success/error feedback shown and auto-dismissed
- [x] No `<a href>` or emoji in UI
- [x] `pnpm type-check` passes

---

**Ready For Next Stage:** YES
**Submitted By:** Worker Agent (stage-6-web-settings)
**Stop Condition:** STOPPED — awaiting `merge-approval/stage-6-web-settings.md`
