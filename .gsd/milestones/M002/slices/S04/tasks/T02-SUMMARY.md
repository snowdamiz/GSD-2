---
id: T02
parent: S04
milestone: M002
provides:
  - Partial packaged-host Playwright proof for daily-use slash and click browser controls, covering real recovery refresh, built-in execute/reject paths, and shipped entrypoints for model/thinking/session/settings/auth/Git surfaces
key_files:
  - src/tests/integration/web-mode-runtime.test.ts
key_decisions:
  - Kept the recovery runtime proof on the unconditional refresh_diagnostics browser action after the packaged host showed retry/auth recovery actions are conditional on live failure state
patterns_established:
  - Daily-use packaged-host parity proof should assert shipped data-testid markers plus narrow /api/recovery, /api/git, /api/session/browser, and /api/session/command evidence instead of store calls
observability_surfaces:
  - Packaged-host Playwright assertions on command-surface markers, terminal notices, and targeted route/command responses
duration: 2h20m
verification_result: failed
completed_at: 2026-03-15T18:17:30Z
blocker_discovered: false
---

# T02: Exercise daily-use browser parity through the real shipped UI

**Added a real packaged-host daily-use browser parity proof, but the new runtime test is still red on the `/resume` current-project session-browser expectation so T02 is not complete yet.**

## What Happened

I expanded `src/tests/integration/web-mode-runtime.test.ts` with one new packaged-host Playwright proof that drives the shipped browser shell through the real UI instead of store calls. The new proof now exercises:

- dashboard recovery entrypoint + recovery refresh action
- typed slash `/new` execution
- typed slash `/share` rejection notice
- typed slash browser surfaces for `/model`, `/thinking`, `/resume`, `/fork`, `/session`, `/compact`, `/settings`, `/login`, and `/logout`
- sidebar click entrypoints for Settings, Git, and Recovery
- narrow packaged-host network evidence on `/api/recovery`, `/api/git`, `/api/session/browser`, and `/api/session/command`

Two runtime-proof corrections were made while debugging:

1. recovery action assertions were moved off `open_retry_controls` / `open_auth_controls` because the real packaged host only exposes those when retry/auth state actually needs attention
2. command-surface closing was pinned to the first visible `Close` button because the sheet exposes both a footer button and a dismiss button with the same accessible name

The remaining failure is in the new `/resume` runtime assertion. The packaged host successfully opens the resume surface and loads `/api/session/browser`, but the test currently assumes a fresh temp-home launch must show at least one visible session result. In the current runtime that assumption is not holding, so the proof needs one more change before T02 can be marked done:

- either seed resumable-session fixture data into the launch temp-home before starting the packaged host
- or relax the proof to accept the shipped empty-state UI when `/api/session/browser` loads successfully but returns zero visible current-project sessions

I did **not** touch assembled coverage, product code, or the slice checkbox because the runtime proof is still failing and I do not have a verified runtime-discovered product bug to mirror yet.

## Verification

Commands run:

- Baseline task verification before the new runtime proof:
  - `node --import ./src/resources/extensions/gsd/tests/resolve-ts.mjs --experimental-strip-types --test src/tests/integration/web-mode-runtime.test.ts src/tests/integration/web-mode-assembled.test.ts src/tests/web-command-parity-contract.test.ts src/tests/web-session-parity-contract.test.ts`
  - Result: passed before the new packaged-host daily-use proof was added
- Focused runtime verification after adding the new proof:
  - `node --import ./src/resources/extensions/gsd/tests/resolve-ts.mjs --experimental-strip-types --test src/tests/integration/web-mode-runtime.test.ts`
  - Result: failed in `real packaged browser shell keeps daily-use slash and click controls live`
  - Current failing assertion: `/resume browser surface: expected at least one current-project session result`

Because the runtime proof is still red, I did **not** rerun the full T02 verification or the slice-level verification as final results.

## Diagnostics

To resume quickly:

1. open `src/tests/integration/web-mode-runtime.test.ts`
2. look at the `real packaged browser shell keeps daily-use slash and click controls live` test
3. inspect the `/resume browser surface` block and either:
   - seed current-project session files into the temp-home sessions dir before launch, or
   - assert the shipped empty-state text instead of requiring a nonzero result count
4. rerun:
   - `node --import ./src/resources/extensions/gsd/tests/resolve-ts.mjs --experimental-strip-types --test src/tests/integration/web-mode-runtime.test.ts`
   - then the T02 verification command
   - then the slice-level verification commands required by `S04-PLAN.md`

Useful observability already in place:

- launcher stderr `status=started`
- `/api/recovery`, `/api/git`, `/api/session/browser`, and `/api/session/command` response waits in the new runtime test
- shipped browser markers such as `command-surface-*`, `sidebar-*`, `dashboard-recovery-summary-entrypoint`, and terminal line text checks

## Deviations

- Wrote a partial recovery summary instead of a completion summary because the new packaged-host runtime proof is still failing.
- Left `T02` unchecked in `S04-PLAN.md` because the required verification has not passed yet.

## Known Issues

- The new packaged-host runtime proof assumes `/api/session/browser` must always produce at least one visible session row in a fresh temp-home launch. The current runtime disproved that assumption.
- No deterministic assembled mirror was added yet because the failing behavior is still inside the new runtime proof’s assumption, not a verified shipped product regression.

## Files Created/Modified

- `src/tests/integration/web-mode-runtime.test.ts` — added packaged-host daily-use browser parity helpers and the new runtime proof; currently failing on the `/resume` result-count expectation
- `.gsd/milestones/M002/slices/S04/tasks/T02-SUMMARY.md` — partial durable recovery summary for this timed-out unit
- `.gsd/STATE.md` — updated the next action to the specific remaining T02 runtime fix and rerun sequence
