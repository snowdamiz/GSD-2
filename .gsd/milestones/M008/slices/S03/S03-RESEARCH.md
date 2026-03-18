# S03 — Theme Defaults & Light Mode Color Audit — Research

**Date:** 2026-03-18
**Depth:** Targeted

## Summary

This slice has two deliverables: (1) change the default theme from `"system"` to `"dark"` — a one-line change in `layout.tsx`, and (2) migrate all raw Tailwind accent color classes to semantic CSS custom property tokens across 24 component files (~234 instances total).

The semantic token infrastructure already exists. `globals.css` defines `--success`, `--warning`, `--info`, and `--destructive` in both `:root` (light) and `.dark` blocks, registered in the `@theme inline` block as `--color-success`, `--color-warning`, `--color-info`. Tailwind v4's CSS-first approach means `text-success`, `bg-success/15`, `border-success/20` all work out of the box — oklch values support alpha natively. Some components already use these tokens (`terminal.tsx`, `scope-badge.tsx`, `dashboard.tsx`, `app-shell.tsx`), proving the pattern. The remaining ~234 raw-color instances need the same mechanical migration.

The mapping is straightforward: `emerald-*` → `success`, `amber-*`/`orange-*` → `warning`, `red-*` → `destructive`, `sky-*`/`blue-*` → `info`, `green-*` → `success`. The `-300` variants (used in ~13 places for slightly lighter text) map to the same token — the oklch values already differ between light and dark modes. The `-500` variants used in borders/backgrounds with opacity modifiers (e.g., `border-emerald-500/20`) become `border-success/20`.

## Recommendation

Split into two tasks: (1) default theme change, (2) color audit migration. The color audit is the bulk of the work — tackle the 6 highest-count files first (visualizer-view 53, command-surface 42, remaining-command-panels 25, diagnostics-panels 25, knowledge-captures-panel 18, settings-panels 12), then the remaining 18 smaller files. Verify with `rg` after each file, then a final full-scan verification.

## Implementation Landscape

### Key Files

**Theme default (T01):**
- `web/app/layout.tsx` — Change `defaultTheme="system"` to `defaultTheme="dark"` on line 37. Also remove `enableSystem` prop since dark is the hard default.

**Color audit migration (T02) — 24 files, by instance count:**

| File | Instances | Semantic mapping |
|------|-----------|-----------------|
| `web/components/gsd/visualizer-view.tsx` | 53 | emerald→success, amber→warning, red→destructive, sky→info |
| `web/components/gsd/command-surface.tsx` | 42 | emerald→success, amber→warning, red→destructive, blue→info |
| `web/components/gsd/remaining-command-panels.tsx` | 25 | emerald→success, amber→warning, red→destructive, sky→info |
| `web/components/gsd/diagnostics-panels.tsx` | 25 | emerald→success, amber→warning, red→destructive, sky→info |
| `web/components/gsd/knowledge-captures-panel.tsx` | 18 | emerald→success, amber→warning, red→destructive, sky→info |
| `web/components/gsd/settings-panels.tsx` | 12 | emerald→success, amber→warning, red→destructive, sky→info |
| `web/components/gsd/chat-mode.tsx` | 11 | red→destructive, blue→info, green→success, amber→warning |
| `web/components/gsd/projects-view.tsx` | 9 | emerald→success, sky→info, amber→warning, orange→warning, red→destructive |
| `web/components/gsd/scope-badge.tsx` | 4 | amber→warning, sky→info |
| `web/components/gsd/onboarding/step-ready.tsx` | 4 | emerald→success |
| `web/components/gsd/onboarding/step-optional.tsx` | 4 | emerald→success |
| `web/components/gsd/onboarding/step-authenticate.tsx` | 4 | emerald→success |
| `web/components/gsd/activity-view.tsx` | 4 | blue→info, emerald→success, red→destructive, amber→warning |
| `web/components/gsd/update-banner.tsx` | 3 | emerald→success, orange→warning |
| `web/components/gsd/status-bar.tsx` | 2 | amber→warning |
| `web/components/gsd/sidebar.tsx` | 2 | emerald→success, amber→warning |
| `web/components/gsd/shell-terminal.tsx` | 2 | emerald→success, red→destructive |
| `web/components/gsd/roadmap.tsx` | 2 | emerald→success, amber→warning |
| `web/components/gsd/onboarding/step-dev-root.tsx` | 2 | red→destructive |
| `web/components/gsd/app-shell.tsx` | 2 | amber→warning |
| `web/components/ui/toast.tsx` | 1 | red→destructive (shadcn component) |
| `web/components/gsd/terminal.tsx` | 1 | amber→warning |
| `web/components/gsd/onboarding/step-provider.tsx` | 1 | emerald→success |
| `web/components/gsd/file-content-viewer.tsx` | 1 | blue→info |

**CSS tokens (already done — no changes needed):**
- `web/app/globals.css` — `:root` and `.dark` blocks already define `--success`, `--warning`, `--info`, `--destructive` with proper oklch values for both themes. The `@theme inline` block registers them as `--color-success`, `--color-warning`, `--color-info`.

**Note:** `--destructive` is already in the shadcn base token set (no need to add to `@theme inline`). `--color-destructive` is already mapped.

