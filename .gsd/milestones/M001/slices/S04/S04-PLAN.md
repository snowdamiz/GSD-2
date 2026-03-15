# S04: Current-project state surfaces

**Goal:** Dashboard, roadmap, files, and activity views show real current-project data and live session context rather than mock values.
**Demo:** With a live `gsd --web` session, the dashboard shows the active tool name during tool execution, streaming indicator during agent output, and extension status texts; all five content views render from real store state with no static mock arrays; the contract test proves the data pipeline and mock-free invariant.

## Must-Haves

- Dashboard session section shows `activeToolExecution` (tool name + running state) when a tool is executing
- Dashboard shows a streaming indicator when `streamingAssistantText` is non-empty
- Dashboard or status bar renders `statusTexts` entries from fire-and-forget extension methods
- DualTerminal AutoTerminal shows `activeToolExecution` state
- No static mock data arrays or hardcoded placeholder strings remain in any of the five content views (Dashboard, Roadmap, Activity, FilesView, DualTerminal)
- Contract test asserts the mock-free invariant and live session state consumption patterns
- `npm run build:web-host` compiles cleanly with all changes

## Proof Level

- This slice proves: contract + integration
- Real runtime required: no (contract-level test + build verification sufficient; runtime exercise deferred to S07)
- Human/UAT required: no

## Verification

- `node --import ./src/resources/extensions/gsd/tests/resolve-ts.mjs --experimental-strip-types --test src/tests/web-state-surfaces-contract.test.ts` — all tests pass including new mock-free invariant and live session state assertions
- `npm run build:web-host` — builds cleanly, no compilation errors from changed components
- Existing bridge/onboarding/interaction contract tests still pass (no regressions)

## Integration Closure

- Upstream surfaces consumed: `gsd-workspace-store.tsx` (activeToolExecution, streamingAssistantText, statusTexts, widgetContents, liveTranscript), `workspace-status.ts` (status helpers), `/api/files` route
- New wiring introduced in this slice: live session context fields from S03 consumed by Dashboard and DualTerminal components
- What remains before the milestone is truly usable end-to-end: S05 (workflow controls), S06 (power mode + continuity + failure visibility), S07 (assembly proof)

## Tasks

- [ ] **T01: Wire live session context into views and verify mock-free invariant** `est:45m`
  - Why: The five content views read boot-time data but don't consume live session context fields from S03 (activeToolExecution, streamingAssistantText, statusTexts). The mock-free invariant needs formal test assertions to close R008.
  - Files: `web/components/gsd/dashboard.tsx`, `web/components/gsd/dual-terminal.tsx`, `web/components/gsd/status-bar.tsx`, `src/tests/web-state-surfaces-contract.test.ts`
  - Do: (1) Add `activeToolExecution` display to Dashboard session section — show tool name with running indicator when non-null. (2) Add streaming state indicator to Dashboard when `streamingAssistantText` is non-empty. (3) Add `statusTexts` rendering to the status bar — show the most recent extension status text alongside existing status info. (4) Add `activeToolExecution` display to DualTerminal AutoTerminal. (5) Extend contract test with mock-free invariant assertions — read view source files and assert no static mock data patterns. (6) Add test cases verifying the live session state types are consumed by view components. (7) Run build and existing tests to confirm no regressions. Constraints: D002 — all changes fit within existing visual layouts (adding rows to existing card sections, text to existing status areas). No new UI sections or layout changes.
  - Verify: `node --import ./src/resources/extensions/gsd/tests/resolve-ts.mjs --experimental-strip-types --test src/tests/web-state-surfaces-contract.test.ts` passes; `npm run build:web-host` succeeds; existing contract tests pass.
  - Done when: All five views consume real store state with no mock fallbacks, live session context from S03 renders in Dashboard/DualTerminal/StatusBar, contract test asserts the mock-free invariant, and build compiles clean.

## Files Likely Touched

- `web/components/gsd/dashboard.tsx`
- `web/components/gsd/dual-terminal.tsx`
- `web/components/gsd/status-bar.tsx`
- `src/tests/web-state-surfaces-contract.test.ts`
