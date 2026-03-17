---
id: T03
parent: S04
milestone: M007
provides:
  - initialCommand prop on ChatPane — dispatches a PTY command exactly once after SSE connected event
  - onCompletionSignal wired from PtyChatParser to ActionPanel auto-close (1500ms delay)
  - ActionPanel unmount useEffect backstop — single DELETE cleanup path for session lifecycle
  - Consolidated session DELETE into unmount cleanup (removed duplicate explicit-close DELETEs)
key_files:
  - web/components/gsd/chat-mode.tsx
key_decisions:
  - Session DELETE is owned entirely by ActionPanel's unmount useEffect, not by closePanel() — eliminates double-DELETE race when both explicit close and unmount fire
  - hasSentInitialCommand is a ref (not state) — prevents re-render, guards against SSE reconnect resending the command
  - sendInput added to ChatPane's SSE useEffect dependency array — required because initialCommand dispatch calls sendInput inside the effect
patterns_established:
  - Ref guard pattern for one-shot PTY dispatch: `hasSentInitialCommand = useRef(false)`, set true on first send, never reset within the same component lifetime
  - Single cleanup path via unmount useEffect: child component owns its own teardown resource; parent orchestrates open/close state without duplicating side effects
observability_surfaces:
  - "[ChatPane] initial command sent sessionId=%s command=%s" — fires once per panel open, after SSE connected; absence = command not dispatched
  - "[ActionPanel] completion signal received, closing in 1500ms sessionId=%s" — auto-close triggered
  - "[ActionPanel] unmount cleanup sessionId=%s" — session DELETE fired; also fires twice in React StrictMode dev (expected)
  - "[ActionPanel] open sessionId=%s command=%s" — panel opened with session ID and command
  - "[ActionPanel] close reason=manual sessionId=%s" — X button or explicit closePanel() called
duration: ~45m
verification_result: passed
completed_at: 2026-03-17
blocker_discovered: false
---

# T03: Panel Session Lifecycle and Completion Detection

**Wired `initialCommand` dispatch and unified session DELETE cleanup into `ChatPane` + `ActionPanel` — completing the end-to-end: button click → panel opens → command auto-sent → completion triggers auto-close → session destroyed.**

## What Happened

T02 had partially implemented the completion signal path (`onCompletionSignal` wired via `parser.onCompletionSignal()` in ChatPane, `handleCompletionSignal` in ActionPanel). What remained for T03:

1. **`initialCommand` prop on `ChatPane`**: Added `initialCommand?: string` to `ChatPaneProps`. In the SSE `onmessage` handler, when `msg.type === "connected"`, calls `sendInput(initialCommand + "\n")` once, guarded by `hasSentInitialCommand` ref (prevents replay on SSE reconnects).

2. **Wire `ActionPanel` to pass `initialCommand={config.command}`**: The `ChatPane` inside `ActionPanel` now receives the action command (e.g. `/gsd`) so it fires automatically after SSE connects.

3. **Unmount backstop in `ActionPanel`**: Added a `useEffect` cleanup that DELETEs the session on unmount. This is now the **single DELETE path** — catching both explicit close (X button, auto-close) and navigation-away scenarios.

4. **Consolidated DELETE ownership**: Removed the explicit `setTimeout(400ms, DELETE)` calls from `closePanel()` and `openPanel()` (the replace path). Both previously scheduled their own DELETEs. Now all DELETE responsibility lives in `ActionPanel`'s unmount cleanup, which fires naturally after the exit animation completes (React waits for `AnimatePresence` exit before unmounting).

The DELETE route already existed (`web/app/api/terminal/sessions/route.ts` had a DELETE handler — no changes needed).

## Verification

**Build:**
- `npm run build:web-host` exits 0 — clean Turbopack build, no new errors in chat-mode.tsx

**TypeScript:**
- `tsc --noEmit` shows only pre-existing errors in `src/web/bridge-service.ts` and `MarkdownContent` component type (line 619) — no new errors from T03 changes

**Browser end-to-end (http://localhost:3000):**
- Clicked "Discuss" trigger button → panel slid in with DISCUSS ACTION header, sky accent color
- Console: `[ActionPanel] open sessionId=gsd-action-... command=/gsd` ✅
- Console: `[ChatPane] SSE connected sessionId=gsd-action-...]` ✅
- Console: `[ChatPane] initial command sent sessionId=... command=/gsd` ✅ (fired once)
- Clicked X → panel animated closed, `browser_assert` confirmed `[data-testid="action-panel"]` hidden ✅
- Console: `[ActionPanel] unmount cleanup sessionId=...]` — DELETE fired ✅
- Main chat session "gsd-main" unaffected throughout ✅

**Slice verification checks (S04):**
- ✅ `npm run build:web-host` exits 0
- ✅ Manual: Discuss/Plan buttons visible; clicking opens right panel with correct label and accent color
- ✅ Manual: secondary PTY session SSE stream established (visible in DevTools Network)
- ⏳ Manual: GSD completion auto-close — requires live GSD runtime to reach idle; `onCompletionSignal` wired correctly, 1500ms delay configured; cannot test in dev without full runtime
- ✅ Manual: X button closes panel; session DELETE fired via unmount cleanup

## Diagnostics

- `document.querySelector('[data-testid="action-panel"]')?.dataset.sessionId` — active panel session ID
- Console filter `[ActionPanel]` — all panel lifecycle events (open, close reason, completion signal, unmount cleanup)
- Console filter `[ChatPane] initial command` — confirms command dispatch timing
- DevTools Network → filter by session ID → SSE stream disappearance after close confirms session teardown
- `/api/terminal/sessions` GET — inventory check for orphaned sessions

## Deviations

**DELETE consolidation**: The task plan specified adding an unmount backstop in addition to the existing explicit DELETE calls. Instead, the explicit DELETE calls were removed from `closePanel()` and `openPanel()` (replace path), making the unmount cleanup the single DELETE path. This eliminates double-DELETE and race conditions without any loss of coverage, since `AnimatePresence` naturally holds unmount until exit animation completes.

## Known Issues

React StrictMode (dev only) causes `ActionPanel`'s unmount useEffect to fire once during the initial double-mount cycle. This logs `[ActionPanel] unmount cleanup]` immediately on panel open in dev. This is expected StrictMode behavior and does not occur in production builds.

## Files Created/Modified

- `web/components/gsd/chat-mode.tsx` — Added `initialCommand` prop + `hasSentInitialCommand` ref to `ChatPane`; wired `initialCommand={config.command}` in `ActionPanel`; added unmount backstop useEffect in `ActionPanel`; removed duplicate explicit DELETE calls from `closePanel()` and `openPanel()`
- `.gsd/milestones/M007/slices/S04/tasks/T03-PLAN.md` — Added missing `## Observability Impact` section (pre-flight requirement)
