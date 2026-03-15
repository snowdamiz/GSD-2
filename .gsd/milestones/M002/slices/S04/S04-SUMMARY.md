---
id: S04
parent: M002
milestone: M002
provides:
  - Final packaged-host browser proof that `gsd --web` survives refresh, reopen, daily-use browser control paths, and seeded interrupted-run recovery
  - Seeded runtime fixtures plus a shared packaged-host harness that exercise repo-root and temp-project launches on the real standalone host
  - Requirement and milestone closure evidence for R011 and M002 based on real browser/runtime verification rather than route-only confidence
requires:
  - slice: S02
    provides: Browser-native current-project session, settings/auth, git, and shell parity surfaces
  - slice: S03
    provides: Targeted live freshness and browser recovery diagnostics with typed action ids
affects:
  - M002 closure
key_files:
  - src/tests/integration/web-mode-runtime-fixtures.ts
  - src/tests/integration/web-mode-runtime-harness.ts
  - src/tests/integration/web-mode-runtime.test.ts
  - src/web/recovery-diagnostics-service.ts
  - src/tests/web-recovery-diagnostics-contract.test.ts
  - .gsd/REQUIREMENTS.md
  - .gsd/milestones/M002/M002-ROADMAP.md
key_decisions:
  - D038 — reuse one shared packaged-host Playwright/runtime harness with configurable launch cwd and seeded temp-project fixtures for final assembly proof
  - D039 — recovery diagnostics should inspect the best current-project resumable session when the live bridge session is outside the current-project session set
patterns_established:
  - Final browser hardening proof should assert launcher stderr, browser-visible `/api/boot` and `/api/session/events` traffic, recovery route payload truth, and stable browser markers through reload/reopen
  - Seeded packaged-host recovery fixtures should mirror the host’s real cwd/session-dir resolution variants so runtime proofs stay aligned with standalone-host behavior
observability_surfaces:
  - packaged-host launcher stderr `status=started`
  - browser-visible `/api/boot`, `/api/session/events`, `/api/session/browser`, and `/api/recovery` traffic
  - seeded runtime fixture builders in `src/tests/integration/web-mode-runtime-fixtures.ts`
  - recovery/browser `data-testid` markers in the shared command surface and shell
  - `src/tests/web-recovery-diagnostics-contract.test.ts`
drill_down_paths:
  - .gsd/milestones/M002/slices/S04/tasks/T01-SUMMARY.md
  - .gsd/milestones/M002/slices/S04/tasks/T02-SUMMARY.md
  - .gsd/milestones/M002/slices/S04/tasks/T03-SUMMARY.md
duration: 1 session
verification_result: passed
completed_at: 2026-03-15T18:10:00Z
---

# S04: Final assembled browser hardening proof

**Closed the final M002 runtime risk with real packaged-host browser proof for refresh, reopen, daily-use controls, and seeded interrupted-run recovery, then moved R011 and M002 to validated completion.**

## What Happened

S04 finished the assembled proof that M002 had been building toward.

T01 had already established the shared packaged-host browser harness and proved refresh/reopen continuity on the real standalone host. T02 had already moved the daily-use browser controls onto the real shell and proved that model, thinking, session, settings/auth, Git, and recovery entrypoints no longer sit inert in the browser.

T03 completed the last missing runtime seam: interrupted-run recovery under real packaged-host conditions. I added `src/tests/integration/web-mode-runtime-fixtures.ts` so the packaged-host runtime tests can seed deterministic current-project sessions and interrupted-run evidence into temp projects instead of depending on fresh-home luck. The runtime proof in `src/tests/integration/web-mode-runtime.test.ts` now exercises two real packaged-host scenarios:
- a repo-root packaged-host browser shell with seeded current-project session data, proving daily-use slash and click controls stay live
- a seeded temp-project packaged-host launch that opens recovery diagnostics, refreshes `/api/recovery`, exercises the authoritative recovery → resume path, and proves reload/reopen continuity without leaking secrets or raw transcript forensics

While landing that proof, the real packaged host exposed one important runtime bug in `src/web/recovery-diagnostics-service.ts`: the recovery route could inspect the bridge’s live session even when that session was outside the current-project browser session set. That made current-project session browsing truthful but recovery diagnostics untruthful. The fix was to prefer the best current-project resumable session when the live bridge session is out of scope, and to align the recovery payload’s active session id/path with the selected current-project session rather than blindly reflecting bridge state.

