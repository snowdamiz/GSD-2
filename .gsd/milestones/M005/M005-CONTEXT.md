---
depends_on: [M003]
---

# M005: Light Theme with System-Aware Toggle

**Gathered:** 2026-03-16
**Status:** Queued — pending auto-mode execution.

## Project Description

Add a light theme to the GSD web workspace. The existing dark monochrome IDE theme becomes the dark variant; a new monochrome light variant is added. Theme defaults to the user's OS preference (`prefers-color-scheme`) but can be toggled manually. Preference persists across sessions.

## Why This Milestone

The web UI currently hardcodes dark-only. Users who prefer light mode or work in bright environments have no option. Adding system-aware theming is a standard product expectation and makes the browser workspace more accessible.

## User-Visible Outcome

### When this milestone is complete, the user can:

- Open `gsd --web` and see the theme automatically match their OS light/dark preference
- Click a toggle in the NavRail sidebar footer to switch between light, dark, and system modes
- Have their theme choice persist across browser sessions and page reloads

### Entry point / environment

- Entry point: `gsd --web`
- Environment: local dev / browser
- Live dependencies involved: none beyond the existing web host

## Completion Class

- Contract complete means: light and dark CSS variable sets exist, `ThemeProvider` is wired with `attribute="class"` and `defaultTheme="system"`, and the toggle renders in the NavRail
- Integration complete means: every surface (dashboard, terminal, roadmap, files, activity, visualizer, diagnostics panels, command surfaces, onboarding, focused panel, markdown/code viewers) renders correctly in both themes
- Operational complete means: theme preference persists via `next-themes` localStorage, OS preference changes are picked up in system mode, and no flash-of-wrong-theme on load

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- With OS set to light mode and no stored preference, `gsd --web` renders the light theme on first load without flash
- Toggling to dark via the NavRail button switches all surfaces immediately — no stale panels or missed tokens
- Both `npm run build` and `npm run build:web-host` succeed, and no existing tests break

## Risks and Unknowns

- **Hardcoded oklch values in globals.css** — The markdown-body and file-viewer-code CSS sections use raw oklch values instead of CSS variables. These must be converted to use theme-aware tokens or scoped `.dark`/`:root` overrides.
- **Tailwind v4 dark variant** — The custom variant `@custom-variant dark (&:is(.dark *))` is already set up, which means `dark:` utility classes will work with the `.dark` class on `<html>`. `next-themes` with `attribute="class"` should integrate cleanly, but needs verification.
- **Flash of incorrect theme (FOIT)** — `next-themes` handles this with a blocking script, but the Next.js layout needs the `suppressHydrationWarning` attribute on `<html>` for SSR compatibility.

## Existing Codebase / Prior Art

- `web/app/globals.css` — All theme tokens defined here. `:root` and `.dark` currently hold identical monochrome dark values. Comment says "Monochrome IDE Theme - Always Dark". ~80 oklch references. Bottom sections (markdown-body, file-viewer-code) have hardcoded oklch values outside the CSS variable system.
- `web/app/layout.tsx` — Root layout, currently missing `ThemeProvider` wrapper and `suppressHydrationWarning`.
- `web/components/theme-provider.tsx` — Already exists, wraps `next-themes` `ThemeProvider`. Not imported anywhere.
- `web/components/gsd/sidebar.tsx` — NavRail component with footer section (Git, Settings, LogOut buttons). Theme toggle goes here.
- `web/components/ui/` — 57 shadcn/ui components, all using Tailwind classes referencing CSS variables. No hardcoded colors.
- `web/components/gsd/` — 22 GSD-specific components, all using Tailwind classes. No hardcoded oklch values found in component files.

> See `.gsd/DECISIONS.md` for all architectural and pattern decisions — it is an append-only register; read it during planning, append to it during execution.

## Relevant Requirements

- No existing requirement covers theming. This introduces new scope.

## Scope

### In Scope

- Define light-mode CSS variable values in `:root` (monochrome, zero-chroma, matching the dark theme's aesthetic)
- Move current dark values under `.dark` selector
- Wire `ThemeProvider` from `next-themes` into `layout.tsx` with `attribute="class"`, `defaultTheme="system"`, `enableSystem`
- Add `suppressHydrationWarning` to `<html>` element
- Add a theme toggle button in the NavRail sidebar footer (sun/moon icon, cycles system → light → dark)
- Convert hardcoded oklch values in markdown-body and file-viewer-code CSS to theme-aware tokens or scoped selectors
- Visual verification of all major surfaces in both themes
- Ensure `npm run build` and `npm run build:web-host` pass

### Out of Scope / Non-Goals

- Redesigning the UI or changing the monochrome aesthetic
- Adding custom/user-defined themes beyond light and dark
- Theme-aware syntax highlighting in code blocks (Shiki themes) — can be a follow-up
- Changing the TUI theme system

## Technical Constraints

- All component colors already use CSS variables via Tailwind — do not introduce hardcoded colors in components
- `next-themes` is already a dependency — use it, don't add another theming library
- The `ThemeProvider` wrapper already exists — wire it, don't rewrite it
- Tailwind v4 `@custom-variant dark (&:is(.dark *))` is the dark mode mechanism — `next-themes` must use `attribute="class"` to add/remove `.dark` on `<html>`
- Light theme values should be monochrome (zero chroma) to match the dark theme's pure-gray aesthetic
- Theme preference persistence is handled by `next-themes` localStorage — no custom storage needed

## Integration Points

- `web/app/globals.css` — Primary work site: new `:root` light values, `.dark` scoped dark values, converted hardcoded values
- `web/app/layout.tsx` — Wire `ThemeProvider`, add `suppressHydrationWarning`
- `web/components/gsd/sidebar.tsx` — Add toggle button to NavRail footer
- `web/components/theme-provider.tsx` — Already exists, just needs to be imported

## Open Questions

- None — the architecture is straightforward given the existing CSS variable setup and `next-themes` availability.
