---
id: S04
parent: M003
milestone: M003
provides:
  - three child-process services (forensics, doctor, skill-health) calling upstream modules via execFile pattern
  - three API routes (/api/forensics GET, /api/doctor GET+POST, /api/skill-health GET) returning diagnostic JSON
  - browser-safe type definitions in web/lib/diagnostics-types.ts mirroring upstream report shapes
  - diagnostics state tracking in command surface contract with generic phase state
  - store fetch methods (loadForensicsDiagnostics, loadDoctorDiagnostics, applyDoctorFixes, loadSkillHealthDiagnostics)
  - three real panel components (ForensicsPanel, DoctorPanel, SkillHealthPanel) replacing placeholder rendering
  - 28-test contract suite validating full diagnostics pipeline
  - exported buildForensicReport from upstream forensics.ts
requires:
  - slice: S01
    provides: upstream forensics.ts, doctor.ts, skill-health.ts modules available in merged codebase
  - slice: S02
    provides: dispatch entries routing /gsd forensics, /gsd doctor, /gsd skill-health to gsd-* surfaces
affects:
  - S08
key_files:
  - web/lib/diagnostics-types.ts
  - src/web/forensics-service.ts
  - src/web/doctor-service.ts
  - src/web/skill-health-service.ts
  - web/app/api/forensics/route.ts
  - web/app/api/doctor/route.ts
  - web/app/api/skill-health/route.ts
  - web/lib/command-surface-contract.ts
  - web/lib/gsd-workspace-store.tsx
  - web/components/gsd/diagnostics-panels.tsx
  - web/components/gsd/command-surface.tsx
  - src/tests/web-diagnostics-contract.test.ts
key_decisions:
  - D055: Export buildForensicReport from forensics.ts (1-line change, no side effects)
  - D056: Extract panels to diagnostics-panels.tsx to avoid growing command-surface.tsx past 2500 lines
  - D057: Simplify ForensicReport for browser — flatten metrics to summary counts, reduce unitTraces to counts
  - Doctor state extends generic phase state with fixPending/lastFixResult/lastFixError for POST lifecycle
  - CommandSurfaceDiagnosticsPhaseState<T> generic is reusable for future diagnostics panels
