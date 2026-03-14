---
id: S04
milestone: M001
status: ready
---

# S04: Current-project state surfaces — Context

## Goal

Replace the mock dashboard, roadmap, files, and activity surfaces with real current-project GSD data while preserving the existing skin and making state gaps visible instead of misleading.

## Why this Slice

This slice turns the browser workspace from a live terminal shell into a believable current-project workspace. It unblocks S05 by giving start/resume controls real roadmap, state, files, and activity context to act on, and it sets up S06 to reason about continuity and failure visibility from real view models instead of placeholders.

## Scope

### In Scope

- Wiring the existing dashboard surface to real current-project data wherever that data is available.
- Preserving the existing dashboard layout/feel rather than redesigning its priorities for M001.
- Mapping real GSD milestone, slice, task, and session/activity state into the existing dashboard, roadmap, files, and activity views.
- Replacing mock roadmap content with real current-project roadmap/progress information.
- Making the Files view real for GSD artifacts, with `.gsd/` workflow/state files as the scope for this slice.
- Replacing mock activity entries with real current-project/session activity history and live session context where available.
- Showing gaps, missing files, or inconsistent project state clearly while still rendering a best-effort view.
- Removing mock/live mixing from these core surfaces so they read as one truthful workspace.

### Out of Scope

- Redesigning the dashboard, roadmap, files, or activity UI beyond what is needed to feed them real data.
- Expanding the Files view into a full general-purpose project file browser for the whole repo.
- Start/resume control design or workflow actions; that belongs to S05.
- Refresh/reopen continuity, reattachment behavior, and broader failure-recovery UX; that belongs to S06.
- Solving every long-tail data-quality problem by blocking the whole surface when some project state is missing.

## Constraints

- Respect D002: keep the exact existing `web/` skin as the M001 UI contract.
- S04 should preserve the existing dashboard surface and make it real, not reinterpret it into a different product view.
- The Files view is scoped to `.gsd/` artifacts for this slice.
- When project state is incomplete, stale, or inconsistent, the UI should show the gap clearly rather than silently inventing certainty.
- Best-effort rendering is preferred over blank or hard-blocked screens, as long as uncertainty is visible.
- Keep the experience snappy and fast; wiring real data should not make these passive state surfaces feel heavy.

## Integration Points

### Consumes

- `S01 current-project boot payload` — provides cwd/project identity, onboarding state, and resumable session context for the workspace.
- `S01 bridge access to session and project state` — supplies current boot/session data and request paths for reading live project state.
- `S03 live agent/session events` — feeds recent activity, live execution context, and session-adjacent state into the surfaces.
- `.gsd/` project artifacts — roadmap, state, plans, summaries, and related workflow files that define the current project's truth.
- Existing `web/components/gsd/dashboard.tsx`, `roadmap.tsx`, `files-view.tsx`, and `activity-view.tsx` — the mock UI contract that must be preserved while swapping in real view models.

### Produces

- Real workspace store/view models for dashboard, roadmap, files, and activity.
- A truthful current-project dashboard using real data where available inside the existing layout.
- A `.gsd/`-scoped real Files view for workflow/state artifacts.
- Real activity and roadmap surfaces tied to current-project state instead of placeholder data.
- Visible missing/inconsistent-state handling for these views.
- A mock-data removal invariant for the core state surfaces covered by this slice.

## Open Questions

- When both persisted `.gsd/` artifacts and live session events can describe the same concept, which one should win in each surface? — Current thinking: show the freshest truthful state available, but make the source of uncertainty obvious if live and persisted views diverge.
- Should the roadmap surface show only the active milestone by default or the full current-project milestone set when both are available? — Current thinking: keep the existing feel, but planning needs to define what "current-project roadmap" means in the browser without overloading the screen.
- How much detail should the activity surface retain in S04 before it becomes noisy? — Current thinking: enough to reflect real work history and live session context, but defer richer filtering/polish to later slices if needed.
