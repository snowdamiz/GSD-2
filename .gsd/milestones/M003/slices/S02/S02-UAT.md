# S02: Browser slash-command dispatch for all upstream commands — UAT

**Milestone:** M003
**Written:** 2026-03-16

## UAT Type

- UAT mode: artifact-driven
- Why this mode is sufficient: Dispatch is pure-function logic with no runtime side effects. The parity contract test (118 tests) exercises every subcommand path. Build verification confirms type safety. No live browser runtime needed.

## Preconditions

- Repository checked out at the S02 completion commit
- `npm install` completed (dependencies resolved)
- No stale `dist/` artifacts (run `rm -rf packages/*/dist/` if builds fail unexpectedly)

## Smoke Test

Run `npx tsx --test src/tests/web-command-parity-contract.test.ts` — should report 118 tests pass, 0 fail.

## Test Cases

### 1. All GSD subcommands dispatch to defined outcomes

1. Run `npx tsx --test src/tests/web-command-parity-contract.test.ts`
2. Look for the "every GSD subcommand dispatches to its expected outcome" test block
3. **Expected:** All 30 subcommands (20 surface, 9 passthrough, 1 local) pass with correct kind/surface/action

### 2. Surface commands produce correct surface names

1. Run:
   ```
   npx tsx -e "import { dispatchBrowserSlashCommand } from './web/lib/browser-slash-command-dispatch.ts'; for (const cmd of ['forensics','doctor','skill-health','knowledge','capture','triage','status','visualize','prefs','mode','steer','hooks','config','inspect','export','cleanup','quick','history','undo','queue']) { const r = dispatchBrowserSlashCommand('/gsd ' + cmd); console.log(cmd, r.kind, r.surface); }"
   ```
2. **Expected:** Each prints `surface gsd-<name>` (e.g., `forensics surface gsd-forensics`)

### 3. Passthrough commands preserve input text

1. Run:
   ```
   npx tsx -e "import { dispatchBrowserSlashCommand } from './web/lib/browser-slash-command-dispatch.ts'; for (const cmd of ['auto','stop','pause','next','skip','discuss','run-hook','migrate','remote']) { const r = dispatchBrowserSlashCommand('/gsd ' + cmd); console.log(cmd, r.kind, r.text?.includes(cmd)); }"
   ```
2. **Expected:** Each prints `<cmd> prompt true` — passthrough with original text preserved

### 4. /gsd help renders inline help action

1. Run:
   ```
   npx tsx -e "import { dispatchBrowserSlashCommand } from './web/lib/browser-slash-command-dispatch.ts'; const r = dispatchBrowserSlashCommand('/gsd help'); console.log(r.kind, r.action);"
   ```
2. **Expected:** Prints `local gsd_help`

### 5. Bare /gsd passes through as /gsd next

1. Run:
   ```
   npx tsx -e "import { dispatchBrowserSlashCommand } from './web/lib/browser-slash-command-dispatch.ts'; const r = dispatchBrowserSlashCommand('/gsd'); console.log(r.kind, r.text);"
   ```
2. **Expected:** Prints `prompt /gsd next`

### 6. /export vs /gsd export disambiguation

1. Run:
   ```
   npx tsx -e "import { dispatchBrowserSlashCommand } from './web/lib/browser-slash-command-dispatch.ts'; const e1 = dispatchBrowserSlashCommand('/export'); const e2 = dispatchBrowserSlashCommand('/gsd export'); console.log('/export:', e1.kind, e1.surface); console.log('/gsd export:', e2.kind, e2.surface);"
   ```
2. **Expected:** `/export: surface export` and `/gsd export: surface gsd-export` — built-in and GSD export are distinct

### 7. Unknown subcommand passes through without swallowing

1. Run:
   ```
   npx tsx -e "import { dispatchBrowserSlashCommand } from './web/lib/browser-slash-command-dispatch.ts'; const r = dispatchBrowserSlashCommand('/gsd xyznotreal'); console.log(r.kind, r.slashCommandName, r.text);"
   ```
2. **Expected:** `prompt gsd /gsd xyznotreal` — kind is prompt, slash command name is "gsd", full input preserved

### 8. Terminal notices work correctly

1. Run:
   ```
   npx tsx -e "import { dispatchBrowserSlashCommand, getBrowserSlashCommandTerminalNotice } from './web/lib/browser-slash-command-dispatch.ts'; const surface = dispatchBrowserSlashCommand('/gsd forensics'); const passthru = dispatchBrowserSlashCommand('/gsd auto'); console.log('surface notice:', getBrowserSlashCommandTerminalNotice(surface)?.type); console.log('passthru notice:', getBrowserSlashCommandTerminalNotice(passthru));"
   ```
