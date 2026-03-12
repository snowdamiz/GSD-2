# M001: Deterministic GitService — Context

**Gathered:** 2026-03-12
**Status:** Ready for planning

## Project Description

GSD's git workflow is architecturally sound (trunk-based, branch-per-slice, squash-merge) but has a critical trust boundary problem: git operations are split between deterministic TypeScript code and probabilistic LLM prompts that run raw `git add -A && git commit`. This causes accidental commits of runtime files, hardcoded commit types, no pre-merge verification, and no recovery mechanism.

The fix is a centralized `GitService` that owns all git mechanics while the LLM focuses on writing code.

## Why This Milestone

GSD is already shipping (v2.3.11) and the git strategy mostly works. But the trust boundary problem creates real bugs: runtime files get committed, all commits are labeled `feat`, there's no safety net before merging to main, and docs claim behaviors the code doesn't implement. Fixing this now prevents these issues from compounding as more users adopt GSD.

## User-Visible Outcome

### When this milestone is complete, the user can:

- Run a full GSD auto-mode cycle where all git operations are handled by deterministic code (no LLM-driven git commands)
- See correctly typed commit messages in git log (fix, refactor, docs — not always feat)
- Trust that broken code won't land on main (merge guards auto-detect and run tests)
- Recover from bad merges via hidden snapshot refs
- Optionally enable auto-push to remote via preferences

### Entry point / environment

- Entry point: `/gsd auto` CLI command
- Environment: local dev (Node.js, git CLI)
- Live dependencies involved: git CLI, optional remote (origin)

## Completion Class

- Contract complete means: `npm run build` passes, `npm run test` passes (existing + new GitService tests), no raw git commands in prompts
- Integration complete means: A full GSD slice lifecycle (branch → execute → commit → merge) routes through GitService
- Operational complete means: none — this is internal infrastructure, not a service

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- `npm run build` and `npm run test` pass
- A slice lifecycle in auto-mode produces commits via GitService (correct types, no accidental runtime file commits)
- Prompts contain no raw git commands (except worktree-merge.md)
- Git preferences are recognized and applied (auto_push, merge guards)
- Existing worktree commands still work (create/merge/remove)

## Risks and Unknowns

- **Wiring facade without breaking callers** — worktree.ts is imported by auto.ts, state.ts, worktree-command.ts, workspace-index.ts. The thin facade must preserve all export signatures exactly.
- **auto.ts complexity** — 2600+ lines. Wiring changes need surgical precision to avoid regressions in the orchestrator.
- **Smart staging edge cases** — Exclusion filter might miss patterns or filter too aggressively. Fallback to `git add -A` is the safety net.
- **Test infrastructure compatibility** — Existing worktree tests use temp repos. GitService tests must follow the same pattern without conflicts.

## Existing Codebase / Prior Art

- `src/resources/extensions/gsd/worktree.ts` — Current slice branch lifecycle (290 lines). Will become thin facade.
- `src/resources/extensions/gsd/worktree-manager.ts` — Git worktree lifecycle (392 lines). Has `mergeWorktreeToMain()` deterministic helper that should be used by default.
- `src/resources/extensions/gsd/worktree-command.ts` — CLI commands (803 lines). Has bugs #1 and #2.
- `src/resources/extensions/gsd/auto.ts` — Orchestrator (2652 lines). Primary consumer of git operations.
- `src/resources/extensions/gsd/preferences.ts` — Preferences system (616 lines). Will get `git?: GitPreferences`.
- `src/resources/extensions/gsd/gitignore.ts` — Has `BASELINE_PATTERNS` — same set the smart staging exclusion filter should use.
- `src/resources/extensions/gsd/tests/worktree.test.ts` — Existing tests using temp git repos. Pattern to follow for GitService tests.
- `src/resources/extensions/gsd/tests/worktree-integration.test.ts` — Integration tests for worktree lifecycle.

> See `.gsd/DECISIONS.md` for all architectural and pattern decisions — it is an append-only register; read it during planning, append to it during execution.

## Relevant Requirements

- R001–R018 — All active requirements are owned by this milestone's slices
- See `.gsd/REQUIREMENTS.md` for full details

## Scope

### In Scope

- New `git-service.ts` with all git mechanics
- Smart staging (exclusion filter)
- Commit type inference
- Git preferences schema
- Wiring auto.ts and worktree.ts to GitService
- Bug fixes (#1 worktree create ordering, #2 merge dispatch, #4 hardcoded feat, #5 stale branch base)
- Doc fixes (README.md, GSD-WORKFLOW.md)
- Prompt cleanup (remove raw git commands)
- Pre-merge verification (merge guards)
- Hidden snapshot refs
- Optional auto-push
- Rich squash commit messages
- Archive design input files
- Unit tests for GitService

### Out of Scope / Non-Goals

- PR creation workflow (R019 — deferred)
- Milestone tags (R020 — deferred)
- Full file ownership tracking (R021 — deferred)
- Git Notes, shadow worktrees, AI rebases, stacked branches, CI/CD, commit signing (R022–R027 — out of scope)

## Technical Constraints

- Must preserve all existing exports from worktree.ts (thin facade pattern)
- Must use existing `runGit()` pattern (execSync-based)
- Must use existing test infrastructure (Node built-in test runner, temp git repos)
- Preferences must follow existing YAML-in-markdown frontmatter format
- `git status --porcelain` for idle detection in auto.ts may remain inline (not part of GitService)

## Integration Points

- `auto.ts` — Primary consumer. Calls ensureSliceBranch, autoCommit, switchToMain, mergeSliceToMain.
- `worktree-command.ts` — Calls autoCommitCurrentBranch, createWorktree. Has bugs to fix.
- `worktree-manager.ts` — Has mergeWorktreeToMain() that GitService should delegate to or replace.
- `state.ts` — Imports getActiveSliceBranch from worktree.ts.
- `workspace-index.ts` — Imports getSliceBranchName, detectWorktreeName from worktree.ts.
- `preferences.ts` — Will gain git?: GitPreferences field.
- `gitignore.ts` — BASELINE_PATTERNS should be shared with smart staging exclusion filter.

## Open Questions

- None — all decisions resolved during discussion.

## Per-Slice Reading Guide

| Slice | Read before starting |
|---|---|
| S01 | `worktree.ts`, `worktree-manager.ts`, `gitignore.ts` (for SKIP_PATHS/BASELINE_PATTERNS) |
| S02 | S01 summary, `auto.ts` (lines 55-75, 350-380, 470-510, 980-1020, 2220-2230), `preferences.ts` |
| S03 | S02 summary, `worktree-command.ts` (lines 340-370, 660-710), `README.md` (lines 250-270), `GSD-WORKFLOW.md` (lines 540-590) |
| S04 | S02 summary, all prompt files in `prompts/` |
| S05 | S02 summary, `git-service.ts` (from S01), `preferences.ts` (from S02) |
| S06 | All prior summaries, root-level synthesis/audit files |
