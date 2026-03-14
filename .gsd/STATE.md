# GSD State

**Active Milestone:** M001 — Web mode foundation
**Active Slice:** S01 — Web host + agent bridge
**Active Task:** Planning — slice decomposition not written yet
**Phase:** Planning

## Recent Decisions
- `gsd --web` is the browser-only launch path for the current project and must not open the TUI.
- Preserve the exact existing skin now housed in `web/` and wire it into live GSD data/actions.
- Required credentials are blocking for first use and must be validated in-browser.
- Mid-run prompts use a focused panel instead of buried modals.
- Keep the Next.js skin for M001 unless the live bridge proves it is just overhead.

## Blockers
- None

## Next Action
Decompose `M001/S01` into a slice plan: define the web host/runtime, `gsd --web` CLI behavior, current-project workspace boot contract, and the live bridge between the browser workspace and the GSD RPC session.
