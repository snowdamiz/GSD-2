---
estimated_steps: 5
estimated_files: 5
---

# T03: Wire visualizer into app-shell, sidebar, and dispatch

**Slice:** S03 — Workflow Visualizer Page
**Milestone:** M003

## Description

Connects the `VisualizerView` component (from T02) to the rest of the app so users can reach it via three paths: (1) clicking the "Visualize" icon in the sidebar NavRail, (2) directly navigating to `activeView === "visualize"`, and (3) typing `/gsd visualize` in the terminal. The key integration challenge is making `/gsd visualize` navigate to the visualizer view rather than opening the generic command surface placeholder. This requires a cross-component navigation mechanism since the dispatch function and the app-shell are separate concerns.

## Steps

1. **Modify `web/components/gsd/app-shell.tsx`:**
   - Add `"visualize"` to the `KNOWN_VIEWS` set (currently: `"dashboard", "power", "roadmap", "files", "activity"`)
   - Import `VisualizerView` from `@/components/gsd/visualizer-view`
   - Add render branch: `{activeView === "visualize" && <VisualizerView />}` after the existing view branches
   - Add a `gsd:navigate-view` event listener (parallel to the existing `gsd:open-file` listener) that calls `handleViewChange(event.detail.view)`:
     ```typescript
     useEffect(() => {
       const handler = (e: CustomEvent<{ view: string }>) => {
         if (KNOWN_VIEWS.has(e.detail.view)) {
           handleViewChange(e.detail.view)
         }
       }
       window.addEventListener("gsd:navigate-view", handler as EventListener)
       return () => window.removeEventListener("gsd:navigate-view", handler as EventListener)
     }, [handleViewChange])
     ```

2. **Modify `web/components/gsd/sidebar.tsx`:**
   - Import `BarChart3` from `lucide-react` (add to the existing import block)
   - Add `{ id: "visualize", label: "Visualize", icon: BarChart3 }` to the `navItems` array — place it after the `"activity"` entry (last in the main nav group, before the bottom utility buttons)

3. **Modify `/gsd visualize` dispatch to navigate instead of opening command surface:**
   - In `web/lib/browser-slash-command-dispatch.ts`: find the `dispatchGSDSubcommand` function. Currently `"visualize"` maps to `"gsd-visualize"` surface which opens the command surface with a generic placeholder. Change the behavior for `"visualize"` to return a result with a new kind — either:
     - Option A (preferred): Add a `"view-navigate"` kind to the dispatch result type. When the subcommand is `"visualize"`, return `{ kind: "view-navigate", view: "visualize" }` instead of `{ kind: "surface", surface: "gsd-visualize" }`.
     - Option B: Keep it returning a surface result but handle `"gsd-visualize"` specially in the workspace store's `dispatchSlashCommand` method.
   - In `web/lib/gsd-workspace-store.tsx`: in the `dispatchSlashCommand` method, check if the dispatch result has `kind === "view-navigate"` (or surface `"gsd-visualize"`). If so, emit a `gsd:navigate-view` CustomEvent with `{ view: "visualize" }` instead of calling `this.openCommandSurface()`. The workspace store already processes dispatch results — find where `kind === "surface"` is handled and add the new case.

4. **Update types if needed:**
   - If adding a `"view-navigate"` kind, update the `BrowserSlashCommandDispatchResult` type in `browser-slash-command-dispatch.ts` to include `{ kind: "view-navigate"; view: string }` as a union member.
   - Ensure the `"gsd-visualize"` entry remains in `command-surface-contract.ts` and the dispatch surface mapping (for backward compatibility) — the generic placeholder in `command-surface.tsx` should no longer be reachable for `"gsd-visualize"` but removing it could break the union type used elsewhere.

5. **Build check**: Run `npm run build:web-host` and `npm run build` to verify everything compiles with no regressions.

## Must-Haves

- [ ] `"visualize"` is in the `KNOWN_VIEWS` set in app-shell.tsx
- [ ] `VisualizerView` renders when `activeView === "visualize"`
- [ ] "Visualize" appears in the sidebar NavRail with `BarChart3` icon
- [ ] `/gsd visualize` dispatch navigates to the visualizer view (not the generic placeholder)
- [ ] `gsd:navigate-view` event listener wired in app-shell.tsx
- [ ] `npm run build:web-host` exits 0
- [ ] `npm run build` exits 0

## Verification

- `npm run build:web-host` exits 0
- `npm run build` exits 0
- `rg "visualize" web/components/gsd/app-shell.tsx` shows KNOWN_VIEWS inclusion and render branch
- `rg "BarChart3" web/components/gsd/sidebar.tsx` shows the icon import and usage
- `rg "gsd:navigate-view" web/components/gsd/app-shell.tsx` shows the event listener
- `rg "view-navigate\|navigate-view\|gsd-visualize" web/lib/browser-slash-command-dispatch.ts` shows the dispatch change

## Inputs

- `web/components/gsd/visualizer-view.tsx` — the component to render (from T02)
- `web/components/gsd/app-shell.tsx` — current app-shell with KNOWN_VIEWS, activeView, handleViewChange, existing `gsd:open-file` listener pattern
- `web/components/gsd/sidebar.tsx` — current NavRail with navItems array
- `web/lib/browser-slash-command-dispatch.ts` — current dispatch with `dispatchGSDSubcommand`, `SURFACE_COMMANDS`, `BrowserSlashCommandSurface` type
- `web/lib/gsd-workspace-store.tsx` — current store with `dispatchSlashCommand` method processing dispatch results
- `web/components/gsd/command-surface.tsx` — current generic `gsd-` placeholder handler (should become unreachable for `gsd-visualize`)

## Expected Output

- `web/components/gsd/app-shell.tsx` — modified: `KNOWN_VIEWS` has "visualize", imports VisualizerView, renders it, has `gsd:navigate-view` listener
- `web/components/gsd/sidebar.tsx` — modified: navItems includes Visualize entry with BarChart3 icon
- `web/lib/browser-slash-command-dispatch.ts` — modified: `"visualize"` subcommand returns view-navigate result
- `web/lib/gsd-workspace-store.tsx` — modified: handles view-navigate dispatch result by emitting `gsd:navigate-view` event
