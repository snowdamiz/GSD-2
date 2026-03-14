---
id: S05
milestone: M001
status: ready
---

# S05: Start/resume workflow controls — Context

## Goal

Deliver browser-native controls for starting new work, continuing the current active session, and resuming prior current-project sessions from the existing skin without requiring hidden terminal commands.

## Why this Slice

This slice turns the live browser workspace into something a user can actually drive through the primary GSD workflow without already knowing CLI commands. It depends on S03's live terminal/prompt surface and S04's truthful current-project state, and it directly unblocks S06 and S07 by making browser start/resume flows real, visible, and usable.

## Scope

### In Scope

- UI controls for start new work, continue an active session, and resume a prior current-project session from the browser.
- A browser flow that makes the best next action obvious while still requiring an explicit user click before continuing/resuming work.
- A control shape that uses one primary recommended action with smaller secondary alternatives nearby.
- Resume/continue decision-making based on real current-project session and GSD state from the web workspace.
- Resume selection UI that emphasizes progress context: milestone, slice, task, status, and recency.
- Mapping the existing skin's controls to real GSD commands/session operations rather than leaving terminal commands as the only practical way to act.

### Out of Scope

- Auto-continuing an active session without user confirmation.
- Keeping the terminal as the primary or required way to start/resume work in web mode.
- Rich transcript-preview-driven resume browsing as the default resume experience.
- Refresh/reopen continuity and automatic reattachment behavior across browser lifecycle changes; that belongs to S06.
- Redesigning the overall skin beyond adding the needed start/resume controls and states.

## Constraints

- Respect D002: preserve the exact existing `web/` skin as the UI contract for M001.
- Start/resume actions should feel browser-native and obvious, not like wrappers around hidden terminal knowledge.
- The UI should recommend the best next action, but never take over and continue/resume work without an explicit click.
- Resume choices should be grounded in real project/session progress context, not only raw session IDs or opaque names.
- Keep the experience snappy and fast; choosing how to proceed should feel lightweight rather than like a heavy resume wizard.

## Integration Points

### Consumes

- `S03 live terminal/prompt execution surface` — executes the actual commands/session operations behind start, continue, and resume actions.
- `S04 real dashboard/roadmap/files/activity state` — provides current-project truth to decide which action should be recommended and what resume metadata to show.
- `S01 boot payload resumableSessions + bridge session state` — supplies active-session detection and resumable-session inventory for the project.
- Existing skin surfaces such as `web/components/gsd/dashboard.tsx` and adjacent workspace controls — host the browser-native action entrypoints.

### Produces

- Browser UI actions for start work, continue active session, and resume prior work.
- A recommended-action pattern with one primary CTA and secondary alternatives.
- Resume selection UI backed by real project/session progress metadata.
- Mapping from skin controls to GSD command/session operations instead of hidden terminal-only workflows.

## Open Questions

- If both an active session and multiple resumable sessions exist, what exact rule should decide the recommended primary CTA? — Current thinking: bias toward the strongest current-project continuation path, but keep the other choices immediately visible nearby.
- How much project/session context is enough in the resume list before it becomes visually heavy? — Current thinking: milestone, slice, task, status, and recency are the core signals; richer transcript previews are likely unnecessary for S05.
- Where should the primary CTA live within the existing skin so it feels obvious without redesigning the UI? — Current thinking: keep the existing skin intact and place the action where the workspace already expects a next-step control, rather than introducing a separate new navigation model.
