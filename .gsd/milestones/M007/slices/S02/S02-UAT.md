---
id: S02-UAT
parent: S02
milestone: M007
uat_mode: live-runtime
written: 2026-03-17
---

# S02: Chat Mode View — Main Pane — UAT

**Milestone:** M007
**Written:** 2026-03-17

## UAT Type

- UAT mode: live-runtime
- Why this mode is sufficient: S02 is a UI slice that connects to a live PTY session — the browser must exercise the actual SSE stream, real parser output, and DOM rendering. Static contract tests cannot verify visual rendering, scroll-lock, or SSE lifecycle behavior.

## Preconditions

1. Run `npm run gsd:web` from the project root — this rebuilds if source is stale, stages the standalone host, and launches the GSD web UI on a dynamic port (shown in terminal output as `[gsd] Launching web host on port XXXXX…`).
2. Note the port and navigate to `http://localhost:<PORT>` in a browser.
3. Wait for "Bridge connected" in the status bar (bottom left) — workspace must be fully loaded.
4. A GSD workspace with an active project scope (not "Scope pending") is ideal but not required; SSE connectivity can be verified even without active GSD output.

## Smoke Test

Navigate to Chat Mode by clicking the chat bubble icon in the sidebar NavRail (3rd from top, between Power Mode icon and Roadmap icon). **Expected:** The main content area switches to a Chat view with a "Chat" header and "GSD-MAIN" badge. A text input bar appears at the bottom. The Terminal panel (bottom bar) is hidden. No console errors.

---

## Test Cases

### 1. Chat nav entry position and routing

1. Look at the sidebar NavRail on the left edge of the screen.
2. Confirm icons from top: Dashboard → Power Mode → **Chat** → Roadmap → Files → Activity → Visualize → Projects → Git → Settings.
3. Click the Chat icon (speech bubble / MessagesSquare icon).
4. **Expected:** The main content area renders the Chat view. Header shows "Chat" label and a "GSD-MAIN" badge. Bottom terminal panel is **not** visible. No other views are visible.

### 2. View persistence via sessionStorage

