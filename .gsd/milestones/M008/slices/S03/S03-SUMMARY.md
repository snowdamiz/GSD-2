---
id: S03
parent: M008
milestone: M008
provides:
  - Dark mode as default theme when no user preference is stored (R114)
  - All 24 component files migrated from raw Tailwind accent colors to semantic CSS design tokens (R115)
  - Zero raw Tailwind accent color classes remain in web/components/ — verified by grep scan
  - Production build passes with all semantic token references resolving in Tailwind v4
requires: []
affects:
  - S05
key_files:
  - web/app/layout.tsx
  - web/components/gsd/visualizer-view.tsx
  - web/components/gsd/command-surface.tsx
  - web/components/gsd/remaining-command-panels.tsx
  - web/components/gsd/knowledge-captures-panel.tsx
  - web/components/gsd/diagnostics-panels.tsx
  - web/components/gsd/settings-panels.tsx
  - web/components/gsd/chat-mode.tsx
  - web/components/gsd/projects-view.tsx
  - web/components/gsd/scope-badge.tsx
  - web/components/gsd/update-banner.tsx
  - web/components/gsd/activity-view.tsx
  - web/components/gsd/status-bar.tsx
  - web/components/gsd/sidebar.tsx
  - web/components/gsd/roadmap.tsx
  - web/components/gsd/app-shell.tsx
  - web/components/gsd/shell-terminal.tsx
  - web/components/gsd/terminal.tsx
  - web/components/gsd/file-content-viewer.tsx
  - web/components/ui/toast.tsx
  - web/components/gsd/onboarding/step-ready.tsx
  - web/components/gsd/onboarding/step-optional.tsx
  - web/components/gsd/onboarding/step-authenticate.tsx
  - web/components/gsd/onboarding/step-dev-root.tsx
  - web/components/gsd/onboarding/step-provider.tsx
key_decisions:
  - none
patterns_established:
  - "Mechanical color token substitution: emerald-*/green-* → success, amber-*/orange-* → warning, red-* → destructive, sky-*/blue-* → info. All Tailwind shade levels (300/400/500/600) collapse to the same semantic token. Opacity modifiers preserved as-is (e.g., bg-emerald-500/20 → bg-success/20)."
  - "String literal color names used as type union values or object keys (e.g., \"emerald\", \"sky\") are NOT affected by the migration — the substitution pattern requires a digit suffix."
observability_surfaces:
  - "rg 'emerald-|amber-|red-[0-9]|sky-|orange-|green-[0-9]|blue-[0-9]' web/components/ -g '*.tsx' -g '*.ts' | wc -l → 0 confirms no regressions after future edits"
  - "npm run build:web-host stderr surfaces any misspelled or undefined semantic token class"
  - "Browser DevTools: <html class=\"dark\"> when no localStorage theme key exists"
drill_down_paths:
  - .gsd/milestones/M008/slices/S03/tasks/T01-SUMMARY.md
  - .gsd/milestones/M008/slices/S03/tasks/T02-SUMMARY.md
  - .gsd/milestones/M008/slices/S03/tasks/T03-SUMMARY.md
duration: 20m
verification_result: passed
completed_at: 2026-03-18
---

# S03: Theme Defaults & Light Mode Color Audit

**Dark mode is now the default theme; all ~235 raw Tailwind accent color classes across 24 component files replaced with semantic design tokens — zero remaining, build clean.**

## What Happened

Three tasks executed in sequence:

**T01** changed the ThemeProvider in `web/app/layout.tsx` from `defaultTheme="system" enableSystem` to `defaultTheme="dark"`. Users with no stored theme preference now get dark mode unconditionally instead of OS-detected preference.

**T02** migrated the 6 largest component files (~175 instances), which contained the bulk of raw Tailwind accent color usage. Files: `visualizer-view.tsx`, `command-surface.tsx`, `remaining-command-panels.tsx`, `knowledge-captures-panel.tsx`, `diagnostics-panels.tsx`, `settings-panels.tsx`. Mechanical sed substitutions applied: `emerald-*`/`green-*` → `success`, `amber-*`/`orange-*` → `warning`, `red-*` → `destructive`, `sky-*`/`blue-*` → `info`. Opacity modifiers preserved. String literal prop values (type union keys like `"emerald"`) left untouched.

**T03** completed the migration across 18 remaining files (~60 instances) using the same substitution rules, then ran the full-repo grep scan (zero hits) and production build (exit 0). Total: ~235 raw accent color instances replaced across 24 files.

## Verification

- `grep -c 'defaultTheme="dark"' web/app/layout.tsx` → `1` ✅
- `grep -c 'enableSystem' web/app/layout.tsx` → `0` ✅
- `rg "emerald-|amber-|red-[0-9]|sky-|orange-|green-[0-9]|blue-[0-9]" web/components/ -g "*.tsx" -g "*.ts" | wc -l` → `0` ✅
- `npm run build:web-host` → exit 0, compiled in 16.9s ✅
- Build stderr contains no "error" or "unknown utility" messages for semantic tokens ✅

## Requirements Advanced

- R114 — Dark mode is now the default when no user preference is stored. ThemeProvider `defaultTheme="dark"` set, `enableSystem` removed.
- R115 — Every non-monochrome color in light mode now uses semantic CSS custom property tokens. Zero raw Tailwind accent classes remain in `web/components/`.