I then tightened `src/tests/web-recovery-diagnostics-contract.test.ts` so route-level failures localize immediately if recovery action shaping, redaction, or current-project session selection drifts again.

With that done, the full S04 slice verification passed: packaged-host runtime proof, onboarding/runtime/assembled integrations, contract verification, and standalone build. That gave M002 enough real browser evidence to close R011 and mark the milestone complete.

## Verification

Passed:

- `node --import ./src/resources/extensions/gsd/tests/resolve-ts.mjs --experimental-strip-types --test src/tests/integration/web-mode-runtime.test.ts src/tests/integration/web-mode-onboarding.test.ts src/tests/integration/web-mode-assembled.test.ts`
- `node --import ./src/resources/extensions/gsd/tests/resolve-ts.mjs --experimental-strip-types --test src/tests/web-command-parity-contract.test.ts src/tests/web-session-parity-contract.test.ts src/tests/web-live-state-contract.test.ts src/tests/web-recovery-diagnostics-contract.test.ts`
- `npm run build:web-host`

Packaged-host browser proof also passed on the real standalone host via:
- repo-root refresh/reopen continuity
- daily-use browser control proof through the real shipped shell
- seeded interrupted-run recovery proof with refresh/reload/reopen continuity and no secret leakage

## Requirements Advanced

- none — S04 closed the remaining open requirement rather than partially advancing another one.

## Requirements Validated

- R011 — Remaining lower-frequency TUI capabilities reach browser parity after the primary loop

## New Requirements Surfaced

- none

## Requirements Invalidated or Re-scoped

- none

## Deviations

- none

## Known Limitations

- `npm run build:web-host` still emits the existing optional `@gsd/native` warning from `native-git-bridge.ts`, but the standalone host builds and stages successfully.
- Node test runs still emit non-blocking `MODULE_TYPELESS_PACKAGE_JSON` warnings for some `web/` imports.

## Follow-ups

- none — M002 is complete. Any further work should start from new scope, deferred requirements, or a follow-on milestone.

## Files Created/Modified

- `src/tests/integration/web-mode-runtime-fixtures.ts` — added seeded packaged-host runtime fixtures for current-project session and interrupted-run recovery proof
- `src/tests/integration/web-mode-runtime-harness.ts` — widened the shared packaged-host harness to accept the real standalone host’s session-dir variants
- `src/tests/integration/web-mode-runtime.test.ts` — added seeded daily-use and interrupted-run packaged-host browser proof across refresh/reopen/recovery paths
- `src/web/recovery-diagnostics-service.ts` — fixed recovery-session selection so browser diagnostics stay current-project truthful under real standalone-host runtime behavior
- `src/tests/web-recovery-diagnostics-contract.test.ts` — tightened redaction/action-shaping coverage and added the out-of-scope live-session fallback regression
- `.gsd/REQUIREMENTS.md` — moved R011 from active to validated
- `.gsd/milestones/M002/M002-ROADMAP.md` — marked S04 complete and recorded milestone closure status

## Forward Intelligence

### What the next milestone should know
- The real packaged-host browser proof is now the authoritative stop condition for browser hardening work; route-only coverage is no longer enough for parity claims.
- Recovery truth in browser mode must stay current-project scoped even when the bridge’s live session comes from a different session-dir view than the browser session browser.

### What's fragile
- `src/tests/integration/web-mode-runtime.test.ts` — the packaged-host proof is intentionally strict about real browser/network markers, so boot/recovery/session-dir behavior drift will surface here first.
- `src/web/recovery-diagnostics-service.ts` — future recovery work must preserve the current-project session-selection logic or the browser can silently regress back to truthful session browsing but false recovery diagnostics.

### Authoritative diagnostics
- `src/tests/integration/web-mode-runtime.test.ts` — best signal for real packaged-host launch, refresh/reopen, daily-use control, and interrupted-run browser regressions
- `src/tests/web-recovery-diagnostics-contract.test.ts` — fastest signal for recovery-session selection, redaction, and action-shaping regressions
- `/api/recovery` plus browser recovery surface markers — authoritative browser-facing recovery truth after the host is running

### What assumptions changed
- “The bridge’s live session is always the right recovery session for the browser to inspect.” — false under the real standalone host; recovery truth must stay scoped to the current-project resumable session set.
- “A single session-dir encoding is enough for seeded packaged-host fixtures.” — false; the final packaged-host proof needed fixture seeding to mirror the host’s real cwd/session-dir resolution behavior.
