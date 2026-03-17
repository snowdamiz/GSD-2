# T03: Panel Session Lifecycle and Completion Detection

**Slice:** S04
**Milestone:** M007

## Goal

Wire the secondary PTY session creation on panel open, the initial command dispatch into the session, the `CompletionSignal` subscription in `ChatPane` that triggers auto-close, and verify end-to-end: button click → panel opens → command runs → completion detected → panel auto-closes → session destroyed.

## Must-Haves

### Truths

- When the action panel opens, a new PTY session is created (or reused if already exists from the SSE connect)
- The triggered command is sent to the new session automatically on connection (via initial `sendInput` after SSE `connected` event)
- `onCompletionSignal` prop in `ChatPane` is called by the parser when a completion signal fires
- `ChatPane` accepts an `onCompletionSignal?: () => void` prop and wires it to `parser.onCompletionSignal()`
- After the panel auto-closes: the session is deleted and does not appear in the PTY session list
- The main `"gsd-main"` session is unaffected throughout the panel lifecycle

### Artifacts

- `web/components/gsd/chat-mode.tsx` — `ChatPane` extended with `initialCommand` and `onCompletionSignal` props; `ActionPanel` wires both
- End-to-end lifecycle verified in browser

### Key Links

- `ChatPane` new props: `{ initialCommand?: string; onCompletionSignal?: () => void }`
- `initialCommand` sent via `sendInput(command + "\n")` after SSE `connected` event
- `onCompletionSignal` subscribed via `parser.onCompletionSignal(cb)` in ChatPane's useEffect

## Steps

1. Extend `ChatPane` with `initialCommand?: string` prop:
   - In the SSE `onmessage` handler, when `msg.type === "connected"`: if `initialCommand` is set, call `sendInput(initialCommand + "\n")` once (use a `hasSentInitialCommand` ref to prevent replay on reconnect)
2. Extend `ChatPane` with `onCompletionSignal?: () => void` prop:
   - In the SSE useEffect, after creating the parser, subscribe: `const unsub = parser.onCompletionSignal(() => onCompletionSignal?.())` 
   - Add `unsub` to the cleanup function
3. Wire `ActionPanel` to use both new props:
   - Pass `initialCommand={config.command}` to `ChatPane`
   - Pass `onCompletionSignal={() => scheduleClose()}` to `ChatPane`
   - `scheduleClose`: wait 1500ms, then call `onClose()`
4. Verify session cleanup: add a `useEffect` cleanup in `ActionPanel` that calls the DELETE on unmount (as a backstop in case the explicit close misses it)
5. Check `/api/terminal/sessions` endpoint supports DELETE with query param — read `web/app/api/terminal/sessions/route.ts` to confirm; add DELETE handler if missing
6. End-to-end manual test:
   - Open Chat Mode
   - Click a Discuss/Plan action button
   - Confirm panel slides in with a new chat session
   - Confirm the command is sent automatically to the new session
   - Let GSD run until it returns to idle
   - Confirm panel auto-closes after ~1.5s
   - Confirm the secondary session is gone (check via browser DevTools Network tab — no more SSE stream for that session ID)
7. Test edge case: close the panel manually mid-action — confirm session is still destroyed

## Observability Impact

**New signals from this task:**
- `[ChatPane] initial command sent sessionId=%s command=%s` — fires once per panel open, after SSE `connected` event; absence means command was not dispatched
- `[ActionPanel] completion signal received, closing in 1500ms sessionId=%s` — fires when GSD returns to idle inside the panel; used to verify auto-close was triggered
- `[ActionPanel] unmount cleanup sessionId=%s` — fires when ActionPanel unmounts (catch-all backstop); signals a cleanup path other than `closePanel()` was used

**Inspection surfaces:**
- `document.querySelector('[data-testid="action-panel"]')?.dataset.sessionId` — live panel session ID
- DevTools Network → filter by active `sessionId` → SSE stream disappears after panel closes (session deleted)
- `window.__chatParser` (dev only) — parser instance for the main pane; secondary panel's parser not exposed (only one at a time)
- `/api/terminal/sessions` GET — confirms session list before/after panel lifecycle

**Failure visibility:**
- If `initialCommand` is sent more than once: check console for duplicate `initial command sent` logs; source is missing/bad `hasSentInitialCommand` ref guard
- If panel doesn't auto-close: no `completion signal received` log → parser not wired; or GSD never reached idle
- If sessions accumulate: `[ActionPanel] session DELETE failed` + network error logs identify orphaned sessions

## Context

- The `initialCommand` prop must send to the PTY exactly once. Using a ref `hasSentInitialCommand` (not state — no re-render needed) prevents the command from re-sending if the SSE reconnects.
- The cleanup backstop in `ActionPanel`'s unmount useEffect is a safety net. The primary cleanup path is the explicit `closePanel()` function. Unmount cleanup handles cases where React unmounts the component without `closePanel` being called (e.g., navigating away from Chat Mode while a panel is open).
- Check if DELETE handler exists in the sessions route. The `shell-terminal.tsx` component calls it when closing tabs: `fetch("/api/terminal/sessions?id=...", { method: "DELETE" })`. If it exists, just reuse the pattern. If not, add it.
- The 1500ms delay before auto-close is a UX choice. The user needs to see "GSD is done" before the panel disappears. Tweak if it feels too long or short after real testing.