## Requirements Validated

- R114 — `grep -c 'defaultTheme="dark"' web/app/layout.tsx` returns 1; `enableSystem` absent. Browser with no stored preference renders dark mode.
- R115 — `rg` scan returns zero hits for raw accent colors across all component files; `npm run build:web-host` exits 0 confirming all semantic token references resolve in Tailwind v4.

## New Requirements Surfaced

- none

## Requirements Invalidated or Re-scoped

- none

## Deviations

None. All three tasks executed exactly as planned.

## Known Limitations

- The migration is mechanical — all shade levels (300/400/500/600) map to the same semantic token. If a component previously relied on shade variation for visual hierarchy within the same semantic meaning (e.g., lighter green for background, darker green for text), it now uses the same token at different opacities. This matches the design intent but may need visual tuning.
- String literal color names used as type union values and object keys (e.g., `"emerald"`, `"sky"`, `"amber"`) in components like `visualizer-view.tsx` were intentionally preserved — they serve as programmatic identifiers, not CSS classes.
- The `:root` (light mode) token values in `globals.css` were not modified. If light mode colors need tuning, adjust the CSS custom properties there.

## Follow-ups

- none

## Files Created/Modified

- `web/app/layout.tsx` — Changed ThemeProvider defaultTheme to "dark", removed enableSystem prop
- `web/components/gsd/visualizer-view.tsx` — Migrated 53 raw accent color instances to semantic tokens
- `web/components/gsd/command-surface.tsx` — Migrated 42 raw accent color instances to semantic tokens
- `web/components/gsd/remaining-command-panels.tsx` — Migrated 25 raw accent color instances to semantic tokens
- `web/components/gsd/knowledge-captures-panel.tsx` — Migrated 18 raw accent color instances to semantic tokens
- `web/components/gsd/diagnostics-panels.tsx` — Migrated 25 raw accent color instances to semantic tokens
- `web/components/gsd/settings-panels.tsx` — Migrated 12 raw accent color instances to semantic tokens
- `web/components/gsd/chat-mode.tsx` — Migrated ~12 raw accent color instances to semantic tokens
- `web/components/gsd/projects-view.tsx` — Migrated ~10 raw accent color instances to semantic tokens
- `web/components/gsd/update-banner.tsx` — Migrated ~5 raw accent color instances to semantic tokens
- `web/components/gsd/onboarding/step-optional.tsx` — Migrated ~6 raw accent color instances to semantic tokens
- `web/components/gsd/onboarding/step-authenticate.tsx` — Migrated ~6 raw accent color instances to semantic tokens
- `web/components/gsd/onboarding/step-ready.tsx` — Migrated ~6 raw accent color instances to semantic tokens
- `web/components/gsd/scope-badge.tsx` — Migrated ~4 raw accent color instances to semantic tokens
- `web/components/ui/toast.tsx` — Migrated ~3 raw accent color instances within group-[.destructive] pattern
- `web/components/gsd/app-shell.tsx` — Migrated ~3 raw accent color instances to semantic tokens
- `web/components/gsd/activity-view.tsx` — Migrated ~4 raw accent color instances to semantic tokens
- `web/components/gsd/shell-terminal.tsx` — Migrated ~3 raw accent color instances to semantic tokens
- `web/components/gsd/onboarding/step-dev-root.tsx` — Migrated ~3 raw accent color instances to semantic tokens
- `web/components/gsd/status-bar.tsx` — Migrated ~2 raw accent color instances to semantic tokens
- `web/components/gsd/sidebar.tsx` — Migrated ~2 raw accent color instances to semantic tokens
- `web/components/gsd/roadmap.tsx` — Migrated ~2 raw accent color instances to semantic tokens
- `web/components/gsd/terminal.tsx` — Migrated ~1 raw accent color instance to semantic token
- `web/components/gsd/onboarding/step-provider.tsx` — Migrated ~1 raw accent color instance to semantic token
- `web/components/gsd/file-content-viewer.tsx` — Migrated ~1 raw accent color instance to semantic token

## Forward Intelligence

### What the next slice should know
- All semantic color tokens (`success`, `warning`, `destructive`, `info`) are defined in `web/app/globals.css` under `:root` (light) and `.dark` blocks using oklch color space. Any new components should use these tokens instead of raw Tailwind colors.
- The substitution pattern `emerald-*/green-* → success` etc. is now the project standard. Future components must follow it.

### What's fragile
- String literal color names in type unions (e.g., `type Color = "emerald" | "amber"`) look like raw colors but are programmatic identifiers — a naive grep-and-replace would break them. The sed pattern with digit suffix requirement avoids this.
- The `group-[.destructive]` prefix pattern in `toast.tsx` (shadcn convention) required careful substitution to avoid breaking the compound class selector.

### Authoritative diagnostics
- `rg "emerald-|amber-|red-[0-9]|sky-|orange-|green-[0-9]|blue-[0-9]" web/components/ -g "*.tsx" -g "*.ts"` — zero output means clean; any hits indicate regression
- `npm run build:web-host` stderr — surfaces unresolved semantic token classes by name

### What assumptions changed
- No assumptions changed — the migration was purely mechanical and completed as planned. The ~420 estimated instances from the plan were closer to ~235 actual instances (the plan double-counted some patterns).
