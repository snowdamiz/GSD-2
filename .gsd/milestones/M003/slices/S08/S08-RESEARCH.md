# S08 — Research

**Date:** 2026-03-16
**Status:** Complete

## Summary

S08 is a systematic audit comparing every TUI feature against its web equivalent, then closing any gaps found. The exploration shows the web surfaces are comprehensive — all 30 `/gsd` subcommands are dispatched (20 surface, 9 passthrough, 1 inline help), all 20 surface commands render real panel components backed by API routes, and the visualizer has its own dedicated view. The codebase is audit-ready.

The gaps found fall into three categories: (1) **test assertion mismatch** — 4 pre-existing failures where `/gsd visualize` dispatches as `view-navigate` but tests expect `surface`; (2) **TUI-web semantic mismatches** — `gsd-config` maps to BudgetPanel but TUI `config` is a tool API key wizard, `capture` with args is a write-then-show operation in TUI but only opens the viewer in web, `knowledge` with args writes a new entry in TUI but web only views; (3) **missing TUI behaviors** — doctor `heal`/`audit` modes not exposed in web panel, skill-health `--declining`/`--stale`/detail views not available, prefs wizard (interactive edit flow) absent. None of these are structural — they're feature-depth gaps that can be documented and selectively closed.

## Recommendation

Execute the audit as a two-task slice: T01 produces the parity audit document (comprehensive feature matrix), T02 fixes the test assertion mismatch and documents intentional scope exclusions. The semantic mismatches and missing interactive flows (prefs wizard, doctor heal, capture-with-args write) should be documented as known scope boundaries rather than bugs — the web surfaces intentionally show data and provide controls where feasible, while interactive TUI wizards that require the agent runtime are correctly classified as bridge-passthrough operations. The only concrete code fix needed is updating the 4 test assertions for `/gsd visualize` dispatch.

## Implementation Landscape

### Key Files

**Audit inputs — TUI side:**
- `src/resources/extensions/gsd/commands.ts` (1910 lines) — the authoritative TUI command handler; `registerGSDCommand` at line 84 lists all 30 subcommands; each `handleX` function defines the TUI behavior to compare against
- `src/resources/extensions/gsd/dashboard-overlay.ts` (560 lines) — TUI dashboard overlay with progress bars, pending captures badge, worktree name display, cost summary
- `src/resources/extensions/gsd/visualizer-overlay.ts` + `visualizer-views.ts` (1099 lines) — TUI visualizer with 7 views matching the web's 7 tabs

**Audit inputs — Web side:**
- `web/lib/browser-slash-command-dispatch.ts` (397 lines) — dispatch routing for all commands; `GSD_SURFACE_SUBCOMMANDS` (20), `GSD_PASSTHROUGH_SUBCOMMANDS` (9), inline help (1)
- `web/components/gsd/command-surface.tsx` (2222 lines) — orchestrator rendering all panel components via switch at lines 2018-2042
- `web/components/gsd/remaining-command-panels.tsx` (1265 lines) — QuickPanel, HistoryPanel, UndoPanel, SteerPanel, HooksPanel, InspectPanel, ExportPanel, CleanupPanel, QueuePanel, StatusPanel
- `web/components/gsd/diagnostics-panels.tsx` (525 lines) — ForensicsPanel, DoctorPanel, SkillHealthPanel
- `web/components/gsd/settings-panels.tsx` (498 lines) — PrefsPanel, ModelRoutingPanel, BudgetPanel
- `web/components/gsd/knowledge-captures-panel.tsx` (458 lines) — KnowledgeCapturesPanel with two tabs
- `web/components/gsd/visualizer-view.tsx` (1242 lines) — 7-tab visualizer as dedicated app-shell view

**Test file to fix:**
- `src/tests/web-command-parity-contract.test.ts` — 4 failures on `/gsd visualize` expecting `surface` but getting `view-navigate`

### Identified Gaps

#### Category 1: Test assertion fix (must fix)
| Gap | Detail | Fix |
|-----|--------|-----|
| `/gsd visualize` test failures | EXPECTED_GSD_OUTCOMES maps `visualize` → `surface`, but D053 intentionally dispatches it as `view-navigate` | Update EXPECTED_GSD_OUTCOMES to `"view-navigate"` and update the 2 contract tests that assert `kind === "surface"` for visualize |

