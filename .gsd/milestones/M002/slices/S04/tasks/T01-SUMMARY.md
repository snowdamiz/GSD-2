---
id: T01
parent: S04
milestone: M002
provides:
  - Shared launched-host browser harness for real packaged `gsd --web` proofs across repo-root and fixture cwd launches, plus refresh/reopen continuity coverage.
key_files:
  - src/tests/integration/web-mode-runtime-harness.ts
  - src/tests/integration/web-mode-runtime.test.ts
  - src/tests/integration/web-mode-onboarding.test.ts
key_decisions:
  - Reused the slice-local launched-host proof under one shared harness instead of keeping separate runtime/onboarding launch helpers.
patterns_established:
  - Browser-first readiness proof now means launcher stderr + browser-side `/api/boot` and `/api/session/events` diagnostics + visible shell markers, with reconnect continuity asserted through real reload/new-page behavior.
observability_surfaces:
  - launcher `status=started` stderr, browser-tracked `/api/boot` and `/api/session/events` requests, and visible `data-testid` connection/scope/session/recovery markers
duration: ~5h
verification_result: passed
completed_at: 2026-03-15T17:42:28Z
blocker_discovered: false
---

# T01: Generalize the launched-host browser harness and prove refresh/reopen continuity

**Added one shared packaged-host browser harness, switched onboarding/runtime integration tests onto it, and proved repo-root refresh/reload continuity plus seeded fixture-cwd launch truth against the real `gsd --web` host.**

## What Happened

I extracted the duplicated packaged-host launch/bootstrap utilities out of the runtime and onboarding integration tests into `src/tests/integration/web-mode-runtime-harness.ts`. The new harness:

- builds/stages the real packaged host artifacts when needed
- launches `gsd --web` through the repo loader with a configurable launch cwd
- seeds temp-home browser-open stubs and cleanup helpers
- verifies readiness from the browser side instead of Node-side polling
- records browser-visible `/api/boot` and `/api/session/events` diagnostics so failures name launch, boot, SSE attach, or reconnect seams directly

I then rewrote `src/tests/integration/web-mode-runtime.test.ts` around that harness. The runtime proof now covers:

- repo-root cold start
- page reload continuity on the same launched host
- page close/new-page reopen continuity on the same launched host
- stable current-project path, scope, active session id, connection status, and recovery-summary visibility after each reconnect
- a seeded temp-project fixture launch that proves the same harness can target a non-repo cwd without silently falling back to repo-root scope

I updated `src/tests/integration/web-mode-onboarding.test.ts` to reuse the same packaged-host launch/cleanup seam so onboarding and runtime coverage stay aligned. During broader suite verification, the onboarding runtime test exposed that it had kept a stale 90s launcher timeout override even after the shared harness had already been hardened for slower standalone cold boots under suite load. I removed that override so the shared bounded runtime proof remains authoritative.

No `src/web-mode.ts` product change was required for this task; the S03 readiness hardening was sufficient once the tests stopped regressing back to the shorter launch cap.

## Verification

Passed:

- `node --import ./src/resources/extensions/gsd/tests/resolve-ts.mjs --experimental-strip-types --test src/tests/integration/web-mode-runtime.test.ts src/tests/integration/web-mode-onboarding.test.ts`
- `node --import ./src/resources/extensions/gsd/tests/resolve-ts.mjs --experimental-strip-types --test src/tests/integration/web-mode-runtime.test.ts src/tests/integration/web-mode-onboarding.test.ts src/tests/integration/web-mode-assembled.test.ts`
- `node --import ./src/resources/extensions/gsd/tests/resolve-ts.mjs --experimental-strip-types --test src/tests/web-command-parity-contract.test.ts src/tests/web-session-parity-contract.test.ts src/tests/web-live-state-contract.test.ts src/tests/web-recovery-diagnostics-contract.test.ts`
- `npm run build:web-host`

What was proven directly:

- one shared launched-host harness can launch against repo root or a seeded fixture cwd
- refresh and reopen continuity hold against the real packaged host
- browser-context `/api/boot` + first `/api/session/events` payload + visible shell markers remain the readiness proof
- failures now name launch/browser-open, boot, SSE attach, or reconnect continuity seams instead of generic timeouts

Not run in this task:

- manual packaged-host UAT from the slice verification list

## Diagnostics

Inspect later via:

- `src/tests/integration/web-mode-runtime-harness.ts` — shared launch, browser-open, cleanup, and page-level readiness helpers
- launched-host stderr `status=started` diagnostics captured in the integration tests
- browser-tracked `/api/boot` and `/api/session/events` request summaries embedded in failing assertions
- visible shell markers used by the proof: `workspace-connection-status`, `workspace-project-cwd`, `sidebar-current-scope`, `terminal-session-banner`, `dashboard-recovery-summary-entrypoint`, and `command-surface-recovery-state`

## Deviations

- None.

## Known Issues

- The existing `MODULE_TYPELESS_PACKAGE_JSON` warnings from `web/` imports still appear during Node strip-types test runs.
- `npm run build:web-host` still emits the known optional `@gsd/native` warning during Next/Turbopack bundling, but the build completes successfully.
- Manual packaged-host UAT remains for later slice work.

## Files Created/Modified

- `src/tests/integration/web-mode-runtime-harness.ts` — shared packaged-host launch, browser-open, cleanup, network diagnostics, and browser-context readiness helpers
- `src/tests/integration/web-mode-runtime.test.ts` — repo-root refresh/reopen continuity proof plus seeded fixture-cwd launch proof using the shared harness
- `src/tests/integration/web-mode-onboarding.test.ts` — switched the real launched-host onboarding test onto the shared harness and removed the stale shorter launch-timeout override