2. **Expected:** `surface notice: system` and `passthru notice: null`

### 9. Contract surface wiring end-to-end

1. Run:
   ```
   npx tsx -e "import { commandSurfaceSectionForRequest, buildCommandSurfaceTarget } from './web/lib/command-surface-contract.ts'; const section = commandSurfaceSectionForRequest({ surface: 'gsd-forensics', source: 'slash' }); const target = buildCommandSurfaceTarget({ surface: 'gsd-forensics', source: 'slash', args: 'detailed' }); console.log('section:', section); console.log('target:', JSON.stringify(target));"
   ```
2. **Expected:** `section: gsd-forensics` and target with `kind: "gsd"`, `surface: "gsd-forensics"`, `subcommand: "forensics"`, `args: "detailed"`

### 10. IMPLEMENTED_BROWSER_COMMAND_SURFACES includes all GSD surfaces

1. Run:
   ```
   npx tsx -e "import { IMPLEMENTED_BROWSER_COMMAND_SURFACES } from './web/lib/gsd-workspace-store.tsx'; const gsd = [...IMPLEMENTED_BROWSER_COMMAND_SURFACES].filter(s => s.startsWith('gsd-')); console.log('count:', gsd.length); console.log('surfaces:', gsd.sort().join(', '));"
   ```
2. **Expected:** `count: 20` and all 20 gsd-prefixed surface names listed

### 11. TypeScript compilation succeeds

1. Run `npm run build`
2. **Expected:** Exit 0, no type errors

### 12. Next.js production build succeeds

1. Run `npm run build:web-host`
2. **Expected:** Exit 0, standalone host staged at `dist/web/standalone`

## Edge Cases

### Sub-args are preserved through dispatch

1. Run:
   ```
   npx tsx -e "import { dispatchBrowserSlashCommand } from './web/lib/browser-slash-command-dispatch.ts'; const r = dispatchBrowserSlashCommand('/gsd forensics detailed --verbose'); console.log(r.kind, r.surface, r.args);"
   ```
2. **Expected:** `surface gsd-forensics detailed --verbose` — args after the subcommand are passed through

### GSD command with extra whitespace

1. Run:
   ```
   npx tsx -e "import { dispatchBrowserSlashCommand } from './web/lib/browser-slash-command-dispatch.ts'; const r = dispatchBrowserSlashCommand('/gsd  forensics'); console.log(r.kind, r.surface || r.text);"
   ```
2. **Expected:** The command still dispatches correctly (surface or passthrough, depending on whitespace handling)

### Builtin parity count matches upstream

1. In the parity test output, check the "registered built-in slash commands all have defined browser outcomes" test
2. **Expected:** Size assertion matches upstream's 21 built-in commands

## Failure Signals

- Any parity test failure indicates a subcommand falls through silently or dispatches to the wrong outcome
- `npm run build` failure indicates type misalignment between dispatch types, contract types, or store types
- `npm run build:web-host` failure indicates component stubs don't render or import incorrectly
- `commandSurfaceSectionForRequest()` returning null for a GSD surface means the section routing is broken
- `IMPLEMENTED_BROWSER_COMMAND_SURFACES` missing a surface means the Sheet won't open for that command

## Requirements Proved By This UAT

- **R101** — Every `/gsd` subcommand dispatches correctly (test cases 1-8 prove this exhaustively)
- **R103, R104, R105** — Forensics, doctor, skill-health dispatch to surfaces (test case 2)
- **R106** — Knowledge, capture, triage dispatch to surfaces (test case 2)
- **R107** — Prefs, mode dispatch to surfaces (test case 2)
- **R108** — All remaining subcommands dispatch to surfaces (test case 2)

## Not Proven By This UAT

- Real surface content behind stubs (requires S04-S07)
- Live browser rendering of GSD surfaces (requires running web host and browser interaction)
- Bridge passthrough command execution (requires active bridge session)
- API routes backing data-heavy surfaces (requires S03-S07)

## Notes for Tester

- The placeholder components render "Coming in a future update" — this is correct for S02. Real content arrives in S04-S07.
- The parity test is the most comprehensive single check. If it passes (118/118), the dispatch contract is proven.
- The `/provider` built-in was added to deferred rejects as part of this slice — it's a pre-existing upstream addition, not a regression.
