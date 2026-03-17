---
id: S02
parent: M007
milestone: M007
provides:
  - Chat nav entry in sidebar NavRail (MessagesSquare icon, between Power Mode and Roadmap)
  - "chat" registered in KNOWN_VIEWS, persisted via sessionStorage
  - ChatMode component — full-height flex column, header bar with GSD-MAIN badge
  - ChatPane — live SSE connection to gsd-main PTY session, feeds PtyChatParser, reactive ChatMessage[] state
  - ChatBubble — role-dispatched rendering: assistant (MarkdownContent + shiki), user (right-aligned plain), system (muted inline)
  - MarkdownContent — dynamic react-markdown + remark-gfm + shiki with full component map (code, table, h1-h3, ul, ol, blockquote, a, img placeholder)
  - StreamingCursor — inline-style keyframe animation for in-progress messages
  - ChatMessageList — scroll-lock (isNearBottom ref, 100px threshold), auto-scroll on new messages
  - ChatInputBar — textarea with Enter-to-send, Shift+Enter newline, auto-resize capped at 160px, Disconnected badge
  - Bottom terminal panel suppressed when activeView === "chat"
  - CSS: @keyframes chat-cursor, .chat-code-block shiki styles, .chat-markdown overflow helpers in globals.css
requires:
  - slice: S01
    provides: PtyChatParser, ChatMessage, TuiPrompt, CompletionSignal from web/lib/pty-chat-parser.ts
affects:
  - S03
  - S04
key_files:
  - web/components/gsd/chat-mode.tsx
  - web/components/gsd/sidebar.tsx
  - web/components/gsd/app-shell.tsx
  - web/app/globals.css
key_decisions:
  - ChatMode mounts on demand (not pre-mounted hidden) — gsd-main is pre-initialized by DualTerminal so ChatPane SSE connects immediately
  - Terminal panel visibility condition extended: `activeView !== "power" && activeView !== "chat"` — chat has its own input bar
  - getChatHighlighter() is a module-level singleton in chat-mode.tsx (getHighlighter from file-content-viewer.tsx is not exported; both singletons cache independently on first call)
  - MarkdownContent uses single useEffect([content]) for re-runs on streaming updates — avoids stale-closure from a two-effect approach
  - StreamingCursor uses inline style={{ animation }} rather than Tailwind animate-[] to reference the @keyframes defined in globals.css
  - ChatInputBar uses textarea (not input[type=text]) to support Shift+Enter multiline with auto-resize via scrollHeight
patterns_established:
  - New view scaffold: (1) icon import in sidebar.tsx, (2) navItems entry, (3) KNOWN_VIEWS Set entry, (4) component file, (5) conditional render in app-shell.tsx
  - SSE connection pattern: EventSource in useEffect, cleanup in return, mirrors TerminalInstance exactly
  - Parser subscription pattern: onMessage callback calls parser.getMessages() and spreads into state — avoids stale closure
  - Input queue flush: string[] ref + flushingRef boolean guard — prevents concurrent POSTs, copied from shell-terminal.tsx
  - Chat message rendering: role switch at ChatBubble level → system/user are pure JSX, assistant delegates to MarkdownContent
  - Scroll-lock: isNearBottomRef updated in onScroll handler; useEffect on messages scrolls only when ref === true
observability_surfaces:
  - console.log("[ChatPane] SSE connected sessionId=%s") — fires on type==="connected" SSE event
  - console.log("[ChatPane] SSE error/disconnected sessionId=%s") — fires on es.onerror
  - console.debug("[ChatPane] messages=%d sessionId=%s") — fires on every parser.onMessage() update
  - console.debug("[ChatBubble] markdown modules loaded") — fires once on first MarkdownContent render
  - window.__chatParser (dev only) — exposes PtyChatParser instance for runtime inspection via .getMessages()
  - ChatInputBar "Disconnected" badge — visual SSE failure indicator
  - sessionStorage key "gsd-active-view:<cwd>" stores "chat" when Chat is active
