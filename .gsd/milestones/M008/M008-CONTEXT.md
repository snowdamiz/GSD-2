# M008: Web Polish

**Gathered:** 2026-03-18
**Status:** Ready for planning

## Project Description

Seven UI/UX improvements to the GSD web mode: projects page redesign (list layout with expandable progress details), browser update notification and in-app update trigger, dark mode as default theme, light mode non-monochrome color consistency audit, dynamic dashboard progress bar coloring, Slack/Discord/Telegram remote question configuration in web settings, and a terminal text size preference.

## Why This Milestone

The web mode is feature-complete through M007 but daily-use polish is missing. The theme system shipped in M005 but defaults to system preference rather than dark mode, and subsequent development (M006, M007) introduced UI components primarily tested in dark mode — light mode has accumulated inconsistent accent colors. The projects page is functional but uses a basic grid layout without progress detail. Users have no browser-visible update notification. Terminal text size is hardcoded. Remote question configuration exists in TUI preferences but has no web settings surface.

## User-Visible Outcome

### When this milestone is complete, the user can:

- See their projects as a styled list and expand any project to view its current progress (milestone, slice, tasks, cost)
- Get notified of GSD updates in the browser and trigger an update without leaving the browser
- Open the web workspace and land in dark mode by default (without needing to toggle)
- Switch to light mode and see consistent green/amber/red/blue accent colors everywhere
- Watch the dashboard progress bar transition from red to green as slice tasks complete
- Configure Slack/Discord/Telegram notification channels from the web settings panel
- Adjust terminal text size in settings, affecting chat mode and expert split terminals but not the footer terminal

### Entry point / environment

- Entry point: `gsd --web`
- Environment: local dev / browser
- Live dependencies involved: npm registry (update check), none for other features

## Completion Class

- Contract complete means: `npm run build:web-host` exits 0, no raw Tailwind accent colors remain in light mode for semantic states
- Integration complete means: update check/trigger works against real npm registry, remote question settings read/write real preferences.md
- Operational complete means: none — all features are local browser UI

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- `npm run build:web-host` exits 0
- Projects view renders as a list with expandable progress details for the selected project
- Opening the web workspace with no stored preference shows dark mode
- Light mode has zero raw Tailwind color classes (`emerald-*`, `amber-*`, `red-*`, `sky-*`) for semantic states (success, warning, error, info) — all use CSS custom property tokens
- Dashboard progress bar visually transitions color from red→green based on completion percentage
- Remote questions settings panel reads and writes `remote_questions` config to preferences
- Terminal text size setting persists and applies to chat mode and expert split terminals, not the footer terminal

## Risks and Unknowns

- Light mode color audit has wide surface area (~15+ components) — risk of missing instances or introducing visual regressions
- Browser update trigger needs async npm install with progress feedback — the TUI uses synchronous `execSync` which won't work in browser context
- Projects page redesign "expandable detail" needs to fetch workspace state for non-active projects which may not have a running bridge

## Existing Codebase / Prior Art

- `web/app/globals.css` — Theme CSS custom properties (`:root` light, `.dark` dark) with `--success`, `--warning`, `--info`, `--destructive` semantic tokens
- `web/components/theme-provider.tsx` — next-themes wrapper, currently `defaultTheme="system"`
- `web/app/layout.tsx` — ThemeProvider instantiation with `attribute="class" defaultTheme="system" enableSystem`
- `src/update-check.ts` — npm registry update check with cache, `checkForUpdates()`, `compareSemver()`
- `src/update-cmd.ts` — `runUpdate()` using `execSync('npm install -g gsd-pi@latest')`
- `src/resources/extensions/remote-questions/config.ts` — `RemoteQuestionsConfig` type, `resolveRemoteConfig()`, validation
- `src/resources/extensions/gsd/preferences.ts` — `RemoteQuestionsConfig` interface, `GSDPreferences` with `remote_questions` field
- `web/components/gsd/settings-panels.tsx` — Existing settings panels (prefs, model routing, budget)
- `web/components/gsd/projects-view.tsx` — Current grid-based projects view with folder picker and dev root setup
- `web/components/gsd/dashboard.tsx` — Progress bar using `bg-foreground` (monochrome), progress percentage
- `web/components/gsd/shell-terminal.tsx` — Terminal with `fontSize: 13` hardcoded
- `web/lib/settings-types.ts` — Browser-safe settings type interfaces

> See `.gsd/DECISIONS.md` for all architectural and pattern decisions — it is an append-only register; read it during planning, append to it during execution.

## Relevant Requirements

- R114 — Dark mode is the default theme
- R115 — Light mode non-monochrome colors are consistent via design tokens
- R116 — Dashboard progress bar dynamically colors red→green by completion %
- R117 — Browser update banner with in-app update trigger
- R118 — Slack/Discord/Telegram remote question config in web settings
- R119 — Projects view is a styled list with expandable progress details
- R120 — Terminal text size adjustable in settings (chat + expert split, not footer)

## Scope

### In Scope

- Redesign projects-view.tsx from grid to styled list with expandable selected-project detail
- New API route for update check + async update trigger
- Update banner component in app-shell
- Change ThemeProvider defaultTheme from "system" to "dark"
- Audit and migrate all raw Tailwind accent colors to CSS custom property tokens in light mode
- Add remote questions configuration section to web settings panel
- New API route or preference endpoint extension for reading/writing remote_questions config
- Dynamic progress bar color interpolation (red at 0% → yellow at 50% → green at 100%)
- Terminal text size preference in settings with persistence
- Apply terminal text size to chat mode and expert split terminal but not the footer terminal

### Out of Scope / Non-Goals

- Redesigning the overall app-shell layout or navigation
- Adding new theme color variants beyond the existing oklch token system
- Implementing the actual Slack/Discord/Telegram bot runtime — only the configuration UI
- Changing the footer terminal behavior or appearance

## Technical Constraints

- Must use existing oklch CSS custom property system for all semantic colors
- Must use next-themes API for default theme change
- Update trigger must be async (cannot use execSync in browser context)
- Remote questions config must read/write the same preferences.md format the TUI uses
- Terminal text size must persist across sessions (localStorage or preferences)

## Integration Points

- npm registry — update check via existing `checkForUpdates()` infrastructure
- `~/.gsd/preferences.md` — remote questions configuration persistence
- next-themes — default theme switching
- xterm.js — terminal font size via ITerminalOptions.fontSize

## Open Questions

- Projects page: how much workspace detail to show for non-active projects (may need lightweight filesystem reads rather than full bridge state) — agent's discretion on design
