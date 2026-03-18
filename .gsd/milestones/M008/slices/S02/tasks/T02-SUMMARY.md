---
id: T02
parent: S02
milestone: M008
provides:
  - UpdateBanner client component with conditional rendering, update trigger, polling, and status feedback
  - Wired into app-shell.tsx WorkspaceChrome layout between header and error banner
key_files:
  - web/components/gsd/update-banner.tsx
  - web/components/gsd/app-shell.tsx
key_decisions:
  - Used data-testid attributes on banner, message, action, and retry elements for agent/test inspectability
  - Polling starts on POST success and cleans up when status leaves 'running' — no polling when idle
  - Orange for available/running state, emerald for success, destructive/red for error — matches existing workspace chrome tone system
patterns_established:
  - Client component fetch+poll pattern with interval cleanup on status change and unmount
observability_surfaces:
  - data-testid="update-banner" — visible when updateAvailable=true or updateStatus != idle
  - data-testid="update-banner-message" — shows current status text (available, updating, success, error)
  - data-testid="update-banner-action" — Update button selector
  - data-testid="update-banner-retry" — Retry button on error state
  - Network logs show GET /api/update polling every 3s during active update
duration: 8m
verification_result: passed
completed_at: 2026-03-18
blocker_discovered: false
---

# T02: Build UpdateBanner component and wire into app-shell

**Created UpdateBanner client component that conditionally shows version update availability, triggers updates via POST /api/update with 3s polling, and displays success/error feedback — wired into WorkspaceChrome between header and error banner.**

## What Happened

Built `web/components/gsd/update-banner.tsx` as a `'use client'` component with:

1. **Initial fetch** — `useEffect` calls `GET /api/update` on mount, stores response in state
2. **Conditional rendering** — returns `null` when no data loaded or `updateAvailable === false && updateStatus === 'idle'`
3. **Three visual states:**
   - **Available** (orange): Shows "Update available: v{current} → v{latest}" with an "Update" button
   - **Running** (orange): Shows spinner + "Updating to v{target}…" with button hidden
   - **Success** (emerald): Shows "Update complete — restart GSD to use v{target}"
   - **Error** (red/destructive): Shows error message with "Retry" button
4. **Polling** — `setInterval` every 3s starts when `updateStatus === 'running'`, clears when status changes or component unmounts
5. **Trigger** — "Update" button fires `POST /api/update`, then immediately fetches to pick up running status

Wired into `app-shell.tsx` with a 2-line change: import + `<UpdateBanner />` between `</header>` and the error banner div.

## Verification

- `npm run build:web-host` exits 0 — no type errors, route manifest includes `/api/update`
- Browser: navigated to `http://localhost:3099`, banner renders at top with orange styling showing "Update available: v2.22.0 → v2.28.0"
- Browser assertions (5/5 passed):
  - `[data-testid='update-banner']` visible
  - Text "Update available" visible
  - Text "v2.22.0" visible
  - Text "v2.28.0" visible
  - `[data-testid='update-banner-action']` (Update button) visible
- `curl /api/update` returns `{ currentVersion: "2.22.0", latestVersion: "2.28.0", updateAvailable: true, updateStatus: "idle" }`
- Did not trigger actual update flow (would run `npm install -g gsd-pi@latest` in production — unsafe in dev environment)

## Diagnostics

- `browser_find` with text "Update available" or `browser_assert` with `selector_visible` on `[data-testid="update-banner"]` confirms banner presence
- During active update: network logs show `GET /api/update` requests every 3s
- Banner message text changes with status: "Update available" → "Updating to v…" → "restart GSD to use v…" or "Update failed: …"
- Error details from API `error` field rendered directly in banner text

## Deviations

- Used orange instead of sky-blue for the available/running state per user request.

## Known Issues

- Update flow not exercised end-to-end in browser (would trigger real `npm install -g`). The running → success/error state transitions are implemented but only verifiable when a real update runs.

## Files Created/Modified

- `web/components/gsd/update-banner.tsx` — new: client component with fetch, conditional render, update trigger, polling, status feedback, spinner
- `web/components/gsd/app-shell.tsx` — modified: added UpdateBanner import and render between header and error banner (2 lines)
- `.gsd/milestones/M008/slices/S02/tasks/T02-PLAN.md` — modified: added Observability Impact section
