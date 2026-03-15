---
estimated_steps: 5
estimated_files: 4
---

# T01: Generalize the launched-host browser harness and prove refresh/reopen continuity

**Slice:** S04 — Final assembled browser hardening proof
**Milestone:** M002

## Description

The current packaged-host runtime proof only demonstrates repo-root cold-start attach. S04 needs a reusable launched-host browser harness that can target both the real repo workspace and seeded temp-project fixtures, while also proving the browser survives reload and page reopen without losing truthful current-project state.

## Steps

1. Extract the duplicated packaged-host launch, browser-open stubbing, and cleanup utilities from the existing runtime/onboarding tests into one shared harness that accepts launch cwd, temp home, and browser seed inputs while still using the repo loader and built host artifacts.
2. Keep the browser-context verification model from S03: wait on the real page, not Node-side polling, for `/api/boot`, the first `/api/session/events` payload, and visible shell readiness markers.
3. Extend the launched-host runtime proof to reload the page and then close/reopen a page against the same host, asserting current-project scope, session attach, connection status, and recovery-summary entrypoints stay truthful after each reconnect.
4. Observe the runtime through launch diagnostics plus network/UI assertions so failures identify startup, boot, SSE reattach, or stale-after-reconnect regressions directly.
5. If the real proof exposes a launch/readiness bug, fix it at `src/web-mode.ts` or the shared runtime seam instead of hiding it behind longer arbitrary sleeps.

## Must-Haves

- [ ] One shared launched-host browser harness can launch from repo root or fixture cwd
- [ ] Refresh and reopen continuity are proven against the real packaged host
- [ ] Browser-context boot and SSE attach checks remain the authoritative readiness proof
- [ ] Failures localize to launch, boot, or reconnect seams instead of generic timeout noise

## Verification

- `node --import ./src/resources/extensions/gsd/tests/resolve-ts.mjs --experimental-strip-types --test src/tests/integration/web-mode-runtime.test.ts src/tests/integration/web-mode-onboarding.test.ts`
- The runtime tests must fail by naming launch, boot, SSE attach, or reconnect continuity regressions if the assembled host path drifts

## Observability Impact

- Signals added/changed: reusable launch diagnostics, browser-visible reconnect assertions, and shared network inspection around `/api/boot` and `/api/session/events`
- How a future agent inspects this: run the launched-host integration tests and inspect the shared harness helpers plus runtime stderr and page-level assertions
- Failure state exposed: repo-root versus fixture-cwd launch bugs, cold-boot failures, and reload/reopen reattach regressions become explicit test failures instead of opaque browser timeouts

## Inputs

- `src/tests/integration/web-mode-runtime.test.ts` — current repo-root-only packaged-host smoke and reload targets to extend
- `src/tests/integration/web-mode-onboarding.test.ts` — duplicate packaged-host launch helper and browser attach patterns to consolidate
- `src/web-mode.ts` — launch readiness window and packaged-host startup seam used by the real CLI path
- S03 summary — browser-context verification and bounded readiness are already the trusted runtime-proof pattern and should not regress to Node-side polling

## Expected Output

- `src/tests/integration/web-mode-runtime-harness.ts` — shared packaged-host launch, browser-open stub, and cleanup utilities with configurable cwd support
- `src/tests/integration/web-mode-runtime.test.ts` — refresh/reopen continuity proof against the real launched host
- `src/tests/integration/web-mode-onboarding.test.ts` — reuse of the shared launched-host harness so runtime paths stay aligned
- `src/web-mode.ts` — any narrowly scoped readiness fix required by the real launched-host proof
