---
estimated_steps: 3
estimated_files: 6
---

# T03: Connect the existing shell to the live bridge and prove runtime launch

**Slice:** S01 — Web host + agent bridge
**Milestone:** M001

## Description

Consume the new boot and event contract from the preserved `web/` shell. This task keeps scope to launch-critical surfaces so S01 proves the browser workspace is live without stealing S04’s broader view-model replacement work.

## Steps

1. Add a shared browser workspace store/client that loads `/api/boot`, subscribes to `/api/session/events`, and posts bridge commands without each component inventing its own transport.
2. Replace launch-critical mock startup/session wiring in the existing shell with live project, session, and connection state while preserving the current skin.
3. Add an integration test that spawns `gsd --web` from a real project cwd, probes the host, and verifies the shell attaches to live boot/event state without launching the TUI.

## Must-Haves

- [ ] The browser shell reads shared live state instead of isolated local startup/session mocks for the launch path.
- [ ] Connection and bridge failure state are visible in-browser on the launch-critical surfaces touched here.
- [ ] A real runtime test proves `gsd --web` launches the host, serves the current project, and attaches the shell to live bridge state.

## Verification

- `node --import ./src/resources/extensions/gsd/tests/resolve-ts.mjs --experimental-strip-types --test src/tests/integration/web-mode-runtime.test.ts`
- The integration test asserts host startup, current-project boot data, live event attachment, and no TUI startup during the `--web` run.

## Observability Impact

- Signals added/changed: client connection state, last bridge error, initial boot load phase, and session attachment status.
- How a future agent inspects this: visible shell status/connection surfaces plus `src/tests/integration/web-mode-runtime.test.ts`.
- Failure state exposed: boot-fetch failure, SSE disconnect, or session-attach failure without dropping back to silent mock state.

## Inputs

- `web/app/page.tsx` — current top-level shell with local mock view state.
- `web/components/gsd/sidebar.tsx` — representative launch-state UI that currently consumes placeholders.
- `web/components/gsd/terminal.tsx` — representative live-session UI that currently simulates activity.
- T02 output: same-origin boot, command, and event routes with bridge diagnostics.

## Expected Output

- `web/lib/gsd-workspace-store.ts` — shared boot/event/command client state for the shell.
- `web/app/page.tsx` and targeted GSD components — launch-critical surfaces wired to live project/session/connection state.
- `src/tests/integration/web-mode-runtime.test.ts` — real runtime proof for S01’s demo path.
