---
id: S03
milestone: M001
status: ready
---

# S03: Live terminal + focused prompt handling — Context

## Goal

Deliver live in-browser terminal interaction and focused prompt handling so the browser can send commands, stream agent output, and handle interruption requests without any TUI fallback.

## Why this Slice

This slice retires the core browser-first interaction risk in M001: whether the web workspace can actually drive a live GSD session instead of only displaying state. It also establishes the prompt/interrupt behavior that later slices depend on for real workspace surfaces, start/resume controls, continuity, and failure visibility.

## Scope

### In Scope

- Wiring the browser terminal to a real live GSD session so the user can send `prompt`, `steer`, `follow_up`, and `abort` actions from the web UI.
- Streaming live agent and tool output into the existing terminal/power surfaces instead of mock content.
- Handling focused interruption requests (`select`, `confirm`, `input`, `editor`) in-browser without modals or TUI fallback.
- Using a queued pending-prompt model for interruptions: show a toast and a highly visible pending prompt state instead of forcibly auto-opening the panel the instant a request arrives.
- Making a pending prompt obviously block forward progress: the session should visibly look paused/waiting for user input until the prompt is answered or cancelled.
- Using the focused panel as the editor surface for `editor` requests while keeping surrounding workflow context visible.
- Defaulting freeform in-run user text to context-aware auto-routing between steer/follow-up behavior rather than requiring an explicit mode switch first.
- Mirroring ambient agent feedback (`notify`, `setStatus`, `setWidget`, `setTitle`) into the terminal and focused/panel-adjacent UI so important state does not feel hidden.

### Out of Scope

- Reworking the overall `web/` skin layout beyond what is needed to support real terminal and focused prompt behavior.
- Defining start/resume workflow controls; that belongs to S05.
- Solving refresh/reopen continuity and recovery-on-reconnect behavior; that belongs to S06.
- Converting all dashboard, roadmap, files, and activity surfaces to real state models; that belongs to S04.
- Using modal dialogs as the primary interruption surface.
- Falling back to the TUI for any normal prompt, confirmation, input, or editor interaction covered by this slice.

## Constraints

- Respect D002: preserve the exact existing `web/` skin as the UI contract for M001.
- Respect D004: interruptions belong in a focused panel/surface, not buried in modal dialogs.
- The web flow must remain browser-first and must not require the TUI for normal live interaction.
- Interruption arrival should feel visible but not jarring: use a toast plus a clearly pending prompt state rather than forcing an instant panel takeover.
- Once a prompt is pending, the UI should make the wait state obvious; it should not look like the run is still freely progressing.
- Keep the experience snappy and fast even while streaming output and switching into prompt-response states.
- Ambient status/notification/widget/title updates should not disappear into one hidden surface; users should be able to notice them from the live terminal context.

## Integration Points

### Consumes

- `S01 live bridge transport` — carries request/response commands plus streaming session events between the browser and the RPC session.
- `S01 current-project boot payload` — determines active session/project context for the live terminal UI.
- `S02 onboarding gate + validated credential state` — keeps live interaction blocked until required setup has passed.
- `packages/pi-coding-agent/src/modes/rpc/rpc-types.ts` — defines the command surface (`prompt`, `steer`, `follow_up`, `abort`) and the `extension_ui_request` methods this slice must render.
- Existing `web/components/gsd/terminal.tsx` and `web/components/gsd/dual-terminal.tsx` surfaces — the mock UI contract to preserve while wiring real behavior.

### Produces

- A real browser terminal command surface for live GSD session interaction.
- Streaming browser rendering of agent/tool/session output from the RPC event stream.
- A focused prompt-handling flow for `select`, `confirm`, `input`, and `editor` requests with no TUI fallback.
- A pending-prompt visibility contract: toast notification, obvious waiting state, and explicit prompt resolution in-browser.
- A focused side-editor experience for editor-style interruptions.
- Mirrored ambient feedback surfaces for `notify`, `setStatus`, `setWidget`, and `setTitle` events.

## Open Questions

- What exact heuristic should decide when in-run text becomes `steer` versus `follow_up`? — Current thinking: default to context-aware behavior for lower friction, but planning should define the rule clearly enough that users are never surprised.
- Can multiple interruption requests be pending at once, or should the browser assume a single active prompt at a time? — Current thinking: bias toward one clearly active pending prompt unless the RPC/session model proves concurrent requests are real.
- How much UI prominence should `setWidget` and `setTitle` get inside the existing skin? — Current thinking: mirror them where visible from the terminal/focused workflow, but avoid turning the shell into a noisy dashboard before S04/S06 refine the surrounding state model.