drill_down_paths:
  - .gsd/milestones/M007/slices/S02/tasks/T01-SUMMARY.md
  - .gsd/milestones/M007/slices/S02/tasks/T02-SUMMARY.md
  - .gsd/milestones/M007/slices/S02/tasks/T03-SUMMARY.md
duration: ~3h (T01: 20m, T02: 45m, T03: 1.5h, closure: 30m)
verification_result: passed
completed_at: 2026-03-17
---

# S02: Chat Mode View — Main Pane

**Delivers the Chat nav entry, live ChatPane connected to the gsd-main PTY session via SSE, and fully styled markdown-capable chat bubbles — the complete view infrastructure that S03 (TUI prompts) and S04 (action toolbar) will build on.**

## What Happened

**T01 (Nav entry and view scaffold):** Added `MessagesSquare` icon to sidebar navItems after `power`, registered `"chat"` in KNOWN_VIEWS, and created `chat-mode.tsx` with `ChatMode`, `ChatModeHeader`, and scaffold stubs. Extended the terminal panel visibility condition to also suppress it when `activeView === "chat"`. Build verified clean, browser confirmed Chat icon appears between Power Mode and Roadmap, click routes to ChatMode, sessionStorage persists selection.

**T02 (ChatPane SSE and parser):** Replaced the scaffold with a live `ChatPane` that opens an EventSource to `/api/terminal/stream?id=gsd-main&command=pi`, feeds `type === "output"` chunks to a stable `PtyChatParser` ref, and subscribes `parser.onMessage()` to push `ChatMessage[]` into React state. The `sendInput(data)` function uses the input-queue flush pattern from `shell-terminal.tsx` — a `string[]` ref with a `flushingRef` boolean guard prevents concurrent POSTs to `/api/terminal/input`. SSE connection confirmed in browser: `[ChatPane] SSE connected sessionId=gsd-main` log + "Connected — waiting for GSD output…" placeholder state.

**T03 (Chat bubbles and markdown):** Built the complete rendering layer:
- `MarkdownContent`: dynamic imports of react-markdown + remark-gfm + shiki; full component map covering code blocks with shiki syntax highlighting (try/catch fallback to pre/code), inline code, tables, headers h1-h3, lists, blockquote, links (target blank), images (placeholder). Single `useEffect([content])` re-renders on streaming updates without stale-closure risk.
- `ChatBubble`: role dispatcher — system → centered muted italic; user → right-aligned `bg-primary` bubble; assistant → left-aligned card bubble with MessagesSquare avatar + MarkdownContent. All roles show `StreamingCursor` when `complete === false`.
- `ChatMessageList`: scroll-lock via `isNearBottomRef` updated in onScroll, auto-scrolls only when within 100px of bottom.
- `ChatInputBar`: textarea with Enter-to-send, Shift+Enter for newlines, auto-resize via scrollHeight capped at 160px, Disconnected badge when SSE is down.
- CSS appended to globals.css: `@keyframes chat-cursor`, `.chat-code-block` shiki overrides, `.chat-markdown` overflow helpers.

## Verification

- `npm run build:web-host` exits 0 (confirmed after T01, T02, T03, and again at closure)
- Browser (live GSD project via `npm run gsd:web`): Chat button present in sidebar NavRail at position 3; click switches to Chat Mode with GSD-MAIN badge in header; SSE connects ("Connected — waiting for GSD output…"); terminal panel suppressed; Shift+Enter hint visible; textarea enabled
- Browser: switching back to Dashboard restores full layout with terminal panel
- Browser: `sessionStorage.getItem("gsd-active-view:/Users/sn0w/Documents/dev/GSD-2")` returns `"chat"` when Chat is active
- Input queue: POST to `/api/terminal/input` confirmed in network log on Enter
- No React errors in console across all views

## Requirements Advanced

- R113 — Chat Mode view reachable from sidebar, live SSE connection, styled chat bubbles with markdown; core of R113 now built; TUI prompts (S03) and action panel (S04) remain

## Requirements Validated

- None in this slice alone — R113 requires S03+S04 to fully validate

## New Requirements Surfaced

None

## Requirements Invalidated or Re-scoped

None

## Deviations

