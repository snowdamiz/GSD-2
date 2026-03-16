---
id: S02
parent: M003
milestone: M003
provides:
  - dispatchGSDSubcommand() classifying all 30 upstream /gsd subcommands into surface (20), passthrough (9), or local help (1)
  - 20 new BrowserSlashCommandSurface union members with gsd- prefix
  - GSD_SURFACE_SUBCOMMANDS map, GSD_PASSTHROUGH_SUBCOMMANDS set, GSD_HELP_TEXT constant
  - 20 CommandSurfaceSection variants, generic { kind: "gsd" } CommandSurfaceTarget
  - IMPLEMENTED_BROWSER_COMMAND_SURFACES expanded from 12 to 32 entries
  - gsd_help local action wired in store with inline help text
  - Placeholder component rendering for all gsd-* sections with data-testid attributes
  - Exhaustive parity contract test (118 tests) covering every GSD subcommand dispatch outcome
requires:
  - slice: S01
    provides: Unified codebase with all upstream modules and working builds
affects:
  - S04 (forensics, doctor, skill-health panels consume gsd-forensics/gsd-doctor/gsd-skill-health surfaces)
  - S05 (knowledge/captures page consumes gsd-knowledge/gsd-capture/gsd-triage surfaces)
  - S06 (settings extensions consume gsd-prefs/gsd-mode surfaces)
  - S07 (remaining commands consume all other gsd-* surfaces)
key_files:
  - web/lib/browser-slash-command-dispatch.ts
  - web/lib/command-surface-contract.ts
  - web/lib/gsd-workspace-store.tsx
  - web/components/gsd/command-surface.tsx
  - src/tests/web-command-parity-contract.test.ts
key_decisions:
  - GSD dispatch intercepts before SURFACE_COMMANDS lookup to prevent /gsd export colliding with /export
  - Single generic { kind: "gsd" } CommandSurfaceTarget instead of 20 specific variants — keeps type union lean; S04-S07 refine per-surface payloads as needed
  - GSD surface section names exactly match surface names (gsd-forensics section for gsd-forensics surface) — no mapping table
  - startsWith("gsd-") guard in target builder and renderer avoids 20 repetitive switch cases
  - Hardcoded EXPECTED_GSD_OUTCOMES map (30 entries) instead of dynamically collecting from commands.ts — simpler and self-documenting
patterns_established:
  - GSD subcommand classification: surface (20) / passthrough (9) / local help (1) / bare passthrough
  - GSD target shape carries surface + subcommand + args — downstream consumers destructure subcommand for routing
  - Placeholder rendering with data-testid="gsd-surface-{section}" for DOM inspection
  - Contract wiring test pattern: dispatch → surfaceOutcomeToOpenRequest → openCommandSurfaceState → assert open/section/target
observability_surfaces:
  - dispatchBrowserSlashCommand() return value is inspectable — .kind, .surface, .action fields
  - getBrowserSlashCommandTerminalNotice() emits system notices for surface-routed GSD commands, null for passthrough
  - EXPECTED_GSD_OUTCOMES map is the authoritative diagnostic listing of every GSD subcommand and its expected browser behavior
  - npx tsx --test src/tests/web-command-parity-contract.test.ts — 118 tests, immediate silent-fallthrough detection
drill_down_paths:
  - .gsd/milestones/M003/slices/S02/tasks/T01-SUMMARY.md
  - .gsd/milestones/M003/slices/S02/tasks/T02-SUMMARY.md
  - .gsd/milestones/M003/slices/S02/tasks/T03-SUMMARY.md
duration: ~39m
verification_result: passed
completed_at: 2026-03-16
---

# S02: Browser slash-command dispatch for all upstream commands

**Every `/gsd` subcommand (30 total) now dispatches to a defined outcome — 20 open browser surfaces, 9 pass through to the bridge, 1 renders inline help — with no silent fallthrough, backed by 118 passing contract tests.**

## What Happened

Built the dispatch-to-render pipeline for all upstream `/gsd` subcommands in three tasks:

