# S04: Final assembled browser hardening proof — Research

**Date:** 2026-03-15

## Requirement Target

- **Active requirement supported:** `R011 — Remaining lower-frequency TUI capabilities reach browser parity after the primary loop`
- **Why S04 matters:** S01-S03 already established the browser command, parity, freshness, and recovery contracts. S04 is the slice that has to prove those contracts hold together through the real `gsd --web` entrypoint under refresh/reopen/interrupted-run stress, so R011 can move from **active** to **validated**.

## Summary

S04 looks like a **proof-first** slice, not a transport-expansion slice. The core browser hardening pieces already exist: authoritative built-in slash-command dispatch, current-project session/settings/auth/Git/browser-shell parity surfaces, typed live-state invalidation over SSE, selective `/api/live-state` refreshes, on-demand `/api/recovery` diagnostics, and a real packaged-host Playwright runtime smoke. I also reran the current assembled/runtime integration baseline:

- `node --import ./src/resources/extensions/gsd/tests/resolve-ts.mjs --experimental-strip-types --test src/tests/integration/web-mode-assembled.test.ts src/tests/integration/web-mode-runtime.test.ts`
- Result: **5/5 passing** in about **51s**, with the live packaged-host runtime test itself taking about **36s**.

The main gap is not missing product plumbing; it is missing **assembled browser proof breadth**. Today the repo proves many S04 ingredients separately: slash-command safety via direct dispatch tests, recovery diagnostics via route-level tests, refresh/reconnect logic via store-level continuity tests, onboarding via a live browser runtime test, and packaged host attach via a live browser runtime smoke. What it does **not** yet prove through the launched host is the full milestone promise: page refresh/reopen continuity, daily-use browser parity controls exercised from real UI affordances, and interrupted-run recovery workflows exercised from the browser shell instead of route-only harnesses.

The biggest surprise is that the launched-host browser harness is already close, but it is currently **repo-root oriented**. `src/tests/integration/web-mode-runtime.test.ts` launches `gsd --web` from the repo root and verifies boot, SSE attach, and recovery-panel visibility. That is enough for cold-start runtime proof, but not enough to create deterministic interrupted-run fixtures or recovery-heavy current-project data. S04 will likely need a variant launch helper that can start the real CLI from a **temporary fixture project cwd** while still pointing at the repo’s loader/build outputs.

## Recommendation

1. **Keep S04 proof-first.** Do not start by adding new browser contracts. Start by extending launched-host browser proof. Only add product code when a real proof case exposes an actual bug.
2. **Reuse the existing packaged-host Playwright harness** from `src/tests/integration/web-mode-runtime.test.ts` and `src/tests/integration/web-mode-onboarding.test.ts`, but factor it so the launched cwd can be either the repo root or a purpose-built temp fixture project.
3. **Add one deterministic temp-project fixture** with minimal real `.gsd` milestone/session artifacts plus seeded interrupted-run evidence. That lets S04 prove recovery flows through the actual launched host instead of route-only fakes.
4. **Prove refresh/reopen in the browser state machine, not with direct route calls.** Use `page.reload()`, page close + new page, and network assertions around `/api/boot`, `/api/session/events`, `/api/live-state`, and `/api/recovery`. Avoid regressing into fake Node-side polling as the primary proof.
5. **Exercise real browser-native daily-use controls via existing test ids** instead of calling store functions or route handlers directly: `/model`, `/thinking`, session resume/fork controls, recovery actions, sidebar Git/Settings, and auth-management affordances.
6. **Treat `/api/boot` as a witness, not the live transport.** Keep using it for startup/reconnect snapshots only. For live freshness proof, watch SSE invalidation behavior and selective `/api/live-state` reloads.

A good S04 proof matrix would be:

- **Launch + attach:** existing packaged-host smoke stays green
- **Refresh continuity:** reload the page and confirm the live session, recovery summary, and current-project scope stay truthful
- **Reopen continuity:** close the page, open a new page to the same host, and confirm the bridge/session reattach without TUI fallback
- **Daily-use parity:** exercise model/thinking/session/recovery/auth surfaces through browser UI
- **Interrupted-run recovery:** launch against a seeded temp project, open recovery diagnostics, verify redaction + typed actions, and follow at least one browser action path (`open_retry_controls`, `open_resume_controls`, `open_auth_controls`, `refresh_diagnostics`, `refresh_workspace`)

## Don't Hand-Roll

