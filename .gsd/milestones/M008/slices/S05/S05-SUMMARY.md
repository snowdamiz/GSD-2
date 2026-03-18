---
id: S05
parent: M008
milestone: M008
provides:
  - getProgressColor() oklch interpolation for dashboard progress bar (red→yellow→green by completion %)
  - useTerminalFontSize() hook with localStorage persistence and cross-component sync
  - TerminalSizePanel in web settings with preset size buttons
  - fontSize prop on ShellTerminal threaded through DualTerminal (not footer terminal)
requires: []
affects: []
key_files:
  - web/components/gsd/dashboard.tsx
  - web/lib/use-terminal-font-size.ts
  - web/components/gsd/settings-panels.tsx
  - web/components/gsd/shell-terminal.tsx
  - web/components/gsd/dual-terminal.tsx
  - web/components/gsd/chat-mode.tsx
  - web/components/gsd/command-surface.tsx
key_decisions:
  - oklch color interpolation with L=0.65 C=0.16 for progress bar visibility in both themes (D-inline)
  - Terminal font size scoped to chat + expert terminals, footer excluded (D084)
  - Custom event `terminal-font-size-changed` for same-tab sync plus native storage events for cross-tab sync
patterns_established:
  - oklch hue interpolation for semantic color encoding (reusable for any percentage→color mapping)
  - localStorage + custom event pattern for cross-component preference sync (mirrors sidebar collapsed state)
observability_surfaces:
  - Browser DevTools: progress bar div inline style `backgroundColor: oklch(0.65 0.16 H)` where H encodes completion %
  - localStorage key `gsd-terminal-font-size` — persisted terminal font size value
  - Window event `terminal-font-size-changed` fires on local font size changes
  - data-testid `settings-terminal-size` on the TerminalSizePanel
drill_down_paths:
  - .gsd/milestones/M008/slices/S05/tasks/T01-SUMMARY.md
  - .gsd/milestones/M008/slices/S05/tasks/T02-SUMMARY.md
duration: 25m
verification_result: passed
completed_at: 2026-03-18
---

# S05: Progress Bar Dynamics & Terminal Text Size

**Dynamic oklch progress bar coloring (red→yellow→green by completion %) and user-adjustable terminal text size preference with settings panel.**

## What Happened

**T01 — Progress bar color interpolation.** Added `getProgressColor(percent: number)` to `dashboard.tsx` that returns an `oklch(0.65 0.16 H)` string with hue linearly interpolated from 25 (red) through 85 (yellow) to 145 (green). The progress bar div's `bg-foreground` class was removed and replaced with an inline `backgroundColor` style. Input is clamped 0–100. Lightness/chroma values (0.65/0.16) sit close to existing design tokens while being slightly brighter for visual prominence in the thin bar. The existing `transition-all duration-500` provides smooth color animation.

**T02 — Terminal text size preference.** Created `useTerminalFontSize()` hook in `web/lib/use-terminal-font-size.ts` — reads/writes `gsd-terminal-font-size` from localStorage (default 13, clamped 8–24). Cross-tab sync via native `storage` events, same-tab sync via custom `terminal-font-size-changed` window event. Added `TerminalSizePanel` to `settings-panels.tsx` with 6 preset buttons (11–16) and a live preview line. Added optional `fontSize` prop to `ShellTerminal`, threaded through `DualTerminal` which reads the hook. Footer terminal in `app-shell.tsx` receives no fontSize prop — stays at default 13px (D084). Chat mode content also respects the setting via inline style on message wrappers.

## Verification

- `npm run build:web-host` exits 0
- `rg "bg-foreground" web/components/gsd/dashboard.tsx` — 2 matches, neither on the progress bar div (one is `bg-foreground/50` status return, one is a badge span)
- `getProgressColor()` tested across 0–100% range — confirmed red→orange→yellow→lime→green gradient
- `useTerminalFontSize` imported in dual-terminal, settings-panels, and chat-mode
- Footer terminal `<ShellTerminal className="h-full" />` has no fontSize prop (confirmed via grep)
- `TerminalSizePanel` wired into command-surface.tsx settings section

## Requirements Advanced

- R116 — Progress bar now uses oklch color interpolation (red→yellow→green) based on completion percentage. Build passes, `bg-foreground` removed from progress bar div. Ready for validation.
- R120 — Terminal text size is user-configurable via settings panel, persists in localStorage, applies to expert/chat terminals, explicitly excluded from footer. Ready for validation.

## Requirements Validated

- R116 — `getProgressColor()` implements oklch hue interpolation 25→85→145, inline `backgroundColor` replaces static `bg-foreground`, build passes, visual test confirms gradient behavior.
- R120 — `useTerminalFontSize()` hook persists in localStorage, `TerminalSizePanel` provides preset controls, `ShellTerminal` accepts `fontSize` prop threaded through `DualTerminal`, footer terminal excluded by omission, `npm run build:web-host` passes.

## New Requirements Surfaced

- none

## Requirements Invalidated or Re-scoped

- none

## Deviations

None — both tasks implemented exactly as planned.

## Known Limitations

- Terminal font size change triggers xterm `fit()` + resize but does not automatically scroll to bottom — user may need to scroll if terminal content reflows.
- Progress bar oklch values are hardcoded (L=0.65, C=0.16) — if future themes use dramatically different brightness ranges, these may need theme-aware adjustment.
- Font size presets are fixed at 11–16; users wanting sizes outside this range have no UI control (hook clamps 8–24).

## Follow-ups

- none

## Files Created/Modified

- `web/components/gsd/dashboard.tsx` — Added `getProgressColor()` function, updated progress bar div to use dynamic `backgroundColor`
- `web/lib/use-terminal-font-size.ts` — New hook for localStorage-persisted terminal font size with cross-component sync
- `web/components/gsd/settings-panels.tsx` — Added `TerminalSizePanel` component with preset size buttons and live preview
- `web/components/gsd/shell-terminal.tsx` — Added `fontSize` prop to ShellTerminalProps, updated `getXtermOptions()`, added dynamic fontSize update effect
- `web/components/gsd/dual-terminal.tsx` — Imported `useTerminalFontSize`, passes fontSize to both ShellTerminal instances
- `web/components/gsd/chat-mode.tsx` — Imported `useTerminalFontSize`, applied to chat content wrappers
- `web/components/gsd/command-surface.tsx` — Imported and rendered `TerminalSizePanel` in settings section

## Forward Intelligence

### What the next slice should know
- S05 completes M008. All 5 slices are done. The milestone-level verification (`npm run build:web-host` exits 0, all feature checks) should pass.

### What's fragile
- The oklch interpolation uses fixed lightness/chroma (0.65/0.16) — these work well for current light/dark tokens but would need revisiting if theme token brightness ranges change significantly.
- xterm dynamic font size update relies on `termRef.current.options.fontSize` assignment + `fitAddon.fit()` — if xterm.js upgrades change this API, the effect in shell-terminal.tsx will break silently (terminal just won't resize).

### Authoritative diagnostics
- `localStorage.getItem('gsd-terminal-font-size')` — single source of truth for persisted terminal font size
- Progress bar element's inline `style.backgroundColor` — should show `oklch(0.65 0.16 H)` where H maps to completion %
- `[data-testid="settings-terminal-size"]` — DOM locator for the terminal size settings panel

### What assumptions changed
- No assumptions changed. Both features were straightforward and implemented as planned.