**T01 — Dispatch function and surface union (12m):** Added `dispatchGSDSubcommand()` to `browser-slash-command-dispatch.ts`, expanding the `BrowserSlashCommandSurface` union with 20 `gsd-`-prefixed members. Created `GSD_SURFACE_SUBCOMMANDS` (20-entry map), `GSD_PASSTHROUGH_SUBCOMMANDS` (9-entry set), and `GSD_HELP_TEXT`. The function parses the first word of args as the subcommand, then routes to surface/local/prompt. Wired into `dispatchBrowserSlashCommand()` after the `/new` check and before `SURFACE_COMMANDS.get()` — this ordering ensures `/gsd export` routes to `gsd-export` while `/export` still routes to `export` (the built-in session export).

**T02 — Contract types, store, and component stubs (15m):** Propagated the 20 GSD surfaces through the entire command-surface pipeline. Added 20 `CommandSurfaceSection` variants, a single generic `{ kind: "gsd"; surface; subcommand; args }` `CommandSurfaceTarget`, 20 switch cases in `commandSurfaceSectionForRequest()`, a `startsWith("gsd-")` guard in `buildCommandSurfaceTarget()`, expanded `IMPLEMENTED_BROWSER_COMMAND_SURFACES` from 12 to 32, wired `gsd_help` local action in the store, and added placeholder component rendering for all `gsd-*` sections with `data-testid` attributes.

