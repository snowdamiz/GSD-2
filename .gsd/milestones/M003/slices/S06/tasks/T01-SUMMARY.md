---
id: T01
parent: S06
milestone: M003
provides:
  - Browser-safe settings type definitions (SettingsData and all sub-interfaces)
  - Child-process service calling 5 upstream functions across 4 modules
  - API route exposing combined settings data at /api/settings-data
key_files:
  - web/lib/settings-types.ts
  - src/web/settings-service.ts
  - web/app/api/settings-data/route.ts
key_decisions: []
patterns_established:
  - Multi-module child-process aggregation (5 imports, env vars per module, combined JSON payload)
observability_surfaces:
  - GET /api/settings-data returns SettingsData JSON or 500 with { error: string }
duration: 15m
verification_result: passed
completed_at: 2026-03-16
blocker_discovered: false
---

# T01: Add settings types, child-process service, and API route

**Created the backend data pipeline for the settings surface: browser-safe types, child-process service calling 5 upstream functions, and API route at `/api/settings-data`.**

## What Happened

Built three files following the established forensics-service pattern:

1. **`web/lib/settings-types.ts`** — 110 lines of browser-safe interfaces mirroring upstream types from `preferences.ts`, `model-router.ts`, `context-budget.ts`, `routing-history.ts`, and `metrics.ts`. Includes `SettingsData` as the combined payload type with `SettingsPreferencesData`, `SettingsDynamicRoutingConfig`, `SettingsBudgetAllocation`, `SettingsRoutingHistory`, and `SettingsProjectTotals`.

2. **`src/web/settings-service.ts`** — Child-process service using `execFile` + `resolve-ts.mjs` + `--experimental-strip-types`. The inline script dynamically imports all 5 upstream modules via `pathToFileURL` env vars, calls `loadEffectiveGSDPreferences()`, `resolveDynamicRoutingConfig()`, `computeBudgets(200000)`, `initRoutingHistory(base)` → `getRoutingHistory()`, and `loadLedgerFromDisk(base)` → `getProjectTotals()`. Handles null returns from preferences, routing history, and metrics ledger. Maps snake_case upstream fields to camelCase browser types.

3. **`web/app/api/settings-data/route.ts`** — GET handler following the forensics route pattern exactly: `runtime = "nodejs"`, `dynamic = "force-dynamic"`, try/catch with 500 error response including `Cache-Control: no-store`.

## Verification

- `npm run build` — exit 0, TypeScript compiles with all new files
- `rg "settings-types" web/ src/` — shows import from `settings-service.ts` only (as expected for T01)
- `rg "collectSettingsData" src/web/ web/app/` — shows service exported and imported in route
- `npx tsx --test src/tests/web-command-parity-contract.test.ts` — 114 pass, 4 fail (pre-existing; same count before and after changes, confirmed via git stash)

### Slice-level verification status (T01 of 2):
- ✅ `npm run build` passes
- ⏳ `npm run build:web-host` — not run (applies to T02 when components are added)
- ✅ `npx tsx --test` — 114/118 pass (4 pre-existing failures, no regression)

## Diagnostics

- `curl http://localhost:3000/api/settings-data | jq .` — returns combined SettingsData JSON when the dev server is running
- Non-null `preferences` confirms preferences.md was found and parsed
- Non-null `routingHistory` confirms routing-history.json exists
- Non-null `projectTotals` confirms metrics.json exists
- 500 response with `{ error: "settings data subprocess failed: ..." }` on upstream failures

## Deviations

None.

## Known Issues

- 4 pre-existing test failures in `web-command-parity-contract.test.ts` (view-navigate vs surface action type mismatch) — unrelated to this task.

## Files Created/Modified

- `web/lib/settings-types.ts` — new: browser-safe interfaces for settings surface
- `src/web/settings-service.ts` — new: child-process service aggregating 5 upstream functions
- `web/app/api/settings-data/route.ts` — new: API route exposing settings data
- `.gsd/milestones/M003/slices/S06/S06-PLAN.md` — added failure-path verification step; marked T01 done
- `.gsd/milestones/M003/slices/S06/tasks/T01-PLAN.md` — added Observability Impact section
