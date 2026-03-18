---
id: T01
parent: S04
milestone: M008
provides:
  - SettingsPreferencesData.remoteQuestions type definition
  - Child script remote_questions → remoteQuestions field mapping
  - /api/remote-questions GET/POST/DELETE route
key_files:
  - web/lib/settings-types.ts
  - src/web/settings-service.ts
  - web/app/api/remote-questions/route.ts
key_decisions:
  - Used `yaml` package (already a dependency) for YAML parse/stringify instead of regex-based string manipulation
patterns_established:
  - Standalone API route with replicated constants (cannot import from extensions due to Turbopack constraint)
  - Direct fs-based YAML frontmatter manipulation using indexOf pattern from parsePreferencesMarkdown()
observability_surfaces:
  - GET /api/remote-questions returns { config, envVarSet, envVarName, status } — inspectable via curl
  - POST returns { error } with 400 for validation failures, 500 for filesystem errors
  - DELETE idempotent — succeeds even if no config exists
duration: 20m
verification_result: passed
completed_at: 2026-03-18
blocker_discovered: false
---

# T01: Add remote questions types, child script field, and API route

**Established the data contract and CRUD API for remote questions channel configuration.**

## What Happened

1. Extended `SettingsPreferencesData` in `web/lib/settings-types.ts` with an optional `remoteQuestions` field — `{ channel?, channelId?, timeoutMinutes?, pollIntervalSeconds? }` — the camelCase mirror of the upstream `RemoteQuestionsConfig`.

2. Added `remoteQuestions` mapping to the child script in `src/web/settings-service.ts`, converting `p.remote_questions` snake_case fields to camelCase. `String()` wraps `channel_id` since it can be `string | number` upstream.

3. Created `web/app/api/remote-questions/route.ts` with GET/POST/DELETE handlers:
   - Constants replicated locally (CHANNEL_ID_PATTERNS, ENV_KEYS, clamp ranges) — cannot import from extension modules.
   - YAML frontmatter parsing uses the `yaml` package (already in dependencies) with the same indexOf-based frontmatter extraction as `parsePreferencesMarkdown()`.
   - GET returns current config + env var status (boolean only, never the value).
   - POST validates channel type, channel ID format, clamps timeout/poll, writes to YAML frontmatter.
   - DELETE removes the `remote_questions` block from frontmatter.

## Verification

- `npx tsc --noEmit -p web/tsconfig.json` — no new errors in touched files (only pre-existing TS5097 `.ts` extension errors in `settings-service.ts`)
- `npm run build:web-host` exits 0 — `/api/remote-questions` listed as dynamic route
- `curl GET /api/remote-questions` → `{ config: null, status: "not_configured" }` ✓
- `curl POST /api/remote-questions` with valid Slack config → `{ success: true, config: {...} }` ✓
- Verified `remote_questions` block appears in `~/.gsd/preferences.md` after POST ✓
- `curl POST` with invalid channel ID → 400 `{ error: "Invalid channel ID format..." }` ✓
- `curl POST` with invalid channel type → 400 `{ error: "Invalid channel type..." }` ✓
- `curl DELETE /api/remote-questions` → `{ success: true }`, block removed from file ✓
- `curl GET` after DELETE → `{ config: null, status: "not_configured" }` ✓

## Diagnostics

- `curl http://localhost:3000/api/remote-questions` — returns structured JSON with `status` field: `not_configured`, `configured`, or `invalid_channel`
- `envVarSet` boolean indicates whether the bot token env var is available (never exposes the value)
- All error responses include `{ error: "<descriptive message>" }` with appropriate HTTP status codes

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `web/lib/settings-types.ts` — added `remoteQuestions` optional field to `SettingsPreferencesData`
- `src/web/settings-service.ts` — added `remoteQuestions` field mapping in child script
- `web/app/api/remote-questions/route.ts` — new file: GET/POST/DELETE API route for remote questions config
- `.gsd/milestones/M008/slices/S04/S04-PLAN.md` — added failure-path verification step (pre-flight fix)
- `.gsd/milestones/M008/slices/S04/tasks/T01-PLAN.md` — added Observability Impact section (pre-flight fix)