**T03 — Exhaustive parity contract test (12m):** Added 4 new test blocks (80+ subtests) to `web-command-parity-contract.test.ts`. The `EXPECTED_GSD_OUTCOMES` map classifies all 30 subcommands. Tests verify: every subcommand dispatches to the correct kind, surface names match, passthrough preserves input text, `/gsd help` produces inline help, bare `/gsd` passes through, `/export` vs `/gsd export` are distinct, unknown subcommands pass through, sub-args are preserved, terminal notices work, and the full dispatch→open-request→surface-state pipeline is unbroken for all 20 surfaces. Also fixed pre-existing drift: `/provider` (upstream's 21st built-in) added to expected outcomes.

## Verification

- **`npx tsx --test src/tests/web-command-parity-contract.test.ts`** — 118 tests pass, 0 fail, 0 skipped
- **`npm run build`** — exit 0 (TypeScript compilation with all new types)
- **`npm run build:web-host`** — exit 0 (Next.js production build with component stubs, staged standalone host)
- **Diagnostic check:** `/gsd xyznotreal` → `kind: "prompt"` with `slashCommandName: "gsd"` preserved. `/gsd forensics` → `kind: "surface"` with `surface: "gsd-forensics"`. `getBrowserSlashCommandTerminalNotice()` → `type: "system"` for surface, `null` for passthrough.

## Requirements Advanced

- **R101** — Every `/gsd` subcommand now dispatches correctly from the browser terminal. 20 open surfaces, 9 bridge passthroughs, 1 inline help. Exhaustive contract test proves no silent fallthrough. Surfaces are stubs pending S04-S07 content.
- **R103** — `/gsd forensics` dispatches to `gsd-forensics` surface with placeholder. Real panel content deferred to S04.
- **R104** — `/gsd doctor` dispatches to `gsd-doctor` surface with placeholder. Real panel content deferred to S04.
- **R105** — `/gsd skill-health` dispatches to `gsd-skill-health` surface with placeholder. Real panel content deferred to S04.
- **R106** — `/gsd knowledge`, `/gsd capture`, `/gsd triage` dispatch to their surfaces. Real page content deferred to S05.
- **R107** — `/gsd prefs`, `/gsd mode` dispatch to their surfaces. Real settings extensions deferred to S06.
- **R108** — All remaining subcommand surfaces (`quick`, `history`, `undo`, `steer`, `hooks`, `config`, `inspect`, `export`, `cleanup`, `queue`) dispatch correctly. Real content deferred to S07.

## Requirements Validated

- none — R101 dispatch is proven but surface content is still stubs; validation requires S04-S07 completion

## New Requirements Surfaced

- none

## Requirements Invalidated or Re-scoped

- none

## Deviations

- `GSD_HELP_TEXT` exported (plan said `const`) so downstream UI rendering can reference it — cleaner single-source-of-truth.
- Test file grew to ~689 lines (plan estimated 500-550) due to the comprehensive contract wiring test block.
- Fixed pre-existing parity drift: `/provider` was upstream's 21st built-in but test expected 20. Added to `EXPECTED_BUILTIN_OUTCOMES` and `DEFERRED_BROWSER_REJECTS`.

## Known Limitations

- All 20 GSD surfaces render placeholder content ("Coming in a future update"). Real content requires S04 (forensics/doctor/skill-health), S05 (knowledge/captures), S06 (settings), S07 (remaining commands).
- The generic `{ kind: "gsd" }` target carries surface/subcommand/args but no surface-specific typed payloads. S04-S07 will refine target shapes as needed.
- Bridge passthrough commands (auto, stop, pause, next, skip, discuss, run-hook, migrate, remote) execute via the existing RPC bridge — their behavior depends on bridge session state.

## Follow-ups

- S04-S07 must replace placeholder rendering with real content for each surface
- S04-S07 may refine `CommandSurfaceTarget` from generic `{ kind: "gsd" }` to discriminated per-surface subtypes if needed
- `/provider` builtin was added to deferred rejects — S07 or S08 should decide if it gets a browser surface

## Files Created/Modified

- `web/lib/browser-slash-command-dispatch.ts` — expanded union (20 new members), GSD dispatch maps/set/help/function, wired into main dispatch (~179 → ~300 lines)
- `web/lib/command-surface-contract.ts` — 20 section variants, 1 target variant, 20 switch cases, gsd-* guard in target builder
- `web/lib/gsd-workspace-store.tsx` — IMPLEMENTED set expanded to 32, GSD_HELP_TEXT imported, gsd_help action wired
- `web/components/gsd/command-surface.tsx` — generic GSD placeholder rendering with data-testid
- `src/tests/web-command-parity-contract.test.ts` — expanded from ~330 to ~689 lines with 4 new test blocks (80+ subtests)

## Forward Intelligence

### What the next slice should know
- The 20 GSD surfaces are stubs with a generic `{ kind: "gsd", surface, subcommand, args }` target. To build real content, replace the `gsd-*` placeholder case in `command-surface.tsx`'s `renderSection()` with a surface-specific component, and optionally refine the target in `buildCommandSurfaceTarget()`.
- `IMPLEMENTED_BROWSER_COMMAND_SURFACES` already includes all 20 surfaces, so the Sheet opens immediately — no store changes needed to "enable" a surface.
- The dispatch function passes sub-args through (`/gsd forensics detailed` → `args: "detailed"`), so surfaces can use args for filtering/options.

### What's fragile
- `EXPECTED_GSD_OUTCOMES` in the parity test is hardcoded (30 entries). If upstream adds a new `/gsd` subcommand, the exhaustive test will fail until the new command is classified. This is intentional — it catches drift — but means new upstream commands require a test update.
- The `startsWith("gsd-")` guard in `buildCommandSurfaceTarget()` and `renderSection()` means any future surface name starting with "gsd-" will be caught by the generic handler. Non-GSD surfaces should avoid this prefix.

### Authoritative diagnostics
- `npx tsx --test src/tests/web-command-parity-contract.test.ts` — 118 tests, immediate named-subtest failure on any dispatch regression
- `EXPECTED_GSD_OUTCOMES` map in the test file is the single source of truth for every subcommand's expected browser behavior
- Runtime: `dispatchBrowserSlashCommand("/gsd <subcmd>")` returns inspectable `.kind`, `.surface`, `.action` fields

### What assumptions changed
- Upstream has 21 built-in slash commands (not 20) — `/provider` was added. The parity test and KNOWLEDGE.md are now updated to reflect this.
- The test file is larger than planned (~689 vs ~550 lines) because the contract wiring test comprehensively validates the full dispatch→open→state pipeline for all 20 surfaces, not just dispatch outcomes.
