# Project

## What This Is

GSD (Get Shit Done) is a coding agent harness built as a pi extension. It manages structured planning and execution workflows — milestones, slices, tasks — with automated git branching, LLM-driven execution, and mechanical verification.

This project is the GSD extension itself (`gsd-pi`), a TypeScript package that provides the `/gsd` command, auto-mode orchestration, worktree management, and all planning/execution infrastructure.

## Core Value

Deterministic, reliable git operations that keep main clean and working while agents do the coding. The user never touches git — the system handles branching, committing, merging, and recovery.

## Current State

GSD is a working, shipped product (v2.3.11). Branch-per-slice workflow works. Squash merge to trunk works. Worktree support works. The git strategy is architecturally sound but has a trust boundary problem: git operations are split between deterministic TypeScript code and probabilistic LLM prompts that run raw `git add -A && git commit`. This causes accidental commits of runtime files, hardcoded commit types, no pre-merge verification, and no recovery mechanism.

## Architecture / Key Patterns

- TypeScript, compiled with `tsc`, tested with Node's built-in test runner
- Extension entry: `src/resources/extensions/gsd/index.ts`
- Orchestrator: `auto.ts` (2600+ lines) — dispatches units, manages lifecycle
- Git operations: `worktree.ts` (slice branches), `worktree-manager.ts` (git worktrees), `worktree-command.ts` (CLI commands)
- Prompts: `prompts/*.md` — Handlebars-templated instructions for LLM units
- Preferences: `preferences.ts` — YAML frontmatter in markdown files
- Patterns: `execSync` for git, `runGit()` helper, `SKIP_PATHS` for diff filtering

## Capability Contract

See `.gsd/REQUIREMENTS.md` for the explicit capability contract, requirement status, and coverage mapping.

## Milestone Sequence

- [ ] M001: Deterministic GitService — Centralize all git mechanics into a single service, fix bugs, remove git from prompts, add merge guards and recovery