### Color Substitution Rules

These are the mechanical find/replace patterns:

| Raw Tailwind class | Semantic token class |
|--------------------|---------------------|
| `text-emerald-400` | `text-success` |
| `text-emerald-300` | `text-success` |
| `text-emerald-500` | `text-success` |
| `bg-emerald-400` | `bg-success` |
| `bg-emerald-500` | `bg-success` |
| `bg-emerald-500/N` | `bg-success/N` |
| `border-emerald-500/N` | `border-success/N` |
| `from-emerald-500/N` | `from-success/N` |
| `text-amber-400` | `text-warning` |
| `text-amber-300` | `text-warning` |
| `text-amber-500` | `text-warning` |
| `bg-amber-400` | `bg-warning` |
| `bg-amber-500` | `bg-warning` |
| `bg-amber-500/N` | `bg-warning/N` |
| `border-amber-500/N` | `border-warning/N` |
| `from-amber-500/N` | `from-warning/N` |
| `text-red-400` | `text-destructive` |
| `text-red-300` | `text-destructive` |
| `text-red-500` | `text-destructive` |
| `bg-red-400` | `bg-destructive` |
| `bg-red-500` | `bg-destructive` |
| `bg-red-500/N` | `bg-destructive/N` |
| `border-red-500/N` | `border-destructive/N` |
| `text-sky-400` | `text-info` |
| `text-sky-300` | `text-info` |
| `bg-sky-400` | `bg-info` |
| `bg-sky-500` | `bg-info` |
| `bg-sky-500/N` | `bg-info/N` |
| `border-sky-500/N` | `border-info/N` |
| `from-sky-500/N` | `from-info/N` |
| `text-blue-400` | `text-info` |
| `text-blue-300` | `text-info` |
| `bg-blue-400/N` | `bg-info/N` |
| `text-orange-400` | `text-warning` |
| `text-orange-300` | `text-warning` |
| `bg-orange-500/N` | `bg-warning/N` |
| `border-orange-500/N` | `border-warning/N` |
| `text-green-400` | `text-success` |
| `bg-green-500/N` | `bg-success/N` |
| `ring-red-500/N` | `ring-destructive/N` |
| `ring-emerald-500/N` | `ring-success/N` |
| `ring-amber-500/N` | `ring-warning/N` |
| `focus:ring-red-400` | `focus:ring-destructive` |
| `focus:ring-offset-red-600` | `focus:ring-offset-destructive` |

Compound opacity patterns like `text-emerald-400/80` → `text-success/80` and `text-red-400/60` → `text-destructive/60`.

### Build Order

1. **T01: Default theme change** — one-line change in `layout.tsx`, zero risk, instant verification.
2. **T02: Color audit migration** — mechanical substitution across all 24 files. Can be batched into groups (e.g., big files first, then small files). Each file is independent — no ordering constraint between them. After all files are migrated, run the verification `rg` scan.

### Verification Approach

1. **Default theme:** Open the web app with no stored preference, confirm it renders in dark mode.
2. **Color audit grep verification:**
   ```bash
   rg "emerald-|amber-|red-[0-9]|sky-|orange-|green-[0-9]|blue-[0-9]" web/components/ -g "*.tsx" -g "*.ts"
   ```
   Must return zero hits.
3. **Build:** `npm run build:web-host` exits 0 — confirms all token references resolve in Tailwind v4.

## Constraints

- **Tailwind v4 CSS-first config** — no `tailwind.config.ts` exists. All theme registration is via `@theme inline` in `globals.css`. Token classes like `text-success`, `bg-success/15` work because `--color-success` is registered in the `@theme inline` block.
- **oklch opacity** — Tailwind v4 natively supports opacity modifiers on oklch-based custom properties (e.g., `bg-success/15`). No special configuration needed.
- **`--destructive` already in base** — The `--destructive` token is part of shadcn's default token set, already mapped as `--color-destructive` in `@theme inline`. No need to add a separate destructive registration.

## Common Pitfalls

- **`-300` vs `-400` vs `-500` variants** — The raw code uses three shade levels for the same semantic color (e.g., `emerald-300` for light text, `emerald-400` for normal text, `emerald-500` for backgrounds/borders). All map to the same token — the light/dark mode CSS values already handle the shade difference. Don't try to create separate `--success-light` tokens.
- **Opacity on compound classes** — Patterns like `text-emerald-400/80` must become `text-success/80`, not `text-success opacity-80`. The oklch token supports inline alpha. Similarly, `bg-red-500/3` → `bg-destructive/3`.
- **`hover:` and `group-hover:` modifiers** — Several files use hover variants like `hover:bg-emerald-500/15` or `group-hover:text-emerald-400`. These must be migrated too: `hover:bg-success/15`, `group-hover:text-success`.
- **`animate-ping` with color** — `animate-ping rounded-full bg-emerald-500/20` in `diagnostics-panels.tsx` and `chat-mode.tsx` — the animation applies to the opacity of the element. `bg-success/20` works fine here.
- **Toast component** — `web/components/ui/toast.tsx` has destructive group styling with `red-300/red-400/red-600`. This is a shadcn base component — migrate it to `destructive` token classes for consistency. It already uses `group-[.destructive]` prefix pattern.