1. Click the Chat icon to switch to Chat Mode.
2. Open browser DevTools → Console.
3. Run: `sessionStorage.getItem("gsd-active-view:" + window.__gsdProjectCwd)` — or navigate to Application → Session Storage → find the key containing "gsd-active-view".
4. **Expected:** Value is `"chat"`.
5. Click Dashboard icon to switch away.
6. Re-check sessionStorage.
7. **Expected:** Value is now `"dashboard"` (or the new view's id). Confirms persistence round-trips correctly.

### 3. SSE connection established

1. Navigate to Chat Mode.
2. Open DevTools → Console. Filter by `[ChatPane]`.
3. **Expected:** Within ~3 seconds, a log entry `[ChatPane] SSE connected sessionId=gsd-main` appears.
4. Alternatively: open DevTools → Network → filter by `stream` → find the `gsd-main` EventSource → EventStream sub-tab shows incoming `data:` chunks.
5. **Expected:** The placeholder text reads "Connected — waiting for GSD output…" (not "Connecting to GSD session…"). This confirms `connected === true` state.

### 4. Input bar enabled and sends to PTY

1. Navigate to Chat Mode. Confirm SSE connected (see Test 3).
2. Click the text input area at the bottom.
3. Type `hello` and press **Enter**.
4. **Expected:** The input clears. DevTools Network shows a POST to `/api/terminal/input` with body `{ "id": "gsd-main", "data": "hello\n" }`. (Status 200 or 204 expected.)
5. If a GSD session is actively running, the user bubble "hello" should appear immediately in the message list.

### 5. Shift+Enter inserts newline (multiline input)

1. Navigate to Chat Mode with SSE connected.
2. Click the input textarea.
3. Type `line one`, then press **Shift+Enter**.
4. Type `line two`.
5. **Expected:** The textarea expands to show two lines. The text shows `line one\nline two` (not submitted yet). Press **Enter** to send.
6. **Expected:** The message is submitted as `"line one\nline two\n"` — single POST to `/api/terminal/input`.

### 6. Terminal panel suppressed in Chat Mode

1. Navigate to Dashboard. Confirm the Terminal bar is visible at the bottom of the content area.
2. Click Chat icon to switch to Chat Mode.
3. **Expected:** The Terminal bar (with "Terminal ▲" label and the xterm textarea) is **not visible** in the DOM. The chat input bar replaces it.
4. Switch back to Dashboard.
5. **Expected:** Terminal bar reappears. No regression.

### 7. Assistant bubble renders markdown

> Requires: an active GSD session producing markdown output (e.g. run `gsd status` or any command that outputs headers and lists).

1. Navigate to Chat Mode with a running GSD session.
2. Trigger a GSD command that outputs markdown — headers (`##`), bold (`**text**`), lists (`- item`), code block (``` ` ``` ` ```).
3. **Expected:** The assistant bubble renders:
   - `##` headings as styled h2 elements
   - `**bold**` as `<strong>`
   - `- item` as a bulleted `<li>`
   - Fenced code blocks with shiki syntax highlighting (colored tokens, dark background, rounded border)
   - Inline `code` with muted background badge

### 8. User bubble renders as distinct outgoing bubble

> Requires: GSD session with parser producing user-role messages.

1. Navigate to Chat Mode with live GSD output flowing.
2. Type a message and send it.
3. **Expected:** User message appears right-aligned with `bg-primary` styling (blue/accent background) and `text-primary-foreground` text. No avatar icon. Visually distinct from assistant bubbles.

### 9. System message renders as muted inline line

> Requires: GSD session that produces system-classified output (status lines, separators).

1. Navigate to Chat Mode. Wait for parser to produce a `role === "system"` message.
2. **Expected:** System messages render as small, centered, italic text in `text-muted-foreground/60` — no bubble chrome, no avatar, no background.

### 10. Streaming cursor during in-progress messages

1. Navigate to Chat Mode during active GSD output.
2. Observe an assistant bubble where `complete === false` (GSD is still writing).
3. **Expected:** An animated cursor (thin vertical bar) pulses at the end of the message content. Once the message is marked complete, cursor disappears.

### 11. Scroll-lock — auto-scroll behavior

1. Navigate to Chat Mode with live GSD output producing many messages.
2. Scroll up to read earlier messages.
3. New messages arrive while scrolled up.
4. **Expected:** The list does NOT automatically scroll to the bottom — scroll position stays where the user left it.
5. Scroll back to the bottom (within 100px of end).
6. **Expected:** Next new message auto-scrolls to bottom again.

### 12. Disconnected state badge

1. Navigate to Chat Mode.
2. Stop the GSD web server (Ctrl+C in the terminal running `npm run gsd:web`), or use DevTools → Network → block the SSE URL for `gsd-main`.
3. **Expected:** The input textarea shows a "Disconnected" badge in the input bar. The textarea becomes disabled (no typing possible). The placeholder shows "Connecting…".
4. Restart the server and navigate back.
5. **Expected:** "Disconnected" badge disappears, textarea re-enables, "Connected" state restored.

### 13. No regressions in other views

1. Navigate to Dashboard, Power Mode, Roadmap, Files, Activity, Visualize, Projects, Git, and Settings.
2. **Expected:** Each view renders correctly. Terminal panel visible in Dashboard and Power Mode. No console errors attributable to ChatMode code.

---

## Edge Cases

### Empty input — send blocked

1. Navigate to Chat Mode, SSE connected.
2. Click the send button without typing anything.
3. **Expected:** Nothing is sent. The send button is disabled (dimmed, cursor-not-allowed). No POST to `/api/terminal/input`.

### Very long message auto-resize

1. Type or paste a paragraph of text (> 5 lines) into the input bar.
2. **Expected:** The textarea grows vertically as text is entered, up to a maximum of 160px. After 160px, vertical scrollbar appears inside the textarea — the rest of the UI does not shift.

### Rapid Enter presses

1. Type `test` and press Enter multiple times quickly.
2. **Expected:** Only one POST fires per Enter press. The input queue flush guard prevents concurrent overlapping POSTs. All messages eventually deliver in order.

### Chat Mode with no GSD session output yet

1. Navigate to Chat Mode immediately after the app loads (before any GSD output).
2. **Expected:** PlaceholderState shows ("Chat Mode / Connected — waiting for GSD output…"). No empty list, no errors. Input bar is enabled.

---

## Failure Signals

- Chat nav icon not visible → check sidebar.tsx navItems for MessagesSquare entry after `power`
- Click doesn't switch to Chat view → check app-shell.tsx KNOWN_VIEWS includes `"chat"` and `{activeView === "chat" && <ChatMode />}` is present
- SSE never connects → check DevTools Network for `/api/terminal/stream?id=gsd-main`; if absent, ChatPane useEffect is not running; if present but no `connected` event, server may not be recognizing the session id
- Messages empty despite SSE running → check `[ChatPane] messages=0` debug logs; parser may not be classifying output; inspect `window.__chatParser.getMessages()` in dev build
- Markdown renders as plain text → check console for `[ChatBubble] markdown modules loaded`; if absent, dynamic import failed; check network for failed chunk loads
- Terminal panel still visible in Chat Mode → check app-shell.tsx terminal visibility condition: should be `activeView !== "power" && activeView !== "chat"`
- Input bar sends but no user bubble appears → user messages require PtyChatParser to echo back the input from the PTY; may not appear until GSD echoes the input

---

## Requirements Proved By This UAT

- R113 (partial) — Chat Mode view is reachable from sidebar nav, renders live PTY session with styled bubbles and markdown, and accepts user input via an input bar. Core view infrastructure confirmed.

## Not Proven By This UAT

- R113 (TUI prompt intercept) — native UI for select/text/password prompts is S03's work
- R113 (action toolbar and right panel) — workflow buttons and panel lifecycle are S04's work
- Full end-to-end chat conversation (user → GSD response rendered as assistant bubble with markdown) requires an actively running GSD session with real markdown output — human UAT with a live project

## Notes for Tester

- The "13 validation issues" warning in the demo project's status bar is expected — it reflects the GSD-2 project's own workspace state, not a Chat Mode bug
- In the current project (GSD-2 in M007/S02 Summarizing state), the gsd-main SSE connects but no GSD output is flowing yet — the PlaceholderState showing "Connected — waiting for GSD output…" is correct
- To see real chat bubbles: navigate to a GSD project that is actively running auto-mode, or manually run a command via the Power Mode terminal, then switch to Chat Mode — the parser will pick up buffered output from the session
- The `window.__chatParser` dev-mode inspection surface is only available in development builds (not the production standalone served by `npm run gsd:web`)
