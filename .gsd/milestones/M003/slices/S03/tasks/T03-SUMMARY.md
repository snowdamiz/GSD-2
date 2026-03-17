---
id: T03
parent: S03
milestone: M003
provides:
  - Visualizer view reachable via sidebar NavRail, activeView state, and /gsd visualize dispatch
  - gsd:navigate-view CustomEvent channel for cross-component view navigation
  - view-navigate dispatch result kind for slash command → view transitions
key_files:
  - web/components/gsd/app-shell.tsx
  - web/components/gsd/sidebar.tsx
  - web/lib/browser-slash-command-dispatch.ts
  - web/lib/gsd-workspace-store.tsx
key_decisions:
  - Used new "view-navigate" dispatch kind (Option A from plan) rather than special-casing surface handling — cleaner separation and reusable for future view-navigating commands
patterns_established:
  - gsd:navigate-view CustomEvent pattern for slash-command-to-view navigation — reusable for any future /gsd subcommand that should navigate to a view instead of opening a surface
observability_surfaces:
  - Terminal system line "Navigating to visualize view" on /gsd visualize dispatch
  - gsd:navigate-view CustomEvent observable in browser DevTools
duration: 12m
verification_result: passed
completed_at: 2026-03-16
blocker_discovered: false
---

# T03: Wire visualizer into app-shell, sidebar, and dispatch

**Wired VisualizerView into app-shell rendering, sidebar NavRail with BarChart3 icon, and /gsd visualize dispatch via new view-navigate kind and gsd:navigate-view event.**

## What Happened

Four files modified to connect the VisualizerView component (T02) to the app:

1. **app-shell.tsx**: Added `"visualize"` to `KNOWN_VIEWS`, imported `VisualizerView`, added render branch for `activeView === "visualize"`, and wired a `gsd:navigate-view` event listener (parallel to existing `gsd:open-file` pattern) that calls `handleViewChange`.

2. **sidebar.tsx**: Added `BarChart3` icon import and `{ id: "visualize", label: "Visualize", icon: BarChart3 }` entry to `navItems` array after "Activity".

3. **browser-slash-command-dispatch.ts**: Added `"view-navigate"` kind to `BrowserSlashCommandDispatchResult` union. Intercepted `"visualize"` subcommand before the surface map lookup to return `{ kind: "view-navigate", view: "visualize" }` instead of `{ kind: "surface", surface: "gsd-visualize" }`. Left `"gsd-visualize"` in the surface type union and map for backward compatibility.

4. **gsd-workspace-store.tsx**: Added `case "view-navigate"` handler in the slash command dispatch switch — logs a terminal system line and emits `window.dispatchEvent(new CustomEvent("gsd:navigate-view", { detail: { view: outcome.view } }))`.

## Verification

- `npm run build:web-host` exits 0 ✅
- `npm run build` exits 0 ✅
- `rg "visualize" web/components/gsd/app-shell.tsx` — shows KNOWN_VIEWS inclusion, import, render branch ✅
- `rg "BarChart3" web/components/gsd/sidebar.tsx` — shows icon import and navItem usage ✅
- `rg "gsd:navigate-view" web/components/gsd/app-shell.tsx` — shows event listener registration ✅
- `rg "view-navigate|navigate-view|gsd-visualize" web/lib/browser-slash-command-dispatch.ts` — shows new kind and intercept ✅

### Slice-level verification status (all tasks complete)

- `npm run build:web-host` exits 0 ✅
- `npm run build` exits 0 ✅
- `curl /api/visualizer` — requires running server; verified in T01
- Browser: sidebar Visualize icon — requires live app (compile-verified)
- Browser: 7 tabs render — requires live app (compile-verified)
- Browser: `/gsd visualize` navigation — requires live app (compile-verified)
- Browser: Export downloads — requires live app (compile-verified)

## Diagnostics

- **Terminal feedback:** `/gsd visualize` prints `"Navigating to visualize view"` as a system terminal line
- **Event channel:** `gsd:navigate-view` CustomEvent on `window` — inspectable in browser DevTools → Event Listeners
- **Dispatch tracing:** `lastSlashCommandOutcome` in workspace store state will show `kind: "view-navigate"` after `/gsd visualize`
- **Failure mode:** If app-shell unmounts before event fires, navigation silently fails but terminal line still appears

## Deviations

None — followed Option A (preferred) from the plan exactly.

## Known Issues

None.

## Files Created/Modified

- `web/components/gsd/app-shell.tsx` — added "visualize" to KNOWN_VIEWS, VisualizerView import/render, gsd:navigate-view listener
- `web/components/gsd/sidebar.tsx` — added BarChart3 import and Visualize navItem
- `web/lib/browser-slash-command-dispatch.ts` — added "view-navigate" kind to result type, intercepted "visualize" subcommand
- `web/lib/gsd-workspace-store.tsx` — added "view-navigate" case in dispatch switch with event emission
- `.gsd/milestones/M003/slices/S03/tasks/T03-PLAN.md` — added Observability Impact section
