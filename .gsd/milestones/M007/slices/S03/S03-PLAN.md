# S03: TUI Prompt Intercept UI

**Goal:** When GSD presents an interactive ink TUI prompt, the chat view renders native UI components instead of raw escape sequences. Submitting via native UI sends correct keystrokes to the PTY and the session advances normally.

**Demo:** Start GSD in Chat Mode. When GSD shows a provider select list (arrow-key menu), a styled clickable option list appears in the chat. Clicking an option sends the correct arrow delta + Enter to the PTY and GSD advances. When GSD asks for an API key, a labeled masked input field appears; typing and pressing Enter sends the key and GSD continues.

## Must-Haves

- When `message.prompt.kind === 'select'`, `TuiSelectPrompt` renders `options[]` as clickable items with current selection highlighted
- Clicking an option sends `\x1b[A`/`\x1b[B` delta × count + `\r` to PTY; GSD session advances
- When `message.prompt.kind === 'text'`, `TuiTextPrompt` renders labeled input; submitting sends text + `\r`; GSD advances
- When `message.prompt.kind === 'password'`, `TuiPasswordPrompt` renders masked input; submitting sends text + `\r`; value never appears in chat history
- All prompt components auto-focus on render
- After submission, prompt components show a static confirmation (not interactive); value hidden for password
- `npm run build:web-host` exits 0

## Proof Level

- This slice proves: integration — keystrokes forwarded to live PTY cause GSD to advance its session
- Real runtime required: yes — must verify against a running GSD instance that presents actual prompts
- Human/UAT required: yes — visual inspection that prompt UI looks clean and session advances

## Verification

- `npm run build:web-host` exits 0
- Manual: trigger a GSD flow with a select prompt (e.g., provider selection during onboarding); verify `TuiSelectPrompt` renders; click an option; verify GSD session advances in the underlying PTY (visible in Power Mode side-by-side if needed)
- Manual: trigger a password/API key prompt; verify masked input renders; submit; verify GSD accepts the key and continues

## Integration Closure

- Upstream surfaces consumed: `TuiPrompt` type from `web/lib/pty-chat-parser.ts` (S01); `ChatPane.sendInput()` callback from S02; `ChatBubble` prompt dispatch slot from S02
- New wiring introduced: `TuiSelectPrompt`, `TuiTextPrompt`, `TuiPasswordPrompt` mounted inside `ChatBubble` when `message.prompt` is present
- What remains before the milestone is truly usable end-to-end: S04 (action toolbar + right panel lifecycle)

## Tasks

- [ ] **T01: TuiSelectPrompt component** `est:1h`
  - Why: Arrow-key select menus are GSD's most common interactive prompt; without this, users see raw escape codes
  - Files: `web/components/gsd/chat-mode.tsx`
  - Do: (1) Build `TuiSelectPrompt` with props `{ prompt: TuiPrompt; onSubmit: (data: string) => void }`. (2) Local state: `localIndex = prompt.selectedIndex ?? 0`; `submitted = false`. (3) Render options as styled clickable items; `localIndex` item gets accent background + checkmark or arrow indicator. (4) On option click: `delta = clickedIndex - localIndex`; build keystrokes: `delta > 0 ? '\x1b[B'.repeat(delta) : '\x1b[A'.repeat(-delta)` + `'\r'`; call `onSubmit(keystrokes)`; set `submitted = true`. (5) Keyboard: ArrowUp decrements `localIndex`, ArrowDown increments, Enter submits current index. (6) After submission: render static `"✓ {selectedOption}"`, no longer interactive. (7) Wire into `ChatBubble`: when `message.prompt?.kind === 'select'` and not yet submitted, render `TuiSelectPrompt` below message content; thread `onSubmit` through to `ChatPane.sendInput`.
  - Verify: trigger GSD provider select; verify option list renders; click an option; verify GSD advances (check Power Mode terminal or SSE output to confirm keystroke received)
  - Done when: option list renders, clicking sends correct delta keystrokes + Enter, GSD advances, post-submission shows static confirmation

- [ ] **T02: TuiTextPrompt and TuiPasswordPrompt components** `est:1h`
  - Why: API key entry and text prompts are critical first-run flows for non-technical users
  - Files: `web/components/gsd/chat-mode.tsx`
  - Do: (1) Build `TuiTextPrompt` with props `{ prompt: TuiPrompt; onSubmit: (data: string) => void }`: render `prompt.label` + `<Input>` from `@/components/ui/input`; auto-focus on mount via `useEffect`; on Enter call `onSubmit(value + "\r")` + set `submitted = true`; after submission show `"✓ Submitted"`. (2) Build `TuiPasswordPrompt` same pattern but `<Input type="password" />`; add eye-toggle button for show/hide; after submission show `"{prompt.label} — entered ✓"` — NEVER show the value. (3) Complete `ChatBubble` prompt dispatch: `kind === 'select'` → `TuiSelectPrompt`; `kind === 'text'` → `TuiTextPrompt`; `kind === 'password'` → `TuiPasswordPrompt`. Render prompt component only when `message.prompt` is present and `message.complete === false` (active prompt). (4) Thread `onSubmit → ChatPane.sendInput` through props (prop drilling 2 levels is fine at this depth).
  - Verify: trigger GSD API key prompt; verify masked input renders with label; type a key and press Enter; verify GSD accepts it and session continues; confirm value not shown in chat
  - Done when: both components render, auto-focus, submit correct bytes to PTY, show appropriate post-submission state

## Files Likely Touched

- `web/components/gsd/chat-mode.tsx`
