---
estimated_steps: 5
estimated_files: 4
---

# T01: Wire live session context into views and verify mock-free invariant

**Slice:** S04 — Current-project state surfaces
**Milestone:** M001

## Description

The five content views (Dashboard, Roadmap, Activity, FilesView, DualTerminal) already read boot-time workspace data from the store — that wiring happened progressively across S01–S03. What's missing: the live session context fields that S03 added (`activeToolExecution`, `streamingAssistantText`, `statusTexts`) are not consumed by any view component. Dashboard and DualTerminal should show tool execution state. The status bar should surface `statusTexts` from extension fire-and-forget methods. The contract test needs mock-free invariant assertions to formally close R008.

## Steps

1. **Dashboard — add live session context.** Read `activeToolExecution` and `streamingAssistantText` from the store. In the Session card, add a row showing the active tool name when `activeToolExecution` is non-null (e.g. "Running: tool_name" with a pulsing dot). Add a "Streaming…" indicator when `streamingAssistantText` is non-empty. These fit within the existing Session card layout per D002.

2. **DualTerminal AutoTerminal — add tool execution state.** Read `activeToolExecution` from the store. Show the tool name in the status/current-workflow section when a tool is running. This extends the existing "Current Unit" section naturally.

3. **StatusBar — surface statusTexts.** Read `statusTexts` from the store. If any entries exist, render the most recent status text in the status bar's left section. Truncate to fit. This adds one conditional span, not a layout change.

4. **Contract test — mock-free invariant.** Add test cases to `web-state-surfaces-contract.test.ts` that: (a) read the source of all five view components and assert they contain no static mock data arrays or hardcoded placeholder strings (grep for patterns like `const.*Data = [`, fake timestamps, lorem-style text), (b) assert the view files import from `gsd-workspace-store` (proving they read real store state), (c) verify `activeToolExecution` and `streamingAssistantText` type usage is present in dashboard source.

5. **Build + regression check.** Run `npm run build:web-host` and the full contract test suite to confirm compilation and no regressions.

## Must-Haves

- [ ] Dashboard Session card shows active tool name during tool execution
- [ ] Dashboard shows streaming indicator during agent output
- [ ] StatusBar renders statusTexts entries
- [ ] DualTerminal shows active tool execution state
- [ ] Contract test asserts mock-free invariant for all five views
- [ ] Build compiles cleanly
- [ ] Existing contract tests pass (no regressions)

## Verification

- `node --import ./src/resources/extensions/gsd/tests/resolve-ts.mjs --experimental-strip-types --test src/tests/web-state-surfaces-contract.test.ts` — all existing + new tests pass
- `npm run build:web-host` — clean build
- `node --import ./src/resources/extensions/gsd/tests/resolve-ts.mjs --experimental-strip-types --test src/tests/web-bridge-contract.test.ts src/tests/web-onboarding-contract.test.ts src/tests/web-live-interaction-contract.test.ts` — no regressions

## Inputs

- `web/lib/gsd-workspace-store.tsx` — store state shape including `activeToolExecution`, `streamingAssistantText`, `statusTexts`, `widgetContents`
- `web/lib/workspace-status.ts` — shared status derivation helpers
- `web/components/gsd/dashboard.tsx` — already wired to boot data, needs live session fields
- `web/components/gsd/dual-terminal.tsx` — already wired to boot/auto data, needs tool execution
- `web/components/gsd/status-bar.tsx` — already wired to boot data, needs statusTexts
- `src/tests/web-state-surfaces-contract.test.ts` — existing 9-case contract test to extend
- S03 summary: `liveTranscript`, `activeToolExecution`, `statusTexts` are the fields to consume

## Expected Output

- `web/components/gsd/dashboard.tsx` — extended with activeToolExecution and streamingAssistantText rendering in Session card
- `web/components/gsd/dual-terminal.tsx` — extended with activeToolExecution display
- `web/components/gsd/status-bar.tsx` — extended with statusTexts rendering
- `src/tests/web-state-surfaces-contract.test.ts` — extended with mock-free invariant assertions and live state consumption checks
