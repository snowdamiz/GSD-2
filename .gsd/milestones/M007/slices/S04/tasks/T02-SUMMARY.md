---
id: T02
parent: S04
milestone: M007
provides:
  - ActionPanel component with animated slide-in, accent-colored header, secondary ChatPane session, and completion-signal auto-close
  - openPanel/closePanel lifecycle in ChatMode with session DELETE cleanup
  - Phase action trigger buttons (Discuss, Plan) in ChatModeHeader secondary row
  - onCompletionSignal prop wired through ChatPane → PtyChatParser
key_files:
  - web/components/gsd/chat-mode.tsx
key_decisions:
  - closePanel uses functional setState updater (not stale-closure capture) to safely read current sessionId — avoids race condition if closePanel is called between renders
  - DELETE is scheduled with setTimeout(400ms) after state=null to allow exit animation to complete before session is torn down
  - onCompletionSignal added to ChatPane's useEffect deps array — stable callback ref required from callers (use useCallback in ActionPanel)
  - ActionPanel is a plain React component (not motion.div) — the animation wrapper lives in ChatMode's JSX tree, keeping ActionPanel stateless and testable
  - PANEL_ACTIONS is a static const (not derived from workflow phase) — "always available" design per task plan; could be made phase-aware later
patterns_established:
  - AnimatePresence key={sessionId} pattern: keying on sessionId ensures React remounts the panel (fresh parser/SSE) when a new session replaces the old one
  - Functional setState updater for side-effect-on-close: `setActionPanelState(current => { /* side effect on old value */ return null })` — avoids stale closures
observability_surfaces:
  - "[ActionPanel] open sessionId=%s command=%s" — fired on openPanel(); confirm sessionId and command
  - "[ActionPanel] close reason=manual|replace sessionId=%s" — fired on closePanel() / replace; reason field distinguishes user-driven vs programmatic
  - "[ActionPanel] completion signal received, closing in 1500ms sessionId=%s" — fired when PtyChatParser emits CompletionSignal
  - "[ActionPanel] session DELETE failed sessionId=%s" — fires if cleanup fetch errors; signals session leak
  - data-testid="action-panel" + data-session-id={sessionId} — panel presence + active session
  - data-testid="action-panel-close" — X button for manual close
  - data-testid="chat-panel-trigger-{discuss|plan}" — trigger buttons in header
duration: ~30m
verification_result: passed
completed_at: 2026-03-17
blocker_discovered: false
---

# T02: ActionPanel component and layout split

**Built `ActionPanel` — animated right-side chat pane with session lifecycle, completion-signal auto-close, and layout split in `ChatMode`.**

## What Happened

1. **`ActionPanelConfig` type** and `PANEL_ACTIONS` constant defined at the top of `chat-mode.tsx`. `accentClasses()` maps color names → Tailwind border/bg/text classes.

2. **`ChatMode` updated** with:
   - `actionPanelState: ActionPanelConfig | null` via `useState`
   - `openPanel(actionDef)` — generates `"gsd-action-" + Date.now()` sessionId, replaces any existing panel (DELETE old session), sets state
   - `closePanel()` — functional updater reads current sessionId, sets state to null, schedules DELETE after 400ms for exit animation
   - Layout split: `ChatPane` gets `w-[58%]` when panel open, `flex-1` when closed; `AnimatePresence` wraps a divider div and the `motion.div` panel wrapper

3. **`ChatModeHeader` extended** with `onOpenPanel` prop and a secondary row of phase action buttons (Discuss/Plan) using `PANEL_ACTIONS`. Row only shown when `bootStatus === "ready"` and auto is not active.

4. **`ActionPanel` component** built with:
   - Tinted header: `border-t-2 {accent.border} {accent.bg}` + accent-colored label text
   - X close button with `data-testid="action-panel-close"`
   - `ChatPane` with `sessionId={config.sessionId}` + `command="pi"` + `onCompletionSignal={handleCompletionSignal}`
   - `handleCompletionSignal`: logs and schedules `onClose()` after 1500ms

5. **`ChatPane` updated** with `onCompletionSignal?: () => void` prop. Subscribed via `parser.onCompletionSignal()` inside the existing SSE useEffect; cleaned up in the return function alongside `unsubscribe`.

6. **Animation**: `motion.div` with `initial={{ x: "100%", opacity: 0 }}`, `animate={{ x: 0, opacity: 1 }}`, `exit={{ x: "100%", opacity: 0 }}`, spring transition (stiffness 300, damping 30). `key={sessionId}` ensures fresh mount on panel replace.

## Verification

- `npm run build:web-host` exits 0 — zero TypeScript errors, build compiled successfully in 16.4s
- All must-have truths confirmed by code inspection:
  - `AnimatePresence` + `motion.div` with correct spring transition
  - `closePanel` deletes session after 400ms (covers exit animation)
  - `openPanel` replaces existing panel (deletes old session, sets new state)
  - `onCompletionSignal` → 1500ms delay → `onClose()`
  - `data-testid="action-panel"` + `data-session-id` on panel container
  - Accent border (`border-t-2 border-sky-500`) and tinted header bg (`bg-sky-500/10`)
  - Phase trigger buttons in header secondary row with `data-testid="chat-panel-trigger-discuss"` etc.

## Diagnostics

- `document.querySelector('[data-testid="action-panel"]')?.dataset.sessionId` — active panel sessionId
- `document.querySelector('[data-testid="chat-panel-trigger-discuss"]')` — panel trigger button
- DevTools Network → filter by active sessionId → SSE stream presence confirms session alive
- Console filter `[ActionPanel]` → all panel lifecycle events in one view

## Deviations

- The divider between main pane and action panel is also wrapped in `AnimatePresence` for a fade-in/out effect (plan didn't specify, but felt right).
- `ChatPane`'s `w-[58%]` / `flex-1` uses `transition-[width] duration-300` for a smooth CSS transition alongside the spring animation — slight improvement over abrupt jump.

## Known Issues

None. Session DELETE at panel close is a best-effort fire-and-forget; T03 adds an `unmount` backstop for navigation-away cleanup.

## Files Created/Modified

- `web/components/gsd/chat-mode.tsx` — Added `ActionPanelConfig` type, `PANEL_ACTIONS`, `accentClasses()`; updated `ChatMode` with panel state + `openPanel`/`closePanel`; updated `ChatModeHeader` with `onOpenPanel` prop + phase trigger row; added `ActionPanel` component; extended `ChatPane` with `onCompletionSignal` prop + parser subscription
- `.gsd/milestones/M007/slices/S04/tasks/T02-PLAN.md` — Added missing `## Observability Impact` section (pre-flight fix)
