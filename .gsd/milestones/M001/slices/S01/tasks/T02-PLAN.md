---
estimated_steps: 3
estimated_files: 7
---

# T02: Implement the project-scoped bridge service and same-origin API contract

**Slice:** S01 — Web host + agent bridge
**Milestone:** M001

## Description

Turn the existing workspace and RPC contracts into a single long-lived browser bridge. This task owns the server-side seam: boot payload generation, command forwarding, event streaming, and inspectable bridge failure state for the current project.

## Steps

1. Add a long-lived bridge service that owns RPC child/session lifecycle for the current project instead of creating bridge state inside individual request handlers.
2. Implement same-origin route handlers for `/api/boot`, `/api/session/command`, and `/api/session/events`, deriving boot state from real GSD workspace/auto data and mapping commands/events to the authoritative RPC contract.
3. Add contract tests covering boot payload shape, onboarding/resume seams, singleton lifecycle behavior, SSE event delivery, and bridge error reporting.

## Must-Haves

- [ ] One bridge registry owns session lifecycle for the host runtime.
- [ ] `/api/boot` returns real current-project data plus onboarding-needed and resumable-session seams.
- [ ] `/api/session/command` and `/api/session/events` use the real RPC contract and expose inspectable error/connection state.

## Verification

- `node --import ./src/resources/extensions/gsd/tests/resolve-ts.mjs --experimental-strip-types --test src/tests/web-bridge-contract.test.ts`
- The tests assert request/response mapping, SSE streaming, singleton lifecycle behavior, and failure-state surfacing without secrets.

## Observability Impact

- Signals added/changed: bridge lifecycle state, active session id, command dispatch failures, SSE connection/disconnect, and last RPC error.
- How a future agent inspects this: `/api/boot`, `/api/session/events`, and `src/tests/web-bridge-contract.test.ts`.
- Failure state exposed: bridge phase, timestamped last error, and whether the bridge failed before or after session attachment.

## Inputs

- `packages/pi-coding-agent/src/modes/rpc/rpc-types.ts` — authoritative command/event payload contract.
- `src/resources/extensions/gsd/workspace-index.ts` — real current-project workspace indexing for boot payloads.
- `src/resources/extensions/gsd/auto.ts` — current auto-dashboard state for initial workspace summary.
- T01 output: a dedicated `--web` runtime exists and needs one stable bridge service, not per-request process startup.

## Expected Output

- `src/web/bridge-service.ts` — singleton bridge lifecycle and RPC registry.
- `web/app/api/boot/route.ts` — current-project boot payload endpoint.
- `web/app/api/session/command/route.ts` — browser-to-RPC command endpoint.
- `web/app/api/session/events/route.ts` — SSE stream for agent and interruption events.
- `src/tests/web-bridge-contract.test.ts` — contract coverage for boot, command, event, and failure behavior.
