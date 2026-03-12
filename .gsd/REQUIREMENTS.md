# Requirements

This file is the explicit capability and coverage contract for the project.

## Active

### R001 — Centralized GitService class
- Class: core-capability
- Status: active
- Description: A single `GitService` class in `git-service.ts` that owns all git mechanics — commit, branch, merge, checkout, staging
- Why it matters: Moves git operations from probabilistic LLM prompts to deterministic code. The foundational trust boundary fix.
- Source: user
- Primary owning slice: M001/S01
- Supporting slices: M001/S02
- Validation: unmapped
- Notes: Must reuse existing `runGit()` pattern from worktree.ts

### R002 — Smart staging with exclusion filter
- Class: core-capability
- Status: active
- Description: Replace `git add -A` with filtered staging that excludes known runtime paths (.gsd/runtime/, .gsd/activity/, .gsd/STATE.md, .gsd/auto.lock, .gsd/metrics.json)
- Why it matters: Prevents accidental commits of runtime/bookkeeping files that should never be tracked
- Source: user
- Primary owning slice: M001/S01
- Supporting slices: none
- Validation: unmapped
- Notes: Fallback to `git add -A` with warning if filtering fails

### R003 — Conventional commit type inference
- Class: quality-attribute
- Status: active
- Description: Infer commit type (feat/fix/refactor/docs/test/chore) from slice title keywords instead of hardcoding `feat`
- Why it matters: Accurate git history that can be filtered and parsed by conventional-commits tooling
- Source: user
- Primary owning slice: M001/S01
- Supporting slices: none
- Validation: unmapped
- Notes: Default to `feat` when no keywords match

### R004 — Git preferences schema
- Class: core-capability
- Status: active
- Description: Add `git?: GitPreferences` to GSDPreferences interface with validation, merge logic, and documentation
- Why it matters: Enables all preference-gated git features (auto_push, merge guards, etc.) via existing preferences system
- Source: user
- Primary owning slice: M001/S02
- Supporting slices: M001/S05
- Validation: unmapped
- Notes: Fields: auto_push, push_branches, remote, snapshots, pre_merge_check, commit_type

### R005 — worktree.ts thin facade delegation
- Class: core-capability
- Status: active
- Description: worktree.ts keeps existing exports but delegates internally to GitService. All existing callers continue to work without changes.
- Why it matters: Backward compatibility — existing imports from worktree.ts don't break
- Source: user
- Primary owning slice: M001/S02
- Supporting slices: none
- Validation: unmapped
- Notes: New code should import from GitService directly

### R006 — auto.ts wired to GitService
- Class: core-capability
- Status: active
- Description: Replace inline git calls in auto.ts (git init, git add -A, autoCommitCurrentBranch, ensureSliceBranch, switchToMain, mergeSliceToMain) with GitService methods
- Why it matters: The orchestrator is the primary caller of git operations — it must route through the centralized service
- Source: user
- Primary owning slice: M001/S02
- Supporting slices: none
- Validation: unmapped
- Notes: git status --porcelain for idle detection and git rev-parse --git-dir for init check may remain inline

### R007 — Bug fix: worktree create ordering
- Class: quality-attribute
- Status: active
- Description: Move autoCommitCurrentBranch() BEFORE createWorktree() in worktree-command.ts so new worktrees fork from committed state
- Why it matters: Currently new worktrees fork from pre-commit HEAD, missing the user's latest saved state
- Source: user
- Primary owning slice: M001/S03
- Supporting slices: none
- Validation: unmapped
- Notes: worktree-command.ts ~line 352-357

### R008 — Bug fix: worktree merge dispatch
- Class: quality-attribute
- Status: active
- Description: Use deterministic mergeWorktreeToMain() helper as default merge path in worktree-command.ts. Keep LLM-mediated path only for complex conflict resolution.
- Why it matters: The deterministic helper already exists but isn't used as the default — merge currently goes through LLM unnecessarily
- Source: user
- Primary owning slice: M001/S03
- Supporting slices: none
- Validation: unmapped
- Notes: worktree-command.ts ~line 672-696, worktree-manager.ts lines 375-391

### R009 — Bug fix: hardcoded feat commit type
- Class: quality-attribute
- Status: active
- Description: Replace hardcoded `feat(...)` in mergeSliceToMain with inferCommitType() from GitService
- Why it matters: Bugfix slices, docs slices, refactor slices are all mislabeled as `feat`
- Source: user
- Primary owning slice: M001/S01
- Supporting slices: M001/S02
- Validation: unmapped
- Notes: worktree.ts line 258-260