patterns_established:
  - diagnostics child-process services follow visualizer-service.ts pattern (execFile + resolve-ts.mjs + experimental-strip-types + env var module paths)
  - doctor service exposes two functions (collectDoctorData + applyDoctorFixes) with scope via GSD_DOCTOR_SCOPE env var
  - CommandSurfaceDiagnosticsPhaseState<T> generic for phase/data/error/lastLoadedAt — reusable for future panels
  - panel components consume store directly via hooks (useGSDWorkspaceState + useGSDWorkspaceActions)
  - auto-fetch triggers on section open when phase is "idle" to avoid redundant requests
  - compile-time type aliases for store method existence checks (arrow-function class fields aren't on prototype)
observability_surfaces:
  - GET /api/forensics → ForensicReport JSON or { error } 500
  - GET /api/doctor?scope=X → DoctorReport JSON or { error } 500
  - POST /api/doctor → DoctorFixResult JSON or { error } 500
  - GET /api/skill-health → SkillHealthReport JSON or { error } 500
  - commandSurface.diagnostics.{forensics,doctor,skillHealth}.phase tracks loading lifecycle per panel
  - data-testid: diagnostics-forensics, diagnostics-doctor, diagnostics-skill-health, doctor-apply-fixes
drill_down_paths:
  - .gsd/milestones/M003/slices/S04/tasks/T01-SUMMARY.md
  - .gsd/milestones/M003/slices/S04/tasks/T02-SUMMARY.md
  - .gsd/milestones/M003/slices/S04/tasks/T03-SUMMARY.md
duration: 35m
verification_result: passed
completed_at: 2026-03-16
---

# S04: Diagnostics panels — forensics, doctor, skill-health

**Three browser diagnostic panels backed by real upstream data: `/gsd forensics` shows anomaly scanning, `/gsd doctor` shows health checks with fix actions, `/gsd skill-health` shows per-skill pass rates and heal suggestions — all served via child-process API routes with contract-tested pipeline.**

## What Happened

T01 built the backend foundation: exported `buildForensicReport` from upstream `forensics.ts` (1-line change), created three child-process services following the established visualizer-service.ts pattern (execFile + resolve-ts.mjs + --experimental-strip-types), three API routes (forensics GET, doctor GET+POST, skill-health GET), and browser-safe type definitions in `diagnostics-types.ts`. The ForensicReport was simplified for the browser — metrics flattened to summary counts, unitTraces reduced to counts — while keeping full anomalies, recentUnits, and crashLock. Doctor service exposes separate read (collectDoctorData) and mutate (applyDoctorFixes) functions with scope passed via env var.

T02 wired everything to the UI: added `CommandSurfaceDiagnosticsPhaseState<T>` generic to the contract (reusable for future panels), extended it with doctor-specific fix lifecycle fields (fixPending/lastFixResult/lastFixError), added four store fetch methods, and created three real panel components in `diagnostics-panels.tsx`. ForensicsPanel shows anomaly list with severity badges, recent units table, crash lock status, and metrics summary. DoctorPanel shows issue list with severity/scope filtering, fixable count, and "Apply Fixes" button with result feedback. SkillHealthPanel shows skill table with pass rates, token trends, stale/declining flags, and suggestions. Auto-fetch triggers on section open when phase is idle.

T03 created a 28-test contract suite across 5 blocks: type exports (12), contract state (4), dispatch→surface pipeline (4), surface→section mapping (3), and store method existence (5). Hit one deviation — store methods are arrow-function class fields, not prototype methods — solved with compile-time type aliases instead of runtime prototype checks.

## Verification

- `npx tsx --test src/tests/web-diagnostics-contract.test.ts` — **28/28 pass**
- `npx tsx --test src/tests/web-command-parity-contract.test.ts` — **114/118 pass** (4 pre-existing `/gsd visualize` view-navigate failures from S03 D053, unrelated)
- `npm run build` — exit 0
- `npm run build:web-host` — exit 0; all three routes visible in route table (`/api/forensics`, `/api/doctor`, `/api/skill-health`)
- API routes return structured JSON on success and `{ error }` with status 500 on child-process failure

## Requirements Advanced

- R103 (forensics panel) — full pipeline implemented: child-process service → API route → store fetch → panel component with anomaly list, recent units, crash lock, metrics
- R104 (doctor panel) — full pipeline implemented: child-process service → API route (GET+POST) → store fetch → panel component with issue list, severity badges, fix actions
- R105 (skill-health panel) — full pipeline implemented: child-process service → API route → store fetch → panel component with skill table, pass rates, staleness flags, suggestions
- R101 (command dispatch) — `/gsd forensics`, `/gsd doctor`, `/gsd skill-health` now render real diagnostic data instead of placeholder content
- R109 (parity audit) — three more diagnostic surfaces now have real content for the upcoming S08 parity audit

## Requirements Validated

- none — R103, R104, R105 need live runtime UAT (real project data through the browser) before moving to validated

## New Requirements Surfaced

- none

## Requirements Invalidated or Re-scoped

- none

## Deviations

- T02: Added `CommandSurfaceDoctorState` as a separate interface extending the generic phase state. The plan implied a single generic for all three, but doctor's POST lifecycle (fixPending/lastFixResult/lastFixError) has no equivalent in forensics/skill-health.
- T03: Store method existence tests use compile-time type aliases instead of `prototype` checks. Arrow-function class fields are instance properties, not prototype methods. Same contract guarantee, different mechanism.

## Known Limitations

- Panel components render real data from child-process services, but no live browser UAT was performed against a running project (contract tests verify pipeline wiring, not end-to-end browser behavior).
- ForensicReport is simplified for the browser — full ExecutionTrace details and per-unit MetricsLedger are not exposed. If deeper drill-down is needed, the type will need extension.
- Parity contract test has 4 pre-existing failures on `/gsd visualize` (view-navigate vs surface) from S03's D053 decision. Not an S04 issue.

## Follow-ups

- none — all planned work complete. S08 parity audit will verify these panels against TUI equivalents.

## Files Created/Modified

- `src/resources/extensions/gsd/forensics.ts` — added `export` keyword to `buildForensicReport`
- `web/lib/diagnostics-types.ts` — new: browser-safe interfaces for all diagnostic report shapes
- `src/web/forensics-service.ts` — new: child-process service calling buildForensicReport
- `src/web/doctor-service.ts` — new: child-process service with collectDoctorData and applyDoctorFixes
- `src/web/skill-health-service.ts` — new: child-process service calling generateSkillHealthReport
- `web/app/api/forensics/route.ts` — new: GET route for forensics data
- `web/app/api/doctor/route.ts` — new: GET + POST route for doctor diagnostics and fix actions
- `web/app/api/skill-health/route.ts` — new: GET route for skill health data
- `web/lib/command-surface-contract.ts` — added diagnostics state types, factory functions, diagnostics field
- `web/lib/gsd-workspace-store.tsx` — added 4 fetch methods, diagnostics type imports, exposed in actions hook
- `web/components/gsd/diagnostics-panels.tsx` — new: ForensicsPanel, DoctorPanel, SkillHealthPanel (~340 lines)
- `web/components/gsd/command-surface.tsx` — added panel imports, 3 case branches in renderSection, auto-fetch useEffect
- `src/tests/web-diagnostics-contract.test.ts` — new: 28 contract tests across 5 describe blocks

## Forward Intelligence

### What the next slice should know
- The diagnostics child-process service pattern is now battle-tested across 6 services (auto-dashboard, recovery-diagnostics, visualizer, forensics, doctor, skill-health). S05/S06/S07 should follow the same pattern for any new data-heavy surfaces.
- `CommandSurfaceDiagnosticsPhaseState<T>` is a reusable generic for any panel that needs loading/loaded/error phase tracking. S05 (knowledge/captures) and S07 (history, quick) may want to use the same pattern.
- The auto-fetch useEffect in command-surface.tsx triggers when `openSections` includes a gsd-* key and the corresponding phase is "idle". New panels can hook into this by adding their section key to the conditional.

### What's fragile
- The 4 pre-existing parity test failures on `/gsd visualize` — these are by design (D053 view-navigate kind) but will accumulate as a noise floor in CI if not resolved before S08.
- `diagnostics-panels.tsx` is ~340 lines with all three panels. If any panel grows significantly (e.g., forensics gets drill-down views), it should be split into individual files.

### Authoritative diagnostics
- `npx tsx --test src/tests/web-diagnostics-contract.test.ts` — 28 tests covering the full pipeline from types through dispatch to store methods. If this breaks, the pipeline has a regression.
- `curl http://localhost:3000/api/forensics` / `/api/doctor` / `/api/skill-health` — direct JSON inspection of service output when the dev server is running.

### What assumptions changed
- Plan assumed `buildForensicReport` would need significant effort to export — it was a 1-word change (`export` keyword).
- Plan assumed store method checks could use `prototype` — arrow-function class fields required compile-time type aliases instead.
