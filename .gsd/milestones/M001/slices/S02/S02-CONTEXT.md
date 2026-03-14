---
id: S02
milestone: M001
status: ready
---

# S02: First-run setup wizard — Context

## Goal

Deliver a browser-first first-run setup flow that blocks workspace use until the same setup GSD truly requires today has been completed and validated, while keeping optional setup skippable.

## Why this Slice

This slice retires one of the milestone's biggest product risks early: whether first-run setup can happen entirely in-browser without feeling worse than the current terminal onboarding. It also establishes the onboarding gate and validated-credential state that S03 depends on for live browser interaction without TUI fallback.

## Scope

### In Scope

- A dedicated first-run setup experience before the normal workspace becomes usable.
- Preserving current GSD onboarding parity for what is required versus optional: require what the existing product actually needs to become operational, and keep the rest optional/skippable.
- Required credential testing before unlock, with clear pass/fail feedback.
- Inline recovery on failed setup steps, including immediate retry and change-provider paths on the same step.
- Browser handling for the current first-run setup categories that matter to onboarding parity, with LLM setup as the required path and optional setup remaining optional.
- A completion state that keeps the workspace gated until required setup has passed.

### Out of Scope

- Requiring optional integrations such as web search, remote questions, or tool keys just to enter the workspace.
- Soft-unlocking the workspace when required setup is still invalid or incomplete.
- Redesigning the existing `web/` skin beyond what is needed to present the dedicated setup flow.
- Settling framework/host architecture questions that belong to S01 or later slices.
- Long-tail post-onboarding account-management UX beyond what first-run setup needs.

## Constraints

- Respect D002: use the exact existing `web/` skin as the M001 UI contract.
- Respect D003: required credentials must be entered and validated before the workspace is usable.
- The setup should feel like a dedicated wizard, not just the live workspace with passive warnings.
- Recovery should bias toward inline retry/change-provider behavior rather than end-of-flow repair or terminal fallback.
- "Parity with the existing flow" should preserve today’s required-versus-optional split, but not reintroduce the old terminal wizard’s fully skippable unlock behavior where it conflicts with D003.
- Keep the experience snappy; setup friction should come from genuinely required validation, not extra ceremony.

## Integration Points

### Consumes

- `S01 web boot payload` — determines current-project onboarding status and whether the workspace must stay gated.
- `S01 bridge/API contract` — submits setup actions, runs validation, and persists completion state from the browser.
- `src/onboarding.ts` — existing onboarding categories and current required/optional behavior to mirror in browser UX.
- Credential/auth storage and provider login/validation flows — save secrets safely and verify required access before unlock.

### Produces

- Browser-first onboarding gate behavior for the workspace.
- A dedicated first-run setup flow with required-step validation and inline recovery.
- A browser-visible credential validation results surface for required setup.
- Onboarding completion state and validated credentials that downstream slices can rely on.

## Open Questions

- Should the browser wizard preserve the current terminal onboarding step order exactly, or only preserve its required/optional behavior while allowing a better browser-native sequence? — Current thinking: preserve required/optional parity, but allow sequence changes if they make the browser flow clearer.
- When stored credentials already satisfy the required setup, should the browser skip the wizard entirely or show a quick review state first? — Current thinking: skip straight to the workspace for speed, with optional setup available elsewhere.
- For API-key-based providers that currently get only lightweight checks in the terminal flow, what counts as "validated" strongly enough to unlock the browser workspace? — Current thinking: required setup should unlock only after a real success signal, but planning needs to define which providers can be tested reliably without adding fragile startup latency.