### R010 — Doc fixes: branch preservation + checkpoint claims
- Class: quality-attribute
- Status: active
- Description: Fix README.md "preserved" claim to "deleted after merge". Fix GSD-WORKFLOW.md "Branch kept" to "Branch deleted". Replace checkpoint commit documentation with snapshot ref description.
- Why it matters: Docs currently claim behaviors the code doesn't implement — erodes trust
- Source: user
- Primary owning slice: M001/S03
- Supporting slices: none
- Validation: unmapped
- Notes: README.md lines 258-264, GSD-WORKFLOW.md lines 548-585

### R011 — Remove raw git commands from prompts
- Class: core-capability
- Status: active
- Description: Replace `git add -A && git commit` instructions in execute-task.md, complete-slice.md, replan-slice.md, complete-milestone.md with "the system commits automatically" messages
- Why it matters: LLMs should not run git commands — that's the whole point of the GitService trust boundary
- Source: user
- Primary owning slice: M001/S04
- Supporting slices: none
- Validation: unmapped
- Notes: Keep worktree-merge.md as-is (conflict resolution needs LLM judgment)

### R012 — Pre-merge verification (merge guards)
- Class: core-capability
- Status: active
- Description: Auto-detect test/typecheck/build commands from package.json, Cargo.toml, Makefile, pyproject.toml. Run before squash merge. Abort on failure.
- Why it matters: Prevents broken code from landing on main
- Source: user
- Primary owning slice: M001/S05
- Supporting slices: none
- Validation: unmapped
- Notes: Configurable via git.pre_merge_check preference: "auto" (default), false (skip), or custom command

### R013 — Hidden snapshot refs for rollback
- Class: core-capability
- Status: active
- Description: Create refs/gsd/snapshots/<branch>/<timestamp> before merges and risky operations. Prunable after 7 days.
- Why it matters: Invisible recovery points without cluttering branch history with checkpoint commits
- Source: user
- Primary owning slice: M001/S05
- Supporting slices: none
- Validation: unmapped
- Notes: Invisible to normal git log. Visible via git for-each-ref refs/gsd/snapshots/

### R014 — Optional auto-push (preference-gated)
- Class: core-capability
- Status: active
- Description: When git.auto_push: true, push main to remote after slice merge. Optionally push slice branches during work.
- Why it matters: Remote backup and team visibility for senior engineers
- Source: user
- Primary owning slice: M001/S05
- Supporting slices: none
- Validation: unmapped
- Notes: Default: false. Remote name configurable via git.remote (default: "origin")

### R015 — Rich squash commit messages with task lists
- Class: quality-attribute
- Status: active
- Description: Squash merge commits include task list extracted from branch commit history and branch reference for forensics
- Why it matters: Self-documenting git history that reads like a changelog
- Source: user
- Primary owning slice: M001/S05
- Supporting slices: none
- Validation: unmapped
- Notes: Format: type(scope): title\n\nTasks:\n- T01: ...\n\nBranch: gsd/M001/S01

