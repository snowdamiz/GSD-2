# S04: Final assembled browser hardening proof

**Goal:** Prove that the browser parity, freshness, and recovery work shipped in S01-S03 holds together through the real packaged `gsd --web` entrypoint under refresh, reopen, interrupted-run, and daily-use browser workflows, then close R011 with browser-first evidence instead of route-only confidence.
**Demo:** A real `gsd --web` launch survives refresh and reopen, daily-use browser controls stay live and non-inert, a seeded interrupted-run project exposes actionable redacted recovery guidance in-browser, and the assembled proof shows known built-ins, current-project state, live freshness, and recovery actions remain correct without opening the TUI.

R011 is the only Active requirement this slice still supports, and the remaining risk is assembled runtime behavior rather than missing product plumbing. I’m grouping the work by the evidence seam that can fail. First, harden and generalize the real launched-host browser harness so repo-root and fixture-project proof both run through the same packaged-host path, while refresh/reopen continuity is proven where users actually feel it. Second, exercise the daily-use browser affordances from the real UI so S01-S03’s contract work is re-proven against the shipped shell instead of only via route-level tests. Third, add a deterministic fixture-backed interrupted-run recovery proof and use it to close the remaining requirement/milestone validation. Verification stays proof-first: small contract tests keep the regressions local, but the authoritative stop condition is launched-host Playwright coverage plus a final packaged-host browser smoke/UAT pass.

## Must-Haves

- The packaged-host browser proof can launch `gsd --web` from either the repo root or a seeded temp-project cwd without inventing a second runtime harness
- Refresh and reopen are exercised through real browser reload/new-page behavior and prove current-project scope, active-session attach, live freshness, and recovery summary truth after reconnect
- Daily-use browser controls in scope for R011 — model, thinking, session browse/resume/fork, settings/auth, Git, and recovery entrypoints — are exercised from real UI affordances or typed slash input, and no visible control remains inert
- A deterministic interrupted-run fixture proves browser recovery diagnostics, redaction, and at least one authoritative browser action path through the real launched host
- Integration, runtime, and final browser/UAT verification are strong enough to move R011 from active to validated and close M002

## Proof Level

- This slice proves: final-assembly
- Real runtime required: yes
- Human/UAT required: yes

## Verification

- `node --import ./src/resources/extensions/gsd/tests/resolve-ts.mjs --experimental-strip-types --test src/tests/integration/web-mode-runtime.test.ts src/tests/integration/web-mode-onboarding.test.ts src/tests/integration/web-mode-assembled.test.ts`
- `node --import ./src/resources/extensions/gsd/tests/resolve-ts.mjs --experimental-strip-types --test src/tests/web-command-parity-contract.test.ts src/tests/web-session-parity-contract.test.ts src/tests/web-live-state-contract.test.ts src/tests/web-recovery-diagnostics-contract.test.ts`
- `npm run build:web-host`
- Packaged-host UAT: launch real `gsd --web` against the repo workspace, then confirm refresh, reopen, recovery diagnostics, and at least one daily-use browser control path complete entirely in-browser with no visible inert control and no TUI fallback
- Failure-path proof must explicitly catch repo-root launch regressions, fixture-cwd launch regressions, refresh/reopen reattach failures, stale-after-reconnect live-state bugs, interrupted-run recovery-action failures, and any secret leakage through browser diagnostics

## Observability / Diagnostics

- Runtime signals: launcher `status=started` stderr diagnostics, `/api/session/events` `bridge_status` and `live_state_invalidation` events, selective `/api/live-state` reloads, and `/api/recovery` status plus browser action ids
- Inspection surfaces: launched-host Playwright network assertions, browser `data-testid` markers on connection/scope/session/recovery/settings/Git surfaces, and deterministic temp-project fixture files for current-project session/recovery state
- Failure visibility: launch stderr, boot status, first SSE payload, refresh/reopen request flow, command-surface pending/error state, recovery diagnostics load state, and visible browser action availability after reconnect
- Redaction constraints: tests may seed fake auth/recovery failures, but browser-visible payloads and assertions must keep secrets and raw sensitive transcript content redacted

## Integration Closure

- Upstream surfaces consumed: `src/tests/integration/web-mode-runtime.test.ts`, `src/tests/integration/web-mode-onboarding.test.ts`, `src/tests/integration/web-mode-assembled.test.ts`, `src/web-mode.ts`, `web/lib/gsd-workspace-store.tsx`, `web/components/gsd/command-surface.tsx`, `web/components/gsd/dashboard.tsx`, `web/components/gsd/sidebar.tsx`, `web/app/api/boot/route.ts`, `web/app/api/live-state/route.ts`, and `web/app/api/recovery/route.ts`
- New wiring introduced in this slice: one shared launched-host browser test harness with configurable launch cwd and seeded fixture support, plus any narrowly scoped UI/store/runtime fixes the real browser proof exposes
- What remains before the milestone is truly usable end-to-end: nothing once this slice’s proof passes and R011/M002 closure docs are updated

## Tasks

