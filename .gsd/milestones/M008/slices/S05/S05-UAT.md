# S05: Progress Bar Dynamics & Terminal Text Size — UAT

**Milestone:** M008
**Written:** 2026-03-18

## UAT Type

- UAT mode: live-runtime
- Why this mode is sufficient: Both features are visual and interactive — progress bar color requires rendering at various percentages, terminal font size requires exercising the settings panel and observing terminal changes. Artifact inspection alone cannot confirm visual behavior.

## Preconditions

- `npm run build:web-host` exits 0
- GSD web mode running: `npm run gsd:web` (or `npm run gsd:web:stop:all && npm run gsd:web`)
- A project with at least one active milestone/slice with some tasks completed (for non-zero progress percentage)
- Browser open to the GSD web workspace (typically http://localhost:3141)

## Smoke Test

Open the dashboard — the progress bar should show a color (not monochrome gray/white). Open settings → the "Terminal Size" panel should appear with size buttons.

## Test Cases

### 1. Progress bar shows color based on completion percentage

1. Open the GSD web workspace and navigate to the dashboard
2. Locate the current slice progress bar
3. Right-click the progress bar fill element → Inspect
4. Check the inline `style` attribute on the progress bar `div`
5. **Expected:** `backgroundColor` shows an `oklch(0.65 0.16 H)` value where H corresponds to the completion percentage (H≈25 at 0%, H≈85 at 50%, H≈145 at 100%)

### 2. Progress bar is not monochrome

1. View the dashboard with a slice that has partial progress (e.g. 30-70%)
2. Observe the progress bar color
3. **Expected:** The bar is a warm color (orange/yellow range) — NOT the monochrome foreground color. At low %, it should be reddish; at high %, greenish.

### 3. Terminal size panel exists in settings

1. Open the command palette or navigate to settings (`/gsd prefs`)
2. Scroll to find "Terminal Size" panel
3. **Expected:** Panel shows 6 preset size buttons (11, 12, 13, 14, 15, 16) with "13" highlighted as active by default. A preview line shows text at the current selected size.

### 4. Changing terminal size updates expert terminals

1. Open settings and change terminal size to 16
2. Navigate to power/expert view (DualTerminal)
3. Observe the terminal text
4. **Expected:** Terminal text is visibly larger than the default 13px. The xterm terminal should re-fit its grid to the new font size.

### 5. Footer terminal stays at default size

1. With terminal size set to 16 (from test 4)
2. Look at the footer terminal at the bottom of the page
3. Right-click the terminal content → Inspect → check computed font-size
4. **Expected:** Footer terminal text remains at 13px, unaffected by the setting

### 6. Terminal size persists after refresh

1. Set terminal size to 15 in settings
2. Refresh the browser page (F5 / Cmd+R)
3. Open settings again
4. **Expected:** Terminal size panel shows "15" as the active/highlighted button
5. Navigate to expert view
6. **Expected:** Terminals render at 15px font size

### 7. Chat mode respects terminal size

1. Set terminal size to 16 in settings
2. Switch to chat mode
3. Observe the chat message content text
4. **Expected:** Chat content text renders at the configured font size (16px), not the default 13px

## Edge Cases

### Invalid localStorage value

1. Open browser DevTools console
2. Run `localStorage.setItem('gsd-terminal-font-size', 'banana')`
3. Refresh the page and open settings
4. **Expected:** Terminal size panel shows 13 (default) as active — invalid values silently fall back

### Out-of-range localStorage value

1. Open browser DevTools console
2. Run `localStorage.setItem('gsd-terminal-font-size', '99')`
3. Refresh the page and open settings
4. **Expected:** Terminal size panel shows 13 (default) — out-of-range values are clamped/rejected

### Zero-percent progress bar

1. Start a new slice where no tasks are completed (0% progress)
2. Check the progress bar color
3. **Expected:** Bar is red-toned (hue ≈ 25), not transparent or broken

### 100-percent progress bar

1. View a completed slice (100% progress) on the dashboard
2. Check the progress bar color
3. **Expected:** Bar is green-toned (hue ≈ 145)

## Failure Signals

- Progress bar appears transparent or has no visible fill color → `getProgressColor` returned invalid oklch or `backgroundColor` was not applied
- Progress bar is monochrome gray → `bg-foreground` was not removed or inline style is overridden by class
- Terminal size panel missing from settings → `TerminalSizePanel` not wired into `command-surface.tsx`
- Changing terminal size has no effect on expert terminals → `fontSize` prop not threaded through DualTerminal → ShellTerminal
- Footer terminal changes size when setting changes → footer ShellTerminal incorrectly received fontSize prop
- Setting doesn't persist after refresh → localStorage read/write broken in `useTerminalFontSize`

## Requirements Proved By This UAT

- R116 — Tests 1, 2, and edge cases (0%/100%) prove the progress bar uses dynamic oklch color interpolation based on completion percentage
- R120 — Tests 3–7 and edge cases prove terminal text size is adjustable in settings, applies to chat + expert terminals, excludes footer terminal, and persists across refresh

## Not Proven By This UAT

- Cross-browser oklch support (tested only in primary browser; oklch is well-supported in modern browsers but not verified in older ones)
- Terminal font size behavior with extremely long-running terminal sessions (resize/refit during active output)

## Notes for Tester

- The progress bar color is most visually interesting at mid-range percentages (30-70%) where the orange/yellow transition is clearest. 0% and 100% are the extremes (red and green).
- If no active slice has partial progress, you can verify the interpolation function works by running `getProgressColor(50)` in the browser console (if the function is accessible) or by inspecting the rendered bar's style.
- The footer terminal is the small terminal strip at the very bottom of the workspace — not the full-height terminals in expert/power view.
