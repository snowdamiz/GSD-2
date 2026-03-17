# S07: Remaining Command Surfaces — Research

**Date:** 2026-03-16

## Summary

S07 must replace placeholder rendering for 10 command surfaces that still hit the generic `startsWith("gsd-")` fallback in `command-surface.tsx`: **quick, history, undo, steer, hooks, inspect, export, cleanup, queue, status**. S04/S05/S06 already built real content for forensics, doctor, skill-health, knowledge, capture, triage, prefs, mode, and config — leaving these 10. The roadmap lists mode and config in S07's description, but S06 already shipped real panels for both (`ModelRoutingPanel` and `BudgetPanel`), so S07 inherits status and queue which are also still placeholder.

The work follows established patterns from S04/S05/S06. Each surface needs: (1) a browser-safe type definition, (2) optionally an API route + service using the child-process pattern, (3) store state + load action, (4) a panel component, and (5) auto-loader wiring in the useEffect chain. The 10 surfaces split into three tiers: 4 that can work with existing data or direct file reads (no new API), 4 that need read-only API routes, and 2 that need API routes with POST mutations.

## Recommendation

Build in three passes: (1) the component file with all 10 panel components, wiring into command-surface.tsx switch cases and auto-loaders; (2) API routes + services for the 6 surfaces that need server data; (3) store state extensions and load actions. Group the surfaces by data-access pattern rather than alphabetically — surfaces sharing a pattern can reuse the same service infrastructure.

Extract all 10 panels into a new `web/components/gsd/remaining-command-panels.tsx` file, following the D056 precedent of keeping command-surface.tsx as an orchestrator.

## Implementation Landscape

### Key Files

- `web/components/gsd/command-surface.tsx` (2165 lines) — Orchestrator. The `renderSection()` switch has 9 real cases + a `startsWith("gsd-")` placeholder fallback. S07 replaces that fallback with 10 new cases delegating to extracted panel components. The auto-load useEffect chain (line ~395) needs extension for surfaces that fetch on open.
- `web/components/gsd/remaining-command-panels.tsx` (NEW) — All 10 panel components. Follows `diagnostics-panels.tsx` (525 lines) and `settings-panels.tsx` (498 lines) pattern.
- `web/lib/command-surface-contract.ts` (1065 lines) — State types. Needs new state interfaces for surfaces that carry loaded data (history, inspect, hooks, cleanup, undo, export, queue, status). Can reuse `CommandSurfaceDiagnosticsPhaseState<T>` (D058) for the loading lifecycle.
- `web/lib/gsd-workspace-store.tsx` (4898 lines) — Store actions. Needs load functions for each surface with an API route, plus state slices in the command surface state.
- `web/lib/remaining-command-types.ts` (NEW) — Browser-safe type definitions for the 10 surfaces' data shapes. Mirrors upstream types without importing Node.js modules. Follows `diagnostics-types.ts` and `settings-types.ts` pattern.
- `src/web/history-service.ts` (NEW) — Child-process service for metrics ledger. `metrics.ts` uses `.js` imports → child process required per Turbopack knowledge entry.
- `src/web/inspect-service.ts` (NEW) — Child-process service for gsd-db introspection.
- `src/web/hooks-service.ts` (NEW) — Child-process service for hook status from `post-unit-hooks.ts`.
- `src/web/cleanup-service.ts` (NEW) — Child-process service for branch/snapshot listing and deletion.
- `src/web/undo-service.ts` (NEW) — Child-process service for undo info and execution.
- `src/web/export-service.ts` (NEW) — Child-process service for metrics export generation.
- `web/app/api/history/route.ts` (NEW) — GET route serving `UnitMetrics[]` with aggregations.
- `web/app/api/inspect/route.ts` (NEW) — GET route serving `InspectData`.
- `web/app/api/hooks/route.ts` (NEW) — GET route serving `HookStatusEntry[]`.
- `web/app/api/cleanup/route.ts` (NEW) — GET (list) + POST (delete) for branches/snapshots.
- `web/app/api/undo/route.ts` (NEW) — GET (last unit info) + POST (execute undo with --force).
- `web/app/api/export-data/route.ts` (NEW) — GET route generating markdown/JSON download.

### Surface-by-Surface Data Requirements

**No API route needed (use existing data or direct reads):**

| Surface | Data Source | Approach |
|---------|-----------|----------|
| `gsd-quick` | No data needed | Static usage instructions. TUI's `handleQuick` requires args (`/gsd quick <desc>`) — bare `/gsd quick` just shows usage text. Browser surface shows the same usage instructions. No listing feature exists upstream. |
| `gsd-steer` | `sendSteer()` in store | Input form submitting via existing `store.sendSteer(message)`. Read OVERRIDES.md via new `/api/steer` GET (direct `readFileSync`, no child process needed — OVERRIDES.md is plain markdown). |
| `gsd-status` | Existing `/api/live-state?domain=workspace` | Reuse workspace index data already fetched. TUI opens a dashboard overlay; browser surface shows the same state summary (active milestone/slice/task, phase, milestones list). |
| `gsd-queue` | Existing `/api/live-state?domain=workspace` | Reuse workspace index milestones array. TUI's `showQueue()` shows milestone registry with status — same data available from workspace index. |

**Read-only API routes (child-process pattern):**

