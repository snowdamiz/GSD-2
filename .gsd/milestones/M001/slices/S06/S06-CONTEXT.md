---
id: S06
milestone: M001
status: ready
---

# S06: Power mode + continuity + failure visibility — Context

## Goal

Deliver the exact existing Power Mode and surrounding web workspace behavior with real GSD continuity, reattachment, and visible recoverable failure states so browser mode stays attached and trustworthy during normal local use.

## Why this Slice

This slice retires the core operational risk left after live interaction and state wiring: whether the browser stays meaningfully attached to the correct current-project session across refresh/reopen and runtime failures. It also hardens the assembled web path for S07 by making continuity and recovery real without redesigning the UI.

## Scope

### In Scope

- Wiring the exact existing Power Mode UI to real GSD session state, controls, and live signals.
- Auto-reattaching to the same current-project session after browser refresh/reopen when that session still exists.
- Restoring the workspace/Power Mode attachment as directly as possible instead of forcing a chooser on every reload.
- Showing recoverable bridge/agent/runtime problems through a persistent, hard-to-miss failure state while keeping the workspace visible.
- Keeping recovery actions visible in-place, such as reconnect/retry-style affordances, rather than hiding them behind the terminal or transient messages.
- Continuity behavior that keeps the user attached to the correct current-project session under normal local browser lifecycle events.
- Failure visibility for disconnected bridge, agent/runtime errors, and blocked-but-recoverable states relevant to normal browser use.

### Out of Scope

- Redesigning or reinterpreting the existing Power Mode UI for M001.
- Showing a chooser on every refresh/reopen by default.
- Replacing the whole workspace with a full blocking error takeover for normal recoverable failures.
- Solving remote/shared/cloud continuity beyond local browser mode.
- Broader product changes to how sessions are created or resumed outside the web-mode continuity/failure contract for this slice.

## Constraints

- Respect D002: preserve the exact existing `web/` skin as the M001 UI contract.
- S06 should use the exact existing Power Mode UI, wired to real GSD behavior, rather than inventing a new cockpit design.
- Refresh/reopen should bias toward automatic reattachment to the same current-project session when possible.
- Recoverable failures must be hard to miss, but should not unnecessarily blank out the workspace.
- Failure surfacing should use a persistent visible state, not just transient toasts.
- Keep the experience snappy and fast even while reattaching or surfacing degraded runtime conditions.

## Integration Points

### Consumes

- `S03 live event and prompt surface` — provides the live session stream, prompt state, and runtime signals that Power Mode and continuity depend on.
- `S04 real UI state models` — provides truthful current-project workspace state for restoration and visible continuity.
- `S05 start/resume workflow actions` — provides the real session-control actions that continuity and recovery may need to invoke.
- `S01 bridge runtime snapshot + boot payload` — provides active session identity, bridge phase, resumable sessions, and failure metadata for reattachment decisions.
- Existing `web/components/gsd/dual-terminal.tsx` and related status surfaces — the exact UI contract to preserve while wiring real controls and continuity state.

### Produces

- A real Power Mode contract backed by live GSD session streams and controls.
- Continuity behavior for refresh/reopen/current-project reattachment in browser mode.
- Persistent browser-visible failure surfaces for disconnected bridge, agent/runtime errors, and blocked actions.
- Recovery affordances that keep the workspace visible while guiding the user back to a healthy attached state.
- Performance/interaction behavior that keeps the browser path feeling attached and fast during normal local use.

## Open Questions

- When auto-reattach cannot confidently identify a single correct session, what is the fallback threshold for showing a chooser versus a one-click reconnect screen? — Current thinking: auto-reattach when the match is unambiguous; otherwise surface a lightweight explicit choice.
- Which runtime failures are "recoverable enough" for the persistent in-workspace banner versus severe enough to justify stronger interruption? — Current thinking: most normal bridge/agent disconnects should stay in-workspace; only more exceptional cases may need stronger treatment.
- How much session/view restoration should happen on reattach beyond reconnecting to the same session stream? — Current thinking: restore the user to the same attached workspace context as directly as possible without adding fragile state reconstruction beyond what the existing UI can truthfully support.