#### Category 2: Semantic mismatches (document as intentional)
| TUI Command | TUI Behavior | Web Behavior | Resolution |
|-------------|-------------|--------------|------------|
| `/gsd config` | Interactive tool API key wizard (Tavily, Brave, Context7, Jina, Groq) with select+input loop | BudgetPanel showing budget/enforcement config | Document: TUI `config` is a key management wizard; web shows budget config under the "config" surface. The key management wizard requires interactive prompts not available in browser panels. |
| `/gsd capture "text"` | Writes capture to CAPTURES.md immediately, returns confirmation | Opens captures viewer (read-only triage UI) | Document: TUI capture-with-args is a write operation routed through the bridge. Web surface shows the triage viewer. The write action happens via bridge passthrough when args are present — the web surface is for viewing/triaging. |
| `/gsd knowledge rule "text"` | Writes knowledge entry to KNOWLEDGE.md immediately | Opens knowledge viewer (read-only) | Document: same pattern as capture — write ops go through bridge, web surface is for viewing. |
| `/gsd steer "change"` | Writes override to OVERRIDES.md AND dispatches agent message | Web SteerPanel has message form + sendSteer(), shows overrides | Closest to parity — web has both read and write. The TUI also dispatches a gsd-hard-steer message to the agent, which the web's sendSteer bridge call handles. |

#### Category 3: Missing TUI sub-features (document as scope boundary)
| TUI Feature | Description | Web Gap |
|-------------|-------------|---------|
| Doctor `heal` mode | Dispatches unresolved issues to LLM via `gsd-doctor-heal` message for automated fixing | Web DoctorPanel has `fix` but not `heal` (which requires active agent session) |
| Doctor `audit` mode | Extended output with `includeWarnings: true, maxIssues: 50` | Web doctor shows all issues without a separate audit toggle |
| Skill-health `--declining` flag | Filters to show only declining-performance skills | Web SkillHealthPanel shows all skills without filter controls |
| Skill-health `--stale N` flag | Adjusts staleness threshold | Web uses default threshold with no adjustment |
| Skill-health detail view | `/gsd skill-health <name>` shows per-skill detailed metrics | Web panel shows summary table only |
| Prefs wizard | Interactive multi-step preference editor with category menu | Web PrefsPanel is read-only display of effective preferences |
| Prefs `import-claude` | Import Claude settings into GSD preferences | Not available in web |
| Dashboard pending captures badge | Shows "📌 N pending captures" when captures await triage | Web dashboard doesn't show pending capture count |
| Dashboard worktree name | Shows active worktree name tag in dashboard header | Web dashboard doesn't show worktree context |

### Build Order

1. **T01: Produce the parity audit document** — Systematic feature matrix comparing every TUI command/feature against its web equivalent. Output: `S08-PARITY-AUDIT.md` in the slice directory. This is the primary deliverable — a structured document that proves the audit was done and records every gap with its disposition (fixed, intentional, or deferred).

2. **T02: Fix test assertions and close actionable gaps** — Update the 4 `/gsd visualize` test assertions in `web-command-parity-contract.test.ts` to expect `view-navigate` instead of `surface`. Verify tests pass (should go from 114/118 to 118/118). Optionally close low-effort gaps if any are identified during the audit.

### Verification Approach

- `npx tsx --test src/tests/web-command-parity-contract.test.ts` — must reach 118/118 (currently 114/118; the 4 failures are all `/gsd visualize` assertions)
- `npm run build` — must exit 0 (no regressions)
- `npm run build:web-host` — must exit 0 (no regressions)
- Parity audit document exists at `.gsd/milestones/M003/slices/S08/S08-PARITY-AUDIT.md` with complete feature matrix
- `rg "This surface will be implemented" web/components/gsd/command-surface.tsx` returns 0 matches (already confirmed in S07)

## Constraints

- The parity audit is fundamentally a document-production task with human-judgment qualities — it requires systematic enumeration, not just automated testing.
- Doctor `heal` mode requires an active LLM agent session, which the browser can only provide via bridge passthrough — this is architecturally correct, not a gap to close.
- Prefs wizard is an interactive multi-step flow using `ctx.ui.select` and `ctx.ui.input` — replicating this as a browser form is substantial new work beyond the scope of "closing gaps."
- The 4 test failures are well-understood (D053 decision) — the fix is changing test expectations, not changing dispatch behavior.
