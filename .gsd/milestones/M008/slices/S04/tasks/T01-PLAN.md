---
estimated_steps: 5
estimated_files: 3
---

# T01: Add remote questions types, child script field, and API route

**Slice:** S04 — Remote Questions Settings
**Milestone:** M008

## Description

Establishes the data contract and read/write API for remote questions configuration. Extends `SettingsPreferencesData` with a `remoteQuestions` field, adds that field to the child script in `settings-service.ts` so the existing `loadSettingsData()` flow carries it to the frontend, and creates a new `/api/remote-questions` API route with GET/POST/DELETE for direct YAML frontmatter manipulation on `~/.gsd/preferences.md`.

The API route cannot import from extension modules (`src/resources/extensions/`) due to the Turbopack `.js→.ts` resolution constraint (see KNOWLEDGE). Instead, it replicates the necessary constants (`CHANNEL_ID_PATTERNS`, `ENV_KEYS`, clamp ranges) and does direct `fs` + regex-based YAML frontmatter parsing — the same pattern used by `parsePreferencesMarkdown()` in `preferences.ts`.

## Steps

1. **Extend `SettingsPreferencesData` in `web/lib/settings-types.ts`:**
   - Add an optional `remoteQuestions` field with type: `{ channel?: "slack" | "discord" | "telegram"; channelId?: string; timeoutMinutes?: number; pollIntervalSeconds?: number }`
   - This is the browser-safe mirror of `RemoteQuestionsConfig` from `src/resources/extensions/gsd/preferences.ts` (line 141), with snake_case → camelCase

2. **Add `remoteQuestions` to the child script in `src/web/settings-service.ts`:**
   - In the preferences mapping block (after `autoVisualize: p.auto_visualize,`), add:
     ```
     remoteQuestions: p.remote_questions ? {
       channel: p.remote_questions.channel,
       channelId: String(p.remote_questions.channel_id),
       timeoutMinutes: p.remote_questions.timeout_minutes,
       pollIntervalSeconds: p.remote_questions.poll_interval_seconds,
     } : undefined,
     ```
   - Note: `channel_id` can be `string | number` upstream, so `String()` wrapping is needed

3. **Create `web/app/api/remote-questions/route.ts`:**
   - Set `export const runtime = "nodejs"` and `export const dynamic = "force-dynamic"`
   - Import `homedir` from `node:os`, `readFileSync`, `writeFileSync`, `existsSync` from `node:fs`, `join` from `node:path`
   - Define constants locally (cannot import from extensions):
     - `CHANNEL_ID_PATTERNS`: `{ slack: /^[A-Z0-9]{9,12}$/, discord: /^\d{17,20}$/, telegram: /^-?\d{5,20}$/ }`
     - `ENV_KEYS`: `{ slack: "SLACK_BOT_TOKEN", discord: "DISCORD_BOT_TOKEN", telegram: "TELEGRAM_BOT_TOKEN" }`
     - Clamp ranges: timeout 1-30 (default 5), poll 2-30 (default 5)
   - Helper: `getPreferencesPath()` → `join(homedir(), ".gsd", "preferences.md")`
   - Helper: `parseYamlFrontmatter(content: string)` → parse YAML frontmatter block using the same indexOf-based approach as `parsePreferencesMarkdown()` in preferences.ts. Use a simple YAML parser — since the frontmatter is flat enough, use Node's built-in capabilities or a regex-based key extraction. For writing, use string manipulation to add/update/remove the `remote_questions` block within the frontmatter.
   - **GET handler:** Read preferences file → parse frontmatter → extract `remote_questions` → check if env var is set (`!!process.env[ENV_KEYS[channel]]`) → return `{ config: { channel, channelId, timeoutMinutes, pollIntervalSeconds } | null, envVarSet: boolean, envVarName: string | null, status: string }`
   - **POST handler:** Parse request body → validate channel (must be slack/discord/telegram) → validate channelId against pattern → clamp timeout/poll → read current preferences → update `remote_questions` block in frontmatter → write file → return `{ success: true, config: { ... } }`
   - **DELETE handler:** Read preferences → remove `remote_questions` block from frontmatter → write file → return `{ success: true }`
   - For YAML writing: use a simple approach — if file doesn't exist, create with frontmatter. If frontmatter exists, find and replace/add the `remote_questions` block. Consider using `yaml` package if available, otherwise string manipulation with careful indentation.

4. **Check for YAML package availability:**
   - Run `rg "\"yaml\"" package.json` to see if `yaml` package is already a dependency
   - If available, use it for parse/stringify. If not, use string-based YAML manipulation (simpler, no new dep needed for this small use case)

5. **Verify types compile:**
   - Run `npx tsc --noEmit -p web/tsconfig.json` or check for errors in touched files

## Must-Haves

- [ ] `remoteQuestions` field added to `SettingsPreferencesData` type
- [ ] Child script in `settings-service.ts` passes through `remote_questions` data as `remoteQuestions`
- [ ] `GET /api/remote-questions` returns current config + env var status
- [ ] `POST /api/remote-questions` validates and saves config to YAML frontmatter
- [ ] `DELETE /api/remote-questions` removes config from YAML frontmatter
- [ ] Server-side validation: channel type, channel ID pattern, timeout/poll clamping
- [ ] Env var value never exposed — only boolean `envVarSet` returned

## Verification

- `npx tsc --noEmit -p web/tsconfig.json` passes (no errors in touched files)
- Manually test API route: `curl http://localhost:3000/api/remote-questions` returns valid JSON
- Types are consistent between `SettingsPreferencesData` and the child script output

## Inputs

- `web/lib/settings-types.ts` — existing `SettingsPreferencesData` interface to extend
- `src/web/settings-service.ts` — existing child script to add one field mapping
- `src/resources/extensions/gsd/preferences.ts` (reference only) — `RemoteQuestionsConfig` type (line 141), `parsePreferencesMarkdown()` pattern (line 486)
- `src/resources/extensions/remote-questions/config.ts` (reference only) — `CHANNEL_ID_PATTERNS` (line 23), `ENV_KEYS` (line 18), clamp constants (lines 30-37)
- `web/app/api/settings-data/route.ts` (reference only) — existing API route pattern to follow

## Expected Output

- `web/lib/settings-types.ts` — `SettingsPreferencesData` has `remoteQuestions` field
- `src/web/settings-service.ts` — child script maps `p.remote_questions` to `remoteQuestions`
- `web/app/api/remote-questions/route.ts` — new file with GET/POST/DELETE handlers