| Surface | Upstream Module | Key Function | Data Shape |
|---------|----------------|-------------|------------|
| `gsd-history` | `metrics.ts` | `loadLedgerFromDisk()`, aggregation functions | `UnitMetrics[]` + totals + breakdown by slice/phase/model |
| `gsd-hooks` | `post-unit-hooks.ts` | `getHookStatus()`, `formatHookStatus()` | `HookStatusEntry[]` (name, type, enabled, targets, activeCycles) |
| `gsd-inspect` | `commands.ts` / `gsd-db.ts` | `handleInspect()` logic (DB queries) | `InspectData` (schemaVersion, counts, recentDecisions, recentRequirements) — already exported as interface |
| `gsd-export` | `export.ts` | `writeExportFile()` / `handleExport()` | Generated markdown or JSON as downloadable blob |

**API routes with mutations (GET + POST):**

| Surface | GET (read) | POST (mutate) |
|---------|-----------|--------------|
| `gsd-undo` | Last completed unit info from `completed-units.json` | Execute undo (revert commits, remove state, uncheck plan) |
| `gsd-cleanup` | Branch list (`nativeBranchList`) + snapshot refs (`nativeForEachRef`) | Delete merged branches + prune old snapshots |

### Build Order

**Task 1: Types + state foundation.** Create `remaining-command-types.ts` with browser-safe interfaces for all data shapes. Add state slices to `command-surface-contract.ts` using the `CommandSurfaceDiagnosticsPhaseState<T>` generic. This unblocks both component and store work.

**Task 2: Services + API routes.** Build the 6 new services (`history-service.ts`, `inspect-service.ts`, `hooks-service.ts`, `cleanup-service.ts`, `undo-service.ts`, `export-service.ts`) and their corresponding API routes. All follow the forensics-service.ts child-process pattern. This is the riskiest work (child-process spawning, upstream module imports).

**Task 3: Store actions.** Add load functions to the workspace store for each surface with an API route. Wire state patches. Add steer-specific state for the OVERRIDES form. This follows the `loadForensicsDiagnostics()` pattern exactly.

**Task 4: Panel components + wiring.** Create `remaining-command-panels.tsx` with all 10 panel components. Wire into `command-surface.tsx`: add switch cases in `renderSection()`, extend the auto-load useEffect. This is the largest task by line count but lowest risk — pure React rendering following established patterns.

**Task 5: Verification.** Run `npm run build`, `npm run build:web-host`, confirm all 10 surfaces render real content (no placeholder fallthrough), run existing parity contract test.

### Verification Approach

- `npm run build` — TypeScript compilation with all new types, services, store actions
- `npm run build:web-host` — Next.js production build with all new components and routes
- `npx tsx --test src/tests/web-command-parity-contract.test.ts` — existing 118 tests still pass (dispatch unchanged)
- Manual verification: each of the 10 surfaces should render a named component instead of the placeholder text "Coming in a future update"
- Each new API route responds (GET returns JSON, POST routes accept and process): `curl http://localhost:3000/api/history`, etc.

## Constraints

- **Turbopack .js→.ts resolution** — All upstream modules under `src/resources/extensions/gsd/` use Node ESM `.js` import extensions. Web services MUST use the child-process pattern (`execFile` + `resolve-ts.mjs`), not direct imports. See KNOWLEDGE entry "Turbopack Cannot Resolve .js→.ts Extension Imports".
- **command-surface.tsx size** — Already at 2165 lines. All 10 panels MUST be extracted to a separate file, not inlined. D056 established this precedent.
- **InspectData is already exported** — `commands.ts` exports both `InspectData` interface and `formatInspectOutput()`. The child script can import these directly.
- **sendSteer already exists** — `store.sendSteer(message)` is already wired in the workspace store. The steer panel only needs a form UI + optional OVERRIDES.md read-back.
- **queue/status can reuse workspace data** — The workspace index (from `/api/live-state?domain=workspace`) already contains `milestones[]` with slice status and `active.milestoneId/sliceId/taskId/phase`. No new API route needed for these two surfaces.
- **quick has no list feature** — TUI's `handleQuick` requires a task description arg. Bare `/gsd quick` shows usage. The browser surface should match: usage instructions with example. The surface could optionally scan `.gsd/quick/` to list existing tasks, but this is additive, not required for parity.
- **export downloads** — Per D052, client-side blob downloads using `URL.createObjectURL()`. The API route returns the raw data; the browser generates the file. Alternatively, the API can generate and return the file content directly for download.

## Common Pitfalls

- **Stale placeholder fallthrough** — After adding 10 switch cases, the generic placeholder still catches any `gsd-*` surface not matched. If a typo in a case string leaves one surface unmatched, it silently falls through to placeholder. Verify all 10 by checking that `data-testid="gsd-surface-gsd-*"` divs no longer appear.
- **useEffect dependency array drift** — The auto-load useEffect already has 15 dependencies. Adding more surfaces means more conditions and more deps. Missing a dep causes stale closures; extra deps cause re-renders. Group new surfaces carefully.
- **Child-process env vars** — Each child-process service needs `GSD_*_BASE` or `GSD_*_MODULE` env vars passed to the child. Follow forensics-service.ts pattern exactly: `resolveBridgeRuntimeConfig()` for `packageRoot` and `projectCwd`.