### R016 — Bug fix: stale branch base with remote fetch
- Class: quality-attribute
- Status: active
- Description: When a remote exists, git fetch --prune before cutting a new slice branch. Warn (don't block) if local main is behind origin.
- Why it matters: Prevents branching from stale trunk HEAD
- Source: user
- Primary owning slice: M001/S05
- Supporting slices: none
- Validation: unmapped
- Notes: Only when remote exists and auto_push is enabled or remote is configured

### R017 — GitService unit tests
- Class: quality-attribute
- Status: active
- Description: Unit tests using temp git repos for all GitService methods, following the existing worktree test patterns
- Why it matters: Mechanical verification that git operations work correctly
- Source: inferred
- Primary owning slice: M001/S01
- Supporting slices: M001/S05
- Validation: unmapped
- Notes: Same test infrastructure as worktree.test.ts

### R018 — Archive design input files
- Class: quality-attribute
- Status: active
- Description: Remove or archive CODEX-GIT-SYNTHESIS.md, CLAUDE-GIT-SYNTHESIS.md, GEMINI-GIT-SYNTHESIS.md, and ONBOARDING-PLAN.md
- Why it matters: Design input files are not permanent docs — they clutter the repo after implementation
- Source: user
- Primary owning slice: M001/S06
- Supporting slices: none
- Validation: unmapped
- Notes: Delete rather than archive — git history preserves them

## Deferred

### R019 — PR creation workflow
- Class: core-capability
- Status: deferred
- Description: Auto-create PRs via gh CLI after slice merge when git.auto_pr is enabled
- Why it matters: Team workflow integration for shared repos with protected branches
- Source: research
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: Deferred — touches GitHub API, gh CLI detection, merge queue awareness. Separate concern from core GitService.

### R020 — Milestone tags on completion
- Class: quality-attribute
- Status: deferred
- Description: Create annotated git tags on milestone completion (e.g. M001)
- Why it matters: Enables git describe, changelog generation, and clear release markers
- Source: research
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: Deferred — low value relative to core trust boundary fix

### R021 — Full file ownership tracking
- Class: core-capability
- Status: deferred
- Description: Track every file the agent creates/modifies per unit. Only stage owned files.
- Why it matters: More precise staging than exclusion filter — prevents unrelated user edits from being committed
- Source: research
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: Deferred — requires threading ownership through entire execution pipeline. Exclusion filter covers 95% of the problem.

## Out of Scope

### R022 — Git Notes for metadata
- Class: anti-feature
- Status: out-of-scope
- Description: Store task plans and verification results in git notes
- Why it matters: Prevents fragile, poorly-supported metadata mechanism from entering the codebase
- Source: research
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: Git Notes are fragile, poorly rendered by most tools, unreliable push/pull semantics

### R023 — Shadow worktrees as default model
- Class: anti-feature
- Status: out-of-scope
- Description: Make git worktrees the default execution model for all agent work
- Why it matters: Over-engineering for common single-agent case. Worktrees are already available as advanced opt-in.
- Source: research
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: Rejected from Gemini's proposal

### R024 — AI-driven rebases
- Class: anti-feature
- Status: out-of-scope
- Description: LLM-driven interactive rebase and cross-slice conflict resolution
- Why it matters: Prevents hidden magic that makes senior engineers distrust the system
- Source: research
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: Merge conflicts require deterministic resolution or human intervention

### R025 — Stacked branches
- Class: anti-feature
- Status: out-of-scope
- Description: Stacked branch/PR workflow as default execution model
- Why it matters: Over-engineering for solo/vibe coder workflows
- Source: research
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: Could be opt-in advanced mode in a future milestone

### R026 — CI/CD integration
- Class: anti-feature
- Status: out-of-scope
- Description: Deployment pipeline integration from GSD
- Why it matters: GSD manages work orchestration, not infrastructure
- Source: research
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: Merge guards handle "is it broken?" — deployment is the user's concern

### R027 — Commit signing (GPG)
- Class: anti-feature
- Status: out-of-scope
- Description: GPG commit signing for agent commits
- Why it matters: Adds friction with zero value when the agent is the committer
- Source: research
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: Could be opt-in preference in a future milestone

## Traceability

| ID | Class | Status | Primary owner | Supporting | Proof |
|---|---|---|---|---|---|
| R001 | core-capability | active | M001/S01 | M001/S02 | unmapped |
| R002 | core-capability | active | M001/S01 | none | unmapped |
| R003 | quality-attribute | active | M001/S01 | none | unmapped |
| R004 | core-capability | active | M001/S02 | M001/S05 | unmapped |
| R005 | core-capability | active | M001/S02 | none | unmapped |
| R006 | core-capability | active | M001/S02 | none | unmapped |
| R007 | quality-attribute | active | M001/S03 | none | unmapped |
| R008 | quality-attribute | active | M001/S03 | none | unmapped |
| R009 | quality-attribute | active | M001/S01 | M001/S02 | unmapped |
| R010 | quality-attribute | active | M001/S03 | none | unmapped |
| R011 | core-capability | active | M001/S04 | none | unmapped |
| R012 | core-capability | active | M001/S05 | none | unmapped |
| R013 | core-capability | active | M001/S05 | none | unmapped |
| R014 | core-capability | active | M001/S05 | none | unmapped |
| R015 | quality-attribute | active | M001/S05 | none | unmapped |
| R016 | quality-attribute | active | M001/S05 | none | unmapped |
| R017 | quality-attribute | active | M001/S01 | M001/S05 | unmapped |
| R018 | quality-attribute | active | M001/S06 | none | unmapped |
| R019 | core-capability | deferred | none | none | unmapped |
| R020 | quality-attribute | deferred | none | none | unmapped |
| R021 | core-capability | deferred | none | none | unmapped |
| R022 | anti-feature | out-of-scope | none | none | n/a |
| R023 | anti-feature | out-of-scope | none | none | n/a |
| R024 | anti-feature | out-of-scope | none | none | n/a |
| R025 | anti-feature | out-of-scope | none | none | n/a |
| R026 | anti-feature | out-of-scope | none | none | n/a |
| R027 | anti-feature | out-of-scope | none | none | n/a |

## Coverage Summary

- Active requirements: 18
- Mapped to slices: 18
- Validated: 0
- Unmapped active requirements: 0