| Problem | Existing Solution | Why Use It |
|---------|------------------|------------|
| Real launched-host browser proof | `src/tests/integration/web-mode-runtime.test.ts` and `src/tests/integration/web-mode-onboarding.test.ts` | They already solve packaged-host launch, fake browser-open stubs, Playwright attach, and cleanup. S04 should extend these instead of inventing a second runtime harness. |
| Safe built-in browser slash-command behavior | `web/lib/browser-slash-command-dispatch.ts` + `packages/pi-coding-agent/src/core/slash-commands.ts` | This is already the authoritative safety boundary between built-ins, browser surfaces, local actions, RPC, and prompt passthrough. |
| Live freshness | `src/web/bridge-service.ts` SSE invalidations + `web/app/api/live-state/route.ts` + `web/lib/gsd-workspace-store.tsx` | S03 already established the correct contract: invalidate narrowly, reload selectively, keep `/api/boot` snapshot-shaped. |
| Interrupted-run / doctor / validation recovery shaping | `src/web/recovery-diagnostics-service.ts` + `web/app/api/recovery/route.ts` | This already builds redacted browser-native diagnostics and typed browser actions. S04 should exercise it through the real UI, not rebuild it. |
| Browser parity affordance wiring | `web/components/gsd/command-surface.tsx`, `web/components/gsd/dashboard.tsx`, `web/components/gsd/sidebar.tsx` | The existing test ids and click paths make live browser automation feasible without adding throwaway UI hooks. |
| Session continuity after reconnect | `web/lib/gsd-workspace-store.tsx` + `src/tests/web-continuity-contract.test.ts` | The reconnect/visibility-refresh semantics already exist; S04 needs runtime proof, not a second continuity design. |

## Existing Code and Patterns

- `src/tests/integration/web-mode-runtime.test.ts` — real `gsd --web` packaged-host smoke using Playwright. Today it proves launch, `/api/boot`, first SSE event, shell attach, and recovery panel visibility. This is the best starting point for S04 runtime expansion.
- `src/tests/integration/web-mode-onboarding.test.ts` — real launched-host browser onboarding proof. Reuse its browser automation patterns and unlocked/locked workspace assertions for auth-related S04 flows.
- `src/tests/integration/web-mode-assembled.test.ts` — deterministic fake-bridge integration coverage for assembled lifecycle, settings parity, recovery payload shape, and slash-command safety. Keep it for precise edge cases, but do not mistake it for launched-host proof.
- `src/web-mode.ts` — packaged-host bootstrap and bounded readiness waiting. The current readiness path already has S03’s cold-boot hardening; S04 should avoid adding startup work that makes this slower or flakier.
- `web/lib/gsd-workspace-store.tsx` — the real browser continuity/freshness state machine: visibility-driven soft refresh, SSE reconnect soft refresh, live invalidation handling, selective `/api/live-state` reloads, and automatic refresh of open Git/recovery/session surfaces.
- `web/components/gsd/app-shell.tsx` — persists active view in `sessionStorage` keyed by project cwd and updates browser title from `titleOverride`. Useful for refresh behavior, but not sufficient as proof of session continuity by itself.
- `src/web/bridge-service.ts` — long-lived per-project bridge singleton, workspace-index cache invalidation policy, boot payload assembly, and live-state invalidation emission. This remains the authoritative runtime seam.
- `src/web/recovery-diagnostics-service.ts` — builds browser-native recovery summaries/actions from bridge state, onboarding auth refresh state, workspace validation, doctor, and session forensics while redacting secrets.
- `web/components/gsd/command-surface.tsx` — already exposes stable markers and actions for model, thinking, resume, fork, recovery, auth, and Git surfaces (`command-surface-apply-model`, `command-surface-apply-thinking`, `command-surface-apply-resume`, `command-surface-apply-fork`, `command-surface-logout-provider`, recovery action ids, session-browser markers).
- `web/components/gsd/dashboard.tsx` and `web/components/gsd/sidebar.tsx` — already expose browser entrypoints into recovery and session workflows (`dashboard-recovery-summary-entrypoint`, `dashboard-session-picker`, `sidebar-git-button`, `sidebar-settings-button`, `sidebar-recovery-summary-entrypoint`).

## Constraints

- **Do not solve freshness by polling `/api/boot`.** `src/web/bridge-service.ts` still caches workspace index state for 30 seconds; S03 intentionally moved live truth to SSE invalidations plus `/api/live-state`.
- **Cold-start budget is real.** The current packaged runtime test took ~36s just for the launch/attach proof; S04 must be careful not to thicken startup or create brittle timing assumptions.
- **Recovery diagnostics are intentionally on-demand and child-process backed.** `src/web/recovery-diagnostics-service.ts` shells out to doctor/session-forensics providers, so fixture projects need realistic enough `.gsd` + session state to make recovery proof deterministic.
- **The current live launch helper is cwd-specific.** `src/tests/integration/web-mode-runtime.test.ts` launches from the repo root; S04 will need an arbitrary-cwd variant to prove interrupted-run and current-project-specific recovery scenarios against fixture projects.
- **Store observability is better than UI observability.** `softBootRefreshCount` and `targetedRefreshCount` exist in the store, but they are not currently rendered in the browser shell. Runtime proof may need to observe network traffic or add narrowly scoped test visibility if DOM-only assertions become too indirect.
- **SessionStorage is not the continuity contract.** `web/components/gsd/app-shell.tsx` persists the active view across reload in the same tab, but real session continuity still comes from boot + bridge + session files.

