---
estimated_steps: 5
estimated_files: 6
---

# T02: Exercise daily-use browser parity through the real shipped UI

**Slice:** S04 — Final assembled browser hardening proof
**Milestone:** M002

## Description

S01-S03 already established safe command routing, browser-native parity surfaces, and live freshness. This task re-proves those promises through the real shipped browser shell by driving the visible daily-use controls the way a browser user actually does, and by pinning any runtime-discovered bugs with deterministic assembled coverage.

## Steps

1. Use the shared launched-host harness from T01 to drive the real UI entrypoints for the remaining daily-use browser controls in scope: model, thinking, session browse/resume/fork, settings/auth, Git, and recovery surfaces.
2. Exercise typed slash input where that is the intended browser UX and assert that built-ins execute, open a browser surface, or reject clearly instead of falling through to prompt text.
3. Assert browser-visible outcomes through stable `data-testid` markers, transcript notices, or narrow network evidence rather than calling store methods or routes directly from the test.
4. Mirror any runtime-only failure with deterministic assembled coverage so future regressions fail quickly without requiring the full packaged-host run to understand the bug.
5. Keep product changes tightly scoped to real inert controls, missing browser visibility, or click-vs-slash drift discovered by the live proof.

## Must-Haves

- [ ] The real browser UI exercises each daily-use control still in scope for M002
- [ ] Typed slash flows prove built-ins never fall through to model prompt text in browser mode
- [ ] Browser-visible outcomes are asserted through shipped UI state or narrow runtime evidence
- [ ] Runtime-discovered parity regressions gain deterministic assembled coverage

## Verification

- `node --import ./src/resources/extensions/gsd/tests/resolve-ts.mjs --experimental-strip-types --test src/tests/integration/web-mode-runtime.test.ts src/tests/integration/web-mode-assembled.test.ts src/tests/web-command-parity-contract.test.ts src/tests/web-session-parity-contract.test.ts`
- The proof must fail by naming the inert control, incorrect slash outcome, or click-vs-slash drift if browser parity regresses

## Observability Impact

- Signals added/changed: launched-host browser assertions for command-surface state, transcript notices, and targeted parity-flow network activity
- How a future agent inspects this: rerun the runtime plus assembled parity tests and inspect the stable UI markers on command-surface, dashboard, and sidebar affordances
- Failure state exposed: visible browser controls that stop responding, misroute to prompt text, or drift between click and slash paths become direct runtime or assembled failures

## Inputs

- `src/tests/integration/web-mode-runtime-harness.ts` — shared launched-host harness and browser attach utilities from T01
- `src/tests/integration/web-mode-runtime.test.ts` — real packaged-host proof file to expand with parity coverage
- `src/tests/integration/web-mode-assembled.test.ts` — deterministic fake-bridge integration suite for mirroring runtime regressions
- `web/components/gsd/command-surface.tsx`, `web/components/gsd/dashboard.tsx`, `web/components/gsd/sidebar.tsx` — stable browser entrypoints and inspection markers introduced in S01-S03
- S02/S03 summaries — the existing parity surfaces and live-state markers should be reused rather than replaced with new throwaway test hooks

## Expected Output

- `src/tests/integration/web-mode-runtime.test.ts` — launched-host parity flows for daily-use browser controls
- `src/tests/integration/web-mode-assembled.test.ts` — deterministic regression coverage for any runtime-only parity bug exposed by the real UI
- `web/components/gsd/command-surface.tsx` — any narrowly scoped browser-visible fix needed for model/thinking/session/settings/auth/Git/recovery proof
- `web/components/gsd/dashboard.tsx` and `web/components/gsd/sidebar.tsx` — any narrowly scoped affordance or marker fix required by the real browser run
- `web/lib/gsd-workspace-store.tsx` — only if the launched-host proof exposes a real action-path drift that the browser store must correct
