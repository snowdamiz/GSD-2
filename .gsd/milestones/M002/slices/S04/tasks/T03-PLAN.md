---
estimated_steps: 5
estimated_files: 7
---

# T03: Prove interrupted-run browser recovery with a seeded temp project and close R011

**Slice:** S04 — Final assembled browser hardening proof
**Milestone:** M002

## Description

The final remaining gap is not route shape; it is whether a real launched `gsd --web` session can show truthful, redacted, actionable recovery state for a current-project interrupted run and stay coherent after reload or reopen. This task adds a deterministic temp-project recovery fixture, proves the browser recovery flow through the real packaged host, and records the requirement and milestone closure that proof earns.

## Steps

1. Create a minimal seeded temp-project fixture builder that writes realistic `.gsd` milestone/plan/session artifacts plus interrupted-run or recovery evidence strong enough to make browser diagnostics deterministic.
2. Launch the real packaged host from that fixture cwd using the shared harness, open the recovery diagnostics surface, and assert the browser sees redacted structured diagnostics plus actionable controls.
3. Follow at least one authoritative browser action path such as refresh diagnostics, open retry controls, open resume controls, or open auth controls, then prove the state stays truthful after page reload and full page reopen.
4. Add or tighten recovery contract coverage so any runtime-discovered redaction or action-shaping bug can be diagnosed without rerunning the full packaged-host proof first.
5. Once the proof is green, update the requirement, roadmap, and slice-closure docs so R011 and M002 reflect validated completion based on real browser evidence.

## Must-Haves

- [ ] A deterministic temp-project fixture can reproduce interrupted-run browser recovery through the real host
- [ ] Browser recovery diagnostics stay redacted, structured, and actionable
- [ ] At least one authoritative recovery action path is proven through reload and reopen
- [ ] Requirement and milestone docs are updated only after the real proof passes

## Verification

- `node --import ./src/resources/extensions/gsd/tests/resolve-ts.mjs --experimental-strip-types --test src/tests/integration/web-mode-runtime.test.ts src/tests/web-recovery-diagnostics-contract.test.ts && npm run build:web-host`
- Packaged-host UAT: run `gsd --web` in the real repo workspace, open the recovery surface, reload or reopen the page, and confirm the browser still exposes actionable recovery guidance without leaking secrets or requiring TUI fallback

## Observability Impact

- Signals added/changed: deterministic recovery fixture data, launched-host recovery assertions, and explicit doc closure tied to passing real-browser proof
- How a future agent inspects this: run the fixture-backed runtime proof, inspect `/api/recovery` assertions and recovery UI markers, then verify R011/M002 status in the docs
- Failure state exposed: interrupted-run detection failures, recovery action drift, stale-after-reload recovery state, and redaction leaks become isolated runtime or contract failures instead of vague browser breakage

## Inputs

- `src/tests/integration/web-mode-runtime-harness.ts` — shared configurable launched-host harness from T01
- `src/web/recovery-diagnostics-service.ts` — authoritative recovery shaping that must stay redacted and browser-action oriented
- `src/tests/web-recovery-diagnostics-contract.test.ts` — the fastest route-level signal for structured recovery payload regressions
- `src/tests/integration/web-mode-runtime.test.ts` — launched-host runtime proof file that will gain the fixture-backed recovery flow
- T02 output — real browser parity flows and runtime markers already established in the shipped shell

## Expected Output

- `src/tests/integration/web-mode-runtime-fixtures.ts` — seeded temp-project builder for deterministic recovery scenarios
- `src/tests/integration/web-mode-runtime.test.ts` — fixture-backed interrupted-run recovery proof through the real launched host
- `src/tests/web-recovery-diagnostics-contract.test.ts` — tightened redaction or action-shaping coverage for any bug exposed by the runtime proof
- `src/web/recovery-diagnostics-service.ts` — only the minimal bug fix surface required if the live proof exposes a real recovery regression
- `.gsd/REQUIREMENTS.md` — R011 moved to validated when the real proof passes
- `.gsd/milestones/M002/M002-ROADMAP.md` — S04 and milestone closure updated after the real browser proof passes
- `.gsd/milestones/M002/slices/S04/S04-SUMMARY.md` — final slice closure recorded against the launched-host browser evidence
