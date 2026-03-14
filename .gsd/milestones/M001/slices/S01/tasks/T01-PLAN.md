---
estimated_steps: 3
estimated_files: 6
---

# T01: Add the browser-only `--web` launch path and host bootstrap

**Slice:** S01 — Web host + agent bridge
**Milestone:** M001

## Description

Establish the real browser-mode entrypoint first. This task gives S01 a tested `gsd --web` branch that suppresses the TUI, preserves current-project scoping, and starts a concrete local host/bootstrap path that later bridge work can plug into.

## Steps

1. Update CLI argument handling so `--web` is recognized explicitly and branches before interactive/TUI startup while preserving current-cwd session scoping.
2. Add a web-mode launcher module that carries forward loader/bootstrap invariants, resolves the local host/build path, and reuses the existing browser-open behavior instead of duplicating it.
3. Add node:test coverage for the new startup branch, including no-TUI execution, cwd-scoped launch parameters, packaged host resolution, and browser-open invocation.

## Must-Haves

- [ ] `gsd --web` cannot fall through to the interactive/TUI path.
- [ ] The launcher runs against the current project cwd and has a concrete packaged host/bootstrap path.
- [ ] Browser auto-open is reused from existing behavior rather than reimplemented ad hoc.

## Verification

- `node --import ./src/resources/extensions/gsd/tests/resolve-ts.mjs --experimental-strip-types --test src/tests/web-mode-cli.test.ts`
- The test asserts explicit `--web` parsing, no TUI startup, cwd-scoped launch inputs, and opener invocation.

## Observability Impact

- Signals added/changed: startup mode, selected cwd, chosen host path/port, and launch failure reason.
- How a future agent inspects this: `src/tests/web-mode-cli.test.ts` plus the web-mode startup status emitted by the launcher.
- Failure state exposed: host bootstrap failure before browser open, with enough context to tell whether parsing, packaging, or launch wiring failed.

## Inputs

- `src/cli.ts` — current startup switchboard and existing current-cwd session scoping.
- `src/loader.ts` — bootstrap env and path setup that web mode must preserve.
- `src/onboarding.ts` — existing cross-platform browser-open behavior to reuse.
- S01 research: `--web` must branch before interactive startup and cannot rely on the TUI or explicit-mode fallback.

## Expected Output

- `src/web-mode.ts` — browser-mode launcher with preserved bootstrap and packaged host startup.
- `src/cli.ts` — explicit `--web` parsing and early branch.
- `package.json` and/or `web/package.json` — scripts or packaging hooks that make the host bootstrap path concrete.
- `src/tests/web-mode-cli.test.ts` — startup contract coverage for `--web`.
