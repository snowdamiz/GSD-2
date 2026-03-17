# S04: Diagnostics panels — forensics, doctor, skill-health — UAT

**Milestone:** M003
**Written:** 2026-03-16

## UAT Type

- UAT mode: mixed (artifact-driven contract tests + live-runtime API verification)
- Why this mode is sufficient: Contract tests verify the full pipeline (types → dispatch → store → components). API curl checks verify real data flows through child processes. Browser panel rendering is covered by component wiring + build verification. No human-experience UAT needed — panels are data-display surfaces, not interaction-heavy flows.

## Preconditions

- `npm run build` and `npm run build:web-host` both pass
- For API route tests: dev server running (`npm --prefix web run dev`) or production server from build
- For contract tests: no server needed (pure import/assertion tests)
- Project must have a `.gsd/` directory with real project data for meaningful forensics/doctor/skill-health results

## Smoke Test

Run `npx tsx --test src/tests/web-diagnostics-contract.test.ts` — all 28 tests pass, confirming the full diagnostics pipeline is wired correctly from types through dispatch to store methods.

## Test Cases

### 1. Contract test suite passes

1. Run `npx tsx --test src/tests/web-diagnostics-contract.test.ts`
2. **Expected:** 28/28 pass across 5 describe blocks (type exports, contract state, dispatch→surface, surface→section, store methods)

### 2. Parity contract tests show no regressions

1. Run `npx tsx --test src/tests/web-command-parity-contract.test.ts`
2. **Expected:** 114/118 pass. The 4 failures are pre-existing `/gsd visualize` view-navigate issues from S03 (D053). No new failures.

### 3. Forensics API route returns valid JSON

1. Start the dev server: `npm --prefix web run dev`
2. Run `curl -s http://localhost:3000/api/forensics | jq .`
3. **Expected:** JSON response with fields: `anomalies` (array), `recentUnits` (array), `crashLock` (object with `exists` boolean), `metrics` (object with `totalUnits`, `totalCost`, `totalDuration` numbers), `unitTraceCount` (number), `doctorIssueCount` (number). No `error` field.

### 4. Doctor API GET route returns valid JSON

1. With dev server running, run `curl -s http://localhost:3000/api/doctor | jq .`
2. **Expected:** JSON with `issues` (array of objects with `code`, `severity`, `scope`, `message`, `fixable` fields) and `summary` (object with `total`, `fixable`, `bySeverity`, `byScope` counts).

### 5. Doctor API GET with scope filter

1. Run `curl -s "http://localhost:3000/api/doctor?scope=M003" | jq .`
2. **Expected:** Same structure as test 4, but issues filtered to scope "M003" only.

### 6. Doctor API POST applies fixes

1. Run `curl -s -X POST http://localhost:3000/api/doctor -H 'Content-Type: application/json' -d '{}' | jq .`
2. **Expected:** JSON with `fixesApplied` (array of strings describing what was fixed) and `error` is absent.

### 7. Skill-health API route returns valid JSON

1. Run `curl -s http://localhost:3000/api/skill-health | jq .`
2. **Expected:** JSON with `skills` (array of objects with `name`, `passRate`, `totalRuns`, `tokenTrend`, `isStale`, `isDeclining` fields), `suggestions` (array), `staleSkills` (array of strings).

### 8. Dispatch routes /gsd forensics to correct surface

1. In contract tests, verify `dispatchBrowserSlashCommand("/gsd forensics", ...)` returns `{ kind: "surface", surface: "gsd-forensics" }`.
2. **Expected:** Covered by contract test block 3, test "dispatches to gsd-forensics surface".

### 9. Dispatch routes /gsd doctor to correct surface

1. Verify `dispatchBrowserSlashCommand("/gsd doctor", ...)` returns `{ kind: "surface", surface: "gsd-doctor" }`.
2. **Expected:** Covered by contract test block 3, test "dispatches to gsd-doctor surface".