- [x] **T01: Generalize the launched-host browser harness and prove refresh/reopen continuity** `est:1h15m`
  - Why: The current packaged-host proof is repo-root-only cold-start smoke; S04 cannot honestly prove refresh, reopen, or fixture-backed recovery until the real browser harness can launch from arbitrary current-project roots and localize launch/reattach failures.
  - Files: `src/tests/integration/web-mode-runtime.test.ts`, `src/tests/integration/web-mode-onboarding.test.ts`, `src/tests/integration/web-mode-runtime-harness.ts`, `src/web-mode.ts`
  - Do: Extract the duplicated packaged-host Playwright launch utilities into a shared runtime harness that still uses the repo loader/build artifacts but accepts launch cwd, temp home, and seeded fixture inputs. Extend the real runtime proof to cover browser reload and page close/reopen against the same host, asserting truthful `/api/boot` startup state, first SSE attach, current-project scope, active session banner, and recovery summary after reconnect. If the real proof exposes a launcher/readiness bug, fix it at the runtime seam instead of masking it with extra sleeps.
  - Verify: `node --import ./src/resources/extensions/gsd/tests/resolve-ts.mjs --experimental-strip-types --test src/tests/integration/web-mode-runtime.test.ts src/tests/integration/web-mode-onboarding.test.ts`
  - Done when: repo-root launched-host proof covers cold start plus refresh/reopen continuity, the harness can target non-repo fixture cwd values, and failures point to launch, boot, or SSE reattach instead of generic timeout noise
- [x] **T02: Exercise daily-use browser parity through the real shipped UI** `est:1h30m`
  - Why: S01-S03 proved the contracts, but R011 is not validated until the visible browser affordances themselves are exercised end-to-end and shown to execute, open a surface, or reject clearly instead of going inert.
  - Files: `src/tests/integration/web-mode-runtime.test.ts`, `src/tests/integration/web-mode-assembled.test.ts`, `web/components/gsd/command-surface.tsx`, `web/components/gsd/dashboard.tsx`, `web/components/gsd/sidebar.tsx`, `web/lib/gsd-workspace-store.tsx`
  - Do: Extend the launched-host browser proof to drive the stable model, thinking, session, settings/auth, Git, and recovery entrypoints from the actual UI and typed slash input where that is the intended UX. Assert browser-visible command-surface state, transcript notices, or targeted network activity rather than calling store functions directly. Mirror any real runtime bug with a deterministic assembled regression, and keep product changes narrowly scoped to real inertness or missing browser visibility discovered by the proof.
  - Verify: `node --import ./src/resources/extensions/gsd/tests/resolve-ts.mjs --experimental-strip-types --test src/tests/integration/web-mode-runtime.test.ts src/tests/integration/web-mode-assembled.test.ts src/tests/web-command-parity-contract.test.ts src/tests/web-session-parity-contract.test.ts`
  - Done when: every daily-use browser control still in scope for M002 is either proven live or proven to reject clearly from the real browser shell, and the combined runtime/assembled proof fails if any visible control falls back to prompt text or becomes inert
- [x] **T03: Prove interrupted-run browser recovery with a seeded temp project and close R011** `est:1h30m`
  - Why: The last unproven risk is recovery under real current-project lifecycle stress; route-level recovery coverage is already green, so S04 must prove interrupted-run diagnostics and actions through the real launched host, then record the requirement and milestone closure those proofs earn.
  - Files: `src/tests/integration/web-mode-runtime.test.ts`, `src/tests/integration/web-mode-runtime-fixtures.ts`, `src/tests/web-recovery-diagnostics-contract.test.ts`, `src/web/recovery-diagnostics-service.ts`, `.gsd/REQUIREMENTS.md`, `.gsd/milestones/M002/M002-ROADMAP.md`, `.gsd/milestones/M002/slices/S04/S04-SUMMARY.md`
  - Do: Create a minimal seeded temp-project fixture with realistic `.gsd` roadmap/session artifacts and interrupted-run evidence, launch the packaged host from that cwd, open recovery diagnostics, and follow at least one authoritative browser action path such as refresh, retry controls, resume controls, or auth controls through reload/reopen. Assert `/api/recovery` redaction and targeted refresh behavior remain truthful in the live browser proof, fix only the real bugs that proof exposes, and update the requirement, roadmap, and slice-closure docs once the proof is green.
  - Verify: `node --import ./src/resources/extensions/gsd/tests/resolve-ts.mjs --experimental-strip-types --test src/tests/integration/web-mode-runtime.test.ts src/tests/web-recovery-diagnostics-contract.test.ts && npm run build:web-host`
  - Done when: a seeded interrupted-run project passes real launched-host browser recovery proof without leaking secrets, refresh/reopen keeps the recovery state actionable, and the docs can move R011 and M002 from open proof targets to validated closure

## Files Likely Touched

- `src/tests/integration/web-mode-runtime.test.ts`
- `src/tests/integration/web-mode-onboarding.test.ts`
- `src/tests/integration/web-mode-assembled.test.ts`
- `src/tests/integration/web-mode-runtime-harness.ts`
- `src/tests/integration/web-mode-runtime-fixtures.ts`
- `src/web-mode.ts`
- `web/lib/gsd-workspace-store.tsx`
- `web/components/gsd/command-surface.tsx`
- `web/components/gsd/dashboard.tsx`
- `web/components/gsd/sidebar.tsx`
- `src/web/recovery-diagnostics-service.ts`
- `src/tests/web-recovery-diagnostics-contract.test.ts`
- `.gsd/REQUIREMENTS.md`
- `.gsd/milestones/M002/M002-ROADMAP.md`
- `.gsd/milestones/M002/slices/S04/S04-SUMMARY.md`