## Common Pitfalls

- **Mistaking route-level proof for launched-host proof** — `web-mode-assembled.test.ts` is valuable, but S04 must validate browser behavior through the real `gsd --web` host, not only through imported routes and fake bridge fixtures.
- **Using `/api/boot` as the main refresh oracle** — that would hide whether S03’s invalidation-driven freshness contract still works. Watch `/api/session/events` and `/api/live-state` instead.
- **Treating active-view restore as “reopen solved”** — `sessionStorage` only helps view chrome within a tab lifecycle. Reopen continuity should assert live session/scope/recovery truth after a fresh page attach.
- **Overfitting proof to repo-root data** — the current runtime harness is fine for cold-start smoke, but interrupted-run recovery needs a deterministic temp project fixture or the proof becomes nondeterministic.
- **Adding new browser transport before proving a bug exists** — most of the plumbing is already there. S04 should only change product code when the live proof exposes a real failure.

## Open Risks

- The packaged runtime proof is already expensive enough that adding too many browser steps to one monolithic test could reintroduce cold-start flakiness.
- A temp-project launched-host harness may surface path/bootstrap assumptions that were invisible when everything ran from the repo root.
- Interrupted-run recovery fixtures can become brittle if doctor/forensics expectations depend on more real project structure than the minimal fixture initially provides.
- Auth-management proof in a launched host may need careful choice between preseeded auth and browser onboarding flow to keep tests fast while still exercising logout/auth-refresh semantics honestly.
- The existing `MODULE_TYPELESS_PACKAGE_JSON` warnings from `web/package.json` are still noisy and may obscure real failures in a long S04 integration run.

## Skills Discovered

| Technology | Skill | Status |
|------------|-------|--------|
| Playwright | `currents-dev/playwright-best-practices-skill@playwright-best-practices` | available (not installed) — `npx skills add currents-dev/playwright-best-practices-skill@playwright-best-practices` |
| Next.js App Router | `wshobson/agents@nextjs-app-router-patterns` | available (not installed) — `npx skills add wshobson/agents@nextjs-app-router-patterns` |
| React | `vercel-labs/agent-skills@vercel-react-best-practices` | available (not installed) — `npx skills add vercel-labs/agent-skills@vercel-react-best-practices` |
| Server-Sent Events | `dadbodgeoff/drift@sse-streaming` | available (not installed) — `npx skills add dadbodgeoff/drift@sse-streaming` |

## Sources

- Real packaged-host runtime/browser proof exists but is still only a cold-start attach smoke plus recovery-panel open (source: `src/tests/integration/web-mode-runtime.test.ts`)
- Real launched-host onboarding/browser proof already exists and is reusable for S04 auth/browser-flow work (source: `src/tests/integration/web-mode-onboarding.test.ts`)
- Deterministic assembled integration proof already covers lifecycle, settings parity, recovery payload shape, and slash-command safety without the real launched host (source: `src/tests/integration/web-mode-assembled.test.ts`)
- Browser continuity logic already performs visibility-triggered soft boot refresh and reconnect-triggered soft boot refresh (source: `web/lib/gsd-workspace-store.tsx`, `src/tests/web-continuity-contract.test.ts`)
- Live freshness already rides typed `live_state_invalidation` SSE events plus narrow `/api/live-state` reloads instead of boot polling (source: `src/web/bridge-service.ts`, `web/app/api/live-state/route.ts`, `src/tests/web-live-state-contract.test.ts`)
- Recovery diagnostics are already redacted, on-demand, and action-oriented with typed browser action ids (source: `src/web/recovery-diagnostics-service.ts`, `web/app/api/recovery/route.ts`, `web/lib/command-surface-contract.ts`, `web/components/gsd/command-surface.tsx`)
- Browser-native daily-use parity surfaces already exist for model, thinking, resume, fork, auth, Git, and recovery, with stable UI markers for automation (source: `web/components/gsd/command-surface.tsx`, `web/components/gsd/dashboard.tsx`, `web/components/gsd/sidebar.tsx`)
- Built-in slash commands are already safely partitioned into RPC, surface, local, prompt, and reject outcomes using the authoritative built-in command list (source: `web/lib/browser-slash-command-dispatch.ts`, `packages/pi-coding-agent/src/core/slash-commands.ts`)
- Existing RPC transport already covers the session/model/thinking/compaction/export/fork flows S04 needs to exercise in-browser (source: `packages/pi-coding-agent/src/modes/rpc/rpc-types.ts`)
- Baseline integration status at research time: `web-mode-assembled` + `web-mode-runtime` passed 5/5 in ~51s, confirming that S04 starts from a green proof baseline rather than an active regression (source: local command run on 2026-03-15)