### 10. Dispatch routes /gsd skill-health to correct surface

1. Verify `dispatchBrowserSlashCommand("/gsd skill-health", ...)` returns `{ kind: "surface", surface: "gsd-skill-health" }`.
2. **Expected:** Covered by contract test block 3, test "dispatches to gsd-skill-health surface".

### 11. Contract state initializes correctly

1. Call `createInitialCommandSurfaceState()` and inspect `.diagnostics`.
2. **Expected:** `diagnostics.forensics.phase === "idle"`, `diagnostics.doctor.phase === "idle"`, `diagnostics.doctor.fixPending === false`, `diagnostics.skillHealth.phase === "idle"`. All `.data` fields are `null`, all `.error` fields are `null`.

### 12. Both builds succeed

1. Run `npm run build`
2. Run `npm run build:web-host`
3. **Expected:** Both exit 0. Web host build route table includes `/api/forensics`, `/api/doctor`, `/api/skill-health`.

## Edge Cases

### API route error handling

1. Stop or break the child-process service (e.g., corrupt the module path)
2. Call `curl -s http://localhost:3000/api/forensics | jq .`
3. **Expected:** HTTP 500 with `{ "error": "..." }` containing the child-process stderr message.

### Doctor POST with scope parameter

1. Run `curl -s -X POST http://localhost:3000/api/doctor -H 'Content-Type: application/json' -d '{"scope":"M003"}' | jq .`
2. **Expected:** Fixes applied only within the specified scope.

### Empty project (no .gsd/ directory)

1. Set GSD_BASE_PATH to a directory without `.gsd/`
2. Call forensics/doctor/skill-health API routes
3. **Expected:** Either empty results (no anomalies, no issues, no skills) or a structured error — not a crash.

### Doctor fix with no fixable issues

1. Call GET to check fixable count
2. If fixable count is 0, call POST
3. **Expected:** `{ "fixesApplied": [] }` — empty array, no error.

## Failure Signals

- Any contract test failure in `web-diagnostics-contract.test.ts` (28 tests) — pipeline regression
- New failures in `web-command-parity-contract.test.ts` beyond the 4 pre-existing `/gsd visualize` ones — dispatch regression
- `npm run build` or `npm run build:web-host` failure — TypeScript compilation or Next.js bundling broken
- API routes returning HTML instead of JSON — route file misconfigured
- API routes returning `{ error }` with 500 when child processes should succeed — service wiring broken
- Missing `data-testid` attributes on panel components — component rendering not wired
- `commandSurface.diagnostics` missing from initial state — contract state not updated

## Requirements Proved By This UAT

- R103 — forensics panel pipeline from upstream module through child-process service to API route to browser panel
- R104 — doctor panel pipeline including both read-only diagnostics (GET) and fix actions (POST)
- R105 — skill-health panel pipeline from upstream module through to browser panel with pass rates and suggestions
- R101 (partial) — three more /gsd subcommands now render real content instead of placeholders

## Not Proven By This UAT

- Live browser rendering with real project data in a running browser session (would need Playwright or manual browser testing)
- Panel visual quality, layout, and responsiveness (contract tests verify wiring, not visual design)
- Performance under large diagnostic datasets (many anomalies, many doctor issues, many skills)
- Doctor fix actions against real broken project state (requires seeding specific doctor issues)

## Notes for Tester

- The 4 pre-existing parity test failures on `/gsd visualize` are by design (D053 view-navigate kind) — ignore them.
- ForensicReport in the browser is intentionally simplified (flattened metrics, counted traces) — don't expect the full upstream shape.
- The doctor POST route is the only mutating endpoint — it runs `runGSDDoctor(basePath, { fix: true })` which may modify project files. Test on a non-critical project.
- Child-process services depend on the `resolve-ts.mjs` loader being available at the expected path. If API routes fail with module resolution errors, check the loader path.
