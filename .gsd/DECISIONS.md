# Decisions Register

<!-- Append-only. Never edit or remove existing rows.
     To reverse a decision, add a new row that supersedes it.
     Read this file at the start of any planning or research phase. -->

| # | When | Scope | Decision | Choice | Rationale | Revisable? |
|---|------|-------|----------|--------|-----------|------------|
| D001 | M001 | scope | Web launch entrypoint | `gsd --web` opens browser mode for the current cwd and does not launch the TUI | The user explicitly wants a browser-first flow without TUI fallback | No |
| D002 | M001 | pattern | UI contract for M001 | Preserve the exact existing skin now housed in `web/` and wire it into live GSD data/actions instead of redesigning it | Keeps scope on integration and preserves the intended experience | Yes — after parity exists |
| D003 | M001 | launchability | First-run gating | Required credentials must be entered and validated before the web workspace is usable; optional ones remain skippable | Ensures the browser path is operationally usable on first launch | No |
| D004 | M001 | pattern | Mid-run user prompts in web mode | Use a focused panel/surface for confirmations, choices, text input, and editor-style interruptions instead of burying them in modals | Matches the preferred interruption model and keeps the live workflow visible | Yes — if live testing shows a better interaction pattern |
| D005 | M001 | arch | Framework migration timing | Keep the existing Next.js skin for M001 and revisit a React-only host only after the live bridge proves whether a Next server is earning its weight | Avoids churn before the real integration exposes actual runtime needs | Yes — if the integrated web mode shows Next is just overhead |
