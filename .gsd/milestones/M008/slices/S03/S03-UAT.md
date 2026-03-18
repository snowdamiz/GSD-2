# S03: Theme Defaults & Light Mode Color Audit — UAT

**Milestone:** M008
**Written:** 2026-03-18

## UAT Type

- UAT mode: mixed (artifact-driven + live-runtime)
- Why this mode is sufficient: The grep scan and build are artifact-driven proofs. The theme default requires a live browser check with cleared localStorage. Visual consistency of semantic tokens in light mode requires human eyes.

## Preconditions

- `npm run build:web-host` exits 0 (already verified during slice completion)
- A running GSD web instance: `npm run gsd:web:stop:all >/dev/null 2>&1 || true && npm run gsd:web`
- Browser DevTools accessible (F12 / Cmd+Opt+I)

## Smoke Test

Open the web app in a new incognito/private window (no stored preferences). The page should render in dark mode without any user action.

## Test Cases

### 1. Dark mode is the default theme

1. Open the web app in an incognito/private browser window (or clear `localStorage` for the app's origin)
2. The page loads
3. Open DevTools → Elements tab
4. **Expected:** The `<html>` element has `class="dark"` (or includes `dark` in its class list). `localStorage.getItem('theme')` returns `null`.

### 2. Theme toggle still works

1. From test case 1 (dark mode default), click the theme toggle in the settings or header
2. Switch to light mode
3. **Expected:** The page renders in light mode. `localStorage.getItem('theme')` returns `"light"`.
4. Refresh the page
5. **Expected:** Light mode persists — the stored preference overrides the default.

### 3. Zero raw Tailwind accent colors in components

1. In a terminal, run: `rg "emerald-|amber-|red-[0-9]|sky-|orange-|green-[0-9]|blue-[0-9]" web/components/ -g "*.tsx" -g "*.ts"`
2. **Expected:** Zero output, exit code 1 (no matches).

### 4. Production build passes cleanly

1. Run: `npm run build:web-host`
2. **Expected:** Exit code 0. No "unknown utility" or "error" messages in stderr related to semantic token classes.

### 5. Light mode semantic colors are visually consistent

1. Open the web app and switch to light mode
2. Navigate to Dashboard view
3. **Expected:** Success states (completed tasks, passing checks) use a consistent green tone. Warning states use a consistent amber/orange tone. Error states use a consistent red tone. Info states use a consistent blue tone.
4. Navigate to the Visualizer view (if accessible)
5. **Expected:** The same four semantic colors appear — no jarring color mismatches between views.
6. Navigate to Settings
7. **Expected:** Same color consistency.

### 6. Dark mode semantic colors are visually consistent

1. Switch back to dark mode
2. Repeat the navigation from test case 5 (Dashboard → Visualizer → Settings)
3. **Expected:** All four semantic colors render correctly in dark mode. Colors should be readable against the dark background — not washed out or overly bright.

### 7. Onboarding steps use semantic tokens

1. If possible, trigger the onboarding flow (or inspect the onboarding step components visually)
2. **Expected:** Success indicators (green checks), warning/info messages, and error states in onboarding steps use the same semantic colors as the rest of the app. No raw emerald/amber/red/sky classes visible.

## Edge Cases

### String literal color names preserved

1. Open `web/components/gsd/visualizer-view.tsx` in an editor
2. Search for string literals like `"emerald"`, `"sky"`, `"amber"`
3. **Expected:** These appear only as type union values or object keys — NOT as Tailwind class names. They are programmatic identifiers and should not have been replaced.

### Toast destructive variant

1. Trigger an error toast notification (e.g., by causing an API error)
2. **Expected:** The destructive toast renders with the correct red/destructive semantic color. The `group-[.destructive]` compound class pattern in `toast.tsx` should resolve correctly.

### Opacity modifiers preserved

1. In a terminal, run: `rg "bg-success/|bg-warning/|bg-destructive/|bg-info/" web/components/ -g "*.tsx" | head -10`
2. **Expected:** Output shows semantic token classes WITH opacity modifiers (e.g., `bg-success/20`, `bg-destructive/5`). The opacity values should be reasonable (not all `/100` or all `/0`).

## Failure Signals

- `<html>` element does not have `dark` class in a fresh browser session → ThemeProvider default is wrong
- `rg` scan returns any hits → raw accent colors were missed or reintroduced
- `npm run build:web-host` fails with "unknown utility" → a semantic token class is misspelled or undefined in globals.css
- Visible color inconsistency between views in light mode → token definitions in `globals.css` need tuning
- A component shows no color where it previously showed emerald/amber/red/sky → the token substitution removed a class instead of replacing it

## Requirements Proved By This UAT

- R114 — Test cases 1 and 2 prove dark mode is the default and stored preferences still override it
- R115 — Test cases 3, 4, 5, 6, and 7 prove every non-monochrome color uses semantic tokens, the build resolves them, and they render consistently

## Not Proven By This UAT

- Pixel-perfect color matching against a specific design spec — this UAT verifies consistency, not exact hue values
- Accessibility contrast ratios — semantic tokens may need contrast tuning for WCAG compliance (not in scope for this slice)
- System-preference detection behavior — `enableSystem` was intentionally removed; reverting would require re-adding it

## Notes for Tester

- The `@gsd/native` module warning during build is pre-existing and unrelated to this slice — it's a Turbopack limitation documented in KNOWLEDGE.md.
- String literal color names like `"emerald"` in component files are intentional — they're used as programmatic identifiers in type unions and object keys, not as CSS classes.
- If light mode colors look "off" compared to before, the issue is in the `:root` token definitions in `web/app/globals.css`, not in the component files. The components now delegate all color choices to the token layer.
