---
id: T03
parent: S04
milestone: M002
provides:
  - Seeded packaged-host runtime fixtures for deterministic current-project session and interrupted-run browser recovery scenarios
  - Real packaged-host browser proof that recovery diagnostics stay redacted, actionable, and truthful across refresh, reload, and reopen
  - Recovery diagnostics now prefer the best current-project resumable session when the live bridge session is outside the current-project browser session set
key_files:
  - src/tests/integration/web-mode-runtime-fixtures.ts
  - src/tests/integration/web-mode-runtime.test.ts
  - src/tests/integration/web-mode-runtime-harness.ts
  - src/web/recovery-diagnostics-service.ts
  - src/tests/web-recovery-diagnostics-contract.test.ts
  - .gsd/REQUIREMENTS.md
  - .gsd/milestones/M002/M002-ROADMAP.md
  - .gsd/milestones/M002/slices/S04/S04-SUMMARY.md
key_decisions:
  - Recovery diagnostics should inspect the best current-project resumable session instead of blindly following an out-of-scope live bridge session
patterns_established:
  - Seeded packaged-host recovery fixtures should mirror the standalone host’s real cwd/session-dir resolution variants so runtime proofs stay aligned with launch reality
  - Recovery runtime proof should pair `/api/recovery` payload assertions with browser-visible recovery markers and action ids through refresh, reload, and reopen
observability_surfaces:
  - /api/recovery payload and browser action ids
  - seeded runtime fixture files under src/tests/integration/web-mode-runtime-fixtures.ts
  - packaged-host launcher stderr `status=started`
  - browser recovery/session markers and `/api/session/browser` / `/api/recovery` waits in the runtime proof
duration: 1 session
verification_result: passed
completed_at: 2026-03-15T18:10:00Z
blocker_discovered: false
---

# T03: Prove interrupted-run browser recovery with a seeded temp project and close R011

**Added seeded packaged-host recovery fixtures, fixed current-project recovery-session selection, proved interrupted-run browser recovery on the real standalone host, and closed R011/M002 based on passing assembled browser evidence.**

## What Happened

I added `src/tests/integration/web-mode-runtime-fixtures.ts` so the real packaged-host runtime suite can seed deterministic current-project sessions and interrupted-run evidence into temp projects instead of relying on empty temp homes. The fixture builder writes realistic `.gsd` roadmap/task artifacts plus session JSONL files that include interrupted-run signals, redactable auth failure evidence, and alternate current-project sessions for the browser recovery → resume path.

I rewired `src/tests/integration/web-mode-runtime.test.ts` to use those fixtures in two ways:
- the daily-use packaged-host proof now seeds a current-project session before launch, which makes `/resume` a real current-project browser path instead of an empty-state assumption
- the new interrupted-run packaged-host proof launches `gsd --web` from a seeded temp project, opens the recovery surface, refreshes `/api/recovery`, exercises the authoritative recovery → resume browser action, and proves the recovery state stays truthful after page reload and full page reopen

While running that proof, the real standalone host exposed a real bug in `src/web/recovery-diagnostics-service.ts`: the recovery route could inspect the bridge’s live session file even when that session was outside the current-project browser session set. In practice that meant the browser could show truthful resumable sessions but false interrupted-run recovery details. I fixed the service to prefer the best current-project resumable session when the live bridge session is out of scope, and to align the recovery payload’s active session id/path with the selected current-project session.

I also tightened `src/tests/web-recovery-diagnostics-contract.test.ts` so route-level failures now localize immediately if recovery action shaping, redaction, or current-project session fallback drifts again.

Once the real packaged-host browser proof was green, I updated the closure docs:
- moved R011 from active to validated in `.gsd/REQUIREMENTS.md`
- marked S04 complete and M002 closed in `.gsd/milestones/M002/M002-ROADMAP.md`
- recorded the final slice closure in `.gsd/milestones/M002/slices/S04/S04-SUMMARY.md`

## Verification

Passed:

- `node --import ./src/resources/extensions/gsd/tests/resolve-ts.mjs --experimental-strip-types --test src/tests/integration/web-mode-runtime.test.ts src/tests/web-recovery-diagnostics-contract.test.ts`
- `node --import ./src/resources/extensions/gsd/tests/resolve-ts.mjs --experimental-strip-types --test src/tests/web-recovery-diagnostics-contract.test.ts`
- `npm run build:web-host`

Final slice-level verification also passed:

- `node --import ./src/resources/extensions/gsd/tests/resolve-ts.mjs --experimental-strip-types --test src/tests/integration/web-mode-runtime.test.ts src/tests/integration/web-mode-onboarding.test.ts src/tests/integration/web-mode-assembled.test.ts`
- `node --import ./src/resources/extensions/gsd/tests/resolve-ts.mjs --experimental-strip-types --test src/tests/web-command-parity-contract.test.ts src/tests/web-session-parity-contract.test.ts src/tests/web-live-state-contract.test.ts src/tests/web-recovery-diagnostics-contract.test.ts`
- `npm run build:web-host`

Packaged-host browser proof covered:
- repo-root refresh/reopen continuity
- daily-use browser controls on the real shipped shell
- seeded interrupted-run recovery diagnostics with refresh/reload/reopen continuity and no secret leakage

## Diagnostics

Fastest follow-up inspection paths:
- `src/tests/integration/web-mode-runtime-fixtures.ts` — seeded current-project and interrupted-run packaged-host fixtures
- `src/web/recovery-diagnostics-service.ts` — current-project recovery-session selection logic
- `src/tests/web-recovery-diagnostics-contract.test.ts` — fast regression for action shaping, redaction, and out-of-scope live-session fallback
- `src/tests/integration/web-mode-runtime.test.ts` — authoritative packaged-host browser proof for refresh/reopen/daily-use/recovery behavior

## Deviations

- none

## Known Issues

- `npm run build:web-host` still emits the existing optional `@gsd/native` warning during Git route bundling, but the standalone host build passes.
- Node test runs still emit non-blocking `MODULE_TYPELESS_PACKAGE_JSON` warnings for some `web/` imports.

## Files Created/Modified

- `src/tests/integration/web-mode-runtime-fixtures.ts` — new seeded packaged-host runtime fixture builder for current-project sessions and interrupted-run recovery scenarios
- `src/tests/integration/web-mode-runtime.test.ts` — seeded daily-use/runtime recovery proof wiring and real packaged-host refresh/reopen recovery assertions
- `src/tests/integration/web-mode-runtime-harness.ts` — shared launched-host assertion now accepts the real packaged-host session-dir candidates and more tolerant cold-boot follow-up probes
- `src/web/recovery-diagnostics-service.ts` — recovery route now falls back to the best current-project resumable session when the live bridge session is out of scope
- `src/tests/web-recovery-diagnostics-contract.test.ts` — tighter action-shaping/redaction assertions plus the out-of-scope live-session fallback regression
- `.gsd/REQUIREMENTS.md` — moved R011 to validated
- `.gsd/milestones/M002/M002-ROADMAP.md` — marked S04 complete and recorded milestone closure status
- `.gsd/milestones/M002/slices/S04/S04-SUMMARY.md` — recorded final slice closure against the real packaged-host browser proof
