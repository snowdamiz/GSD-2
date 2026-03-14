# Project

## What This Is

GSD is a Node/TypeScript CLI coding agent that currently launches a Pi/GSD TUI. This project adds a browser-first web mode for upstream GSD using the in-repo web skin at `web/`, turning that skin into a real current-project workspace driven by live GSD state and agent execution.

## Core Value

A user can run `gsd --web`, complete setup, and do the full GSD workflow in a snappy browser workspace without ever touching the TUI.

## Current State

- Core GSD CLI, TUI, onboarding, and RPC mode already exist in this repo.
- `src/cli.ts` now has a real `--web` launch path that starts browser mode for the current cwd without opening the TUI.
- `src/web/bridge-service.ts` plus `web/app/api/boot|session/command|session/events` now expose a live same-origin browser bridge backed by real GSD session state.
- `web/` is still the preserved Next.js skin, but the launch-critical shell surfaces now hydrate from live boot/SSE state instead of startup mocks.
- S01 is complete; S02 (first-run setup wizard) is next.

## Architecture / Key Patterns

- Node/TypeScript CLI entry in `src/cli.ts`
- Pi coding agent session creation and run modes in `packages/pi-coding-agent`
- Existing RPC transport and extension UI request/response surface
- Existing onboarding/auth flows in `src/onboarding.ts`
- Planned web mode should stay current-project scoped and browser-first
- M001 preserves the existing skin and integrates it before reconsidering framework/runtime changes

## Capability Contract

See `.gsd/REQUIREMENTS.md` for the explicit capability contract, requirement status, and coverage mapping.

## Milestone Sequence

- [ ] M001: Web mode foundation — Launch `gsd --web`, onboard in-browser, connect the skin to a live current-project GSD session, and prove the end-to-end browser workflow.
- [ ] M002: Web parity and hardening — Close remaining TUI parity gaps, harden continuity/recovery/observability, and prepare the browser-first flow for upstream merge.