- T02 added a minimal `MessageList` stub rendering raw `ChatMessage[]` text to provide visual confirmation of data flow before T03's styled bubbles; removed in T03 as planned
- MarkdownContent uses single `useEffect([content])` rather than the two-effect approach initially drafted — avoids stale-closure where the first effect's `cancelled` flag blocks streaming updates
- getChatHighlighter singleton duplicated in chat-mode.tsx rather than imported from file-content-viewer.tsx (not exported there) — functionally identical, both cache independently on first call

## Known Limitations

- Chat view renders PTY output only when the parser produces classified messages. The workspace-boot-failure state (13 validation issues) means the gsd-main session produces no classifiable GSD output in the current project state. Messages will appear once GSD is actively running work.
- `window.__chatParser` is only available in dev builds — not accessible in production standalone.
- `chat-cursor` keyframe is defined globally in globals.css; if another component defines the same name, there would be a conflict (low risk currently).

## Follow-ups

- S03: wire TUI prompt detection into ChatBubble dispatch (`message.prompt?.kind` → TuiSelectPrompt / TuiTextPrompt / TuiPasswordPrompt)
- S04: add ChatModeHeader action toolbar, ActionPanel component wrapping ChatPane, panel open/close lifecycle with CompletionSignal auto-close

## Files Created/Modified

- `web/components/gsd/chat-mode.tsx` (new, 619 lines) — ChatMode, ChatModeHeader, ChatPane, ChatBubble, MarkdownContent, StreamingCursor, ChatMessageList, ChatInputBar, PlaceholderState, getChatHighlighter singleton
- `web/components/gsd/sidebar.tsx` — added MessagesSquare import; added `{ id: "chat", label: "Chat", icon: MessagesSquare }` to navItems after power
- `web/components/gsd/app-shell.tsx` — added "chat" to KNOWN_VIEWS; imported ChatMode; added `{activeView === "chat" && <ChatMode />}`; extended terminal suppression condition
- `web/app/globals.css` — appended @keyframes chat-cursor, .chat-code-block, .chat-markdown

## Forward Intelligence

### What the next slice should know
- `ChatPane` exports `sendInput(data: string)` which POSTs to `/api/terminal/input` with `{ id: sessionId, data }` — S03's TUI prompt components call this same function when the user submits a selection or text input
- `ChatBubble` is the dispatch point for prompt rendering: add a branch on `message.prompt?.kind` at the top of ChatBubble before the role switch; prompt components should call `onSendInput` (passed down from ChatPane via props) rather than maintaining their own PTY connection
- `ChatPane` currently has no `onSendInput` prop surface exposed to parent — S03 may need to either add a prop or accept that prompt submission goes through ChatPane's internal `sendInput`
- The `PlaceholderState` is shown when `messages.length === 0`; once real GSD output flows through PtyChatParser, bubbles replace the placeholder automatically

### What's fragile
- PtyChatParser message classification drives everything — if GSD output patterns change or ANSI sequences aren't stripped cleanly, `messages` stays empty and the chat shows the placeholder indefinitely. Check `window.__chatParser.getMessages()` (dev) or the `[ChatPane] messages=%d` console debug log to diagnose
- The single `useEffect([content])` in MarkdownContent fires dynamic imports on every streaming update. After first load all imports resolve from module cache instantly, but if module loading is slow (cold cache), streaming updates may show plain-text fallback until the first import completes
- scroll-lock threshold of 100px is hardcoded; very short viewport heights could make this feel too aggressive

### Authoritative diagnostics
- Console filter `[ChatPane]` — shows SSE lifecycle and message count; first source to check if chat is blank after connecting
- Console filter `[ChatBubble]` — shows markdown module load; if missing, MarkdownContent is stuck in plain-text fallback
- Browser DevTools Network → filter `stream` → select gsd-main EventSource → EventStream sub-tab — raw SSE chunks from PTY
- `window.__chatParser.getMessages()` in dev console — check if parser is producing output at all

### What assumptions changed
- Original plan assumed ChatPane would need an `initialCommand` prop for initial-command firing; not implemented as the gsd-main session is already running when ChatMode mounts — the prop exists in ChatPane's type definition for forward-compat but is unused
