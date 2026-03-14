---
id: S07
milestone: M001
status: ready
---

# S07: End-to-end web assembly proof — Context

## Goal

Deliver a fully assembled `gsd --web` experience with no placeholder UI anywhere in the core workspace path, with the integrated browser mode proven by connected code and tests and ready for final manual user validation.

## Why this Slice

This is the milestone-closing assembly slice. It proves that the prior slices do not merely work in isolation but are actually connected into one truthful browser-first product path, and it establishes whether M001 can be considered real rather than a collection of partial integrations.

## Scope

### In Scope

- Final assembly of the web host, onboarding, bridge, live interaction, state surfaces, workflow controls, and continuity/failure behavior into one connected `gsd --web` path.
- Removing placeholder or mock UI from the core browser workspace so the integrated result is fully wired to real GSD behavior and project/session state.
- Integrated proof that everything is connected and works as one system, not just as isolated slice-level pieces.
- Test coverage that proves the integrated browser mode works through real code paths rather than relying on placeholder seams.
- Final end-to-end verification focus on the assembled product path rather than adding new UX patterns.
- A happy-path result that feels pristine, with no visible degraded or recoverable-state noise during the normal demo path.

### Out of Scope

- Leaving any intentional placeholder UI in the core workspace and calling the milestone complete anyway.
- Treating S07 as a light smoke check that mostly inherits proof from prior slices without proving the assembled system is real.
- Accepting a visibly rough happy path where reconnect/failure states intrude during normal use.
- Redesigning the existing skin instead of proving the assembled system through it.
- Requiring the user to use the TUI anywhere in the final browser-first flow.

## Constraints

- Respect D002: preserve the exact existing `web/` skin as the M001 UI contract.
- The final assembled workspace should have no placeholder UI in the core surfaces covered by M001.
- The integrated proof should be backed by code/tests that prove the real wiring works.
- The user intends to do the final manual testing personally after the slice is assembled; S07 should leave the product ready for that validation.
- The normal happy-path experience should be strictly pristine — visible degraded/recovery states during the happy path are not acceptable.
- `gsd --web` must remain browser-first and must not open or require the TUI.

## Integration Points

### Consumes

- `S01-S06 assembled outputs` — the live host, onboarding gate, RPC bridge, prompt handling, real state surfaces, workflow controls, and continuity/failure behaviors that must now function as one system.
- `gsd --web` launch path — the packaged/source host bootstrap and browser opener that start the integrated runtime.
- Existing `web/` skin — the unchanged browser shell through which the final integrated proof is exercised.
- Integrated tests and contract checks from prior slices — the base verification surface that now needs final assembled proof.

### Produces

- A fully connected `gsd --web` browser-first path with no placeholder UI in the core M001 workspace.
- Final integrated proof that the assembled web mode works as one real system.
- End-to-end test coverage focused on proving the assembled product wiring rather than isolated contracts only.
- A release-ready M001 browser path prepared for final manual user validation.

## Open Questions

- How much of the final integrated proof must come from live browser-driven verification versus code-level tests to satisfy the milestone wording? — Current thinking: the user wants connected code/tests to prove it works, with manual browser validation performed personally afterward.
- What exact threshold defines "no placeholder UI" for secondary or edge surfaces adjacent to the core M001 path? — Current thinking: any core workspace surface involved in launch, onboarding, interaction, state, resume, or continuity should be fully real before the milestone is considered done.
- If a rare recovery state is implemented correctly but appears briefly on the nominal happy path, is that an automatic fail for S07? — Current thinking: yes, because the expected happy-path demo should feel pristine.
