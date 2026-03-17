---
id: T01
parent: S07
milestone: M003
provides:
  - Browser-safe TypeScript interfaces for 7 remaining GSD command surfaces (history, inspect, hooks, export, undo, cleanup, steer)
  - CommandSurfaceRemainingState interface with phase-tracked slices
  - createInitialRemainingState() factory function
  - remainingCommands field wired into WorkspaceCommandSurfaceState initial and open state
key_files:
  - web/lib/remaining-command-types.ts
  - web/lib/command-surface-contract.ts
key_decisions: []
patterns_established:
  - Same pattern as diagnostics-types.ts and settings-types.ts — standalone browser-safe type file mirroring upstream shapes without Node imports, consumed by a grouped state interface using CommandSurfaceDiagnosticsPhaseState<T>
observability_surfaces:
  - WorkspaceCommandSurfaceState.remainingCommands — 7 phase-tracked slices (idle/loading/loaded/error) observable in React DevTools
duration: 10m
verification_result: passed
completed_at: 2026-03-16
blocker_discovered: false
---

# T01: Create browser-safe types and extend command surface state contract

**Defined browser-safe TypeScript interfaces for 7 remaining GSD command surfaces and wired phase-tracked state slices into the command surface contract.**

## What Happened

Created `web/lib/remaining-command-types.ts` with standalone browser-safe interfaces mirroring upstream types from `metrics.ts` (HistoryData and aggregates), `commands.ts` (InspectData), `types.ts` (HookStatusEntry), plus ExportResult, UndoInfo/UndoResult, CleanupData/CleanupResult, and SteerData. All types are standalone with no Node.js imports.

Extended `web/lib/command-surface-contract.ts` with:
- Import of all 7 data types from `remaining-command-types.ts`
- `CommandSurfaceRemainingState` interface grouping 7 `CommandSurfaceDiagnosticsPhaseState<T>` slices
- `createInitialRemainingState()` factory function
- `remainingCommands` field added to `WorkspaceCommandSurfaceState` interface
- Factory wired into both `createInitialCommandSurfaceState()` and `openCommandSurfaceState()`

## Verification

- `npm run build` — exit 0 ✅
- `rg "CommandSurfaceRemainingState" web/lib/command-surface-contract.ts` — 3 matches (interface, factory return type, field declaration) ✅
- `npx tsx --test src/tests/web-command-parity-contract.test.ts` — 114/118 pass (same 4 pre-existing failures, no regressions) ✅

### Slice-level verification status (T01 of 4):
- `npm run build` — ✅ passes
- `npm run build:web-host` — not yet run (final task)
- Parity contract test — ✅ 114/118 pass (pre-existing failures)
- Placeholder text removal — not yet (T04)
- API route files — not yet (T02, T03)

## Diagnostics

`WorkspaceCommandSurfaceState.remainingCommands` exposes 7 phase-tracked slices. Each starts at `{ phase: "idle", data: null, error: null, lastLoadedAt: null }`. Downstream tasks (T02–T04) will transition these through loading/loaded/error via store load functions. Observable in React DevTools on the Zustand store.

## Deviations

The plan referenced `CommandSurfaceUIState` but the actual interface name is `WorkspaceCommandSurfaceState`. Used the real name.

## Known Issues

None.

## Files Created/Modified

- `web/lib/remaining-command-types.ts` — NEW: 130 lines of browser-safe interfaces for 7 command surfaces
- `web/lib/command-surface-contract.ts` — EDIT: added import, CommandSurfaceRemainingState interface, createInitialRemainingState() factory, remainingCommands field in state interface and both factory functions
- `.gsd/milestones/M003/slices/S07/tasks/T01-PLAN.md` — EDIT: added missing Observability Impact section
