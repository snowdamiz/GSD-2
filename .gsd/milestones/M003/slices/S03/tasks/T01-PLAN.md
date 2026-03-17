---
estimated_steps: 5
estimated_files: 3
---

# T01: Create visualizer API route, service layer, and browser types

**Slice:** S03 — Workflow Visualizer Page
**Milestone:** M003

## Description

Establishes the data pipeline from upstream `loadVisualizerData()` through a Next.js API route to the browser. This is the riskiest piece: it exercises the upstream filesystem-based data loader in the web host context for the first time. The critical serialization concern is that `CriticalPathInfo.milestoneSlack` and `CriticalPathInfo.sliceSlack` are `Map<string, number>` in the upstream type — `JSON.stringify(new Map([["M001", 0]]))` produces `"{}"`, silently losing all data. The service layer must explicitly convert Maps to Records via `Object.fromEntries()`.

## Steps

1. **Create `src/web/visualizer-service.ts`** — the service layer that wraps `loadVisualizerData()`:
   - Import `resolveBridgeRuntimeConfig` from `./bridge-service.ts` to get `projectCwd` (follow the pattern in `src/web/recovery-diagnostics-service.ts`)
   - Import `loadVisualizerData` from `../resources/extensions/gsd/visualizer-data.js`
   - Create an exported async function `collectVisualizerData()` that:
     - Calls `resolveBridgeRuntimeConfig()` to get `{ projectCwd }`
     - Calls `await loadVisualizerData(projectCwd)` to get the raw `VisualizerData`
     - Converts `criticalPath.milestoneSlack` and `criticalPath.sliceSlack` from `Map<string, number>` to `Record<string, number>` using `Object.fromEntries(data.criticalPath.milestoneSlack)` and `Object.fromEntries(data.criticalPath.sliceSlack)`
     - Returns the full payload with the converted Maps
   - The return type should be the same as `VisualizerData` but with `milestoneSlack: Record<string, number>` and `sliceSlack: Record<string, number>` instead of Maps

2. **Create `web/lib/visualizer-types.ts`** — browser-safe TypeScript interfaces:
   - Mirror ALL upstream types needed by the visualizer component (do NOT import from `src/resources/extensions/gsd/`):
     - `VisualizerMilestone` — `{ id: string; title: string; status: "complete" | "active" | "pending"; dependsOn: string[]; slices: VisualizerSlice[] }`
     - `VisualizerSlice` — `{ id: string; title: string; done: boolean; active: boolean; risk: string; depends: string[]; tasks: VisualizerTask[] }`
     - `VisualizerTask` — `{ id: string; title: string; done: boolean; active: boolean }`
     - `CriticalPathInfo` — same as upstream BUT with `milestoneSlack: Record<string, number>` and `sliceSlack: Record<string, number>` (NOT `Map<string, number>`)
     - `AgentActivityInfo` — `{ currentUnit: { type: string; id: string; startedAt: number } | null; elapsed: number; completedUnits: number; totalSlices: number; completionRate: number; active: boolean; sessionCost: number; sessionTokens: number }`
     - `ChangelogEntry` — `{ milestoneId: string; sliceId: string; title: string; oneLiner: string; filesModified: { path: string; description: string }[]; completedAt: string }`
     - `ChangelogInfo` — `{ entries: ChangelogEntry[] }`
     - `TokenCounts` — `{ input: number; output: number; cacheRead: number; cacheWrite: number; total: number }`
     - `UnitMetrics` — `{ type: string; id: string; model: string; startedAt: number; finishedAt: number; tokens: TokenCounts; cost: number; toolCalls: number; assistantMessages: number; userMessages: number; contextWindowTokens?: number; truncationSections?: number; continueHereFired?: boolean; promptCharCount?: number }`
     - `PhaseAggregate` — `{ phase: string; units: number; tokens: TokenCounts; cost: number; duration: number }`
     - `SliceAggregate` — `{ sliceId: string; units: number; tokens: TokenCounts; cost: number; duration: number }`
     - `ModelAggregate` — `{ model: string; units: number; tokens: TokenCounts; cost: number; contextWindowTokens?: number }`
     - `ProjectTotals` — `{ units: number; tokens: TokenCounts; cost: number; duration: number; toolCalls: number; assistantMessages: number; userMessages: number; totalTruncationSections: number; continueHereFiredCount: number }`
     - `VisualizerData` — `{ milestones: VisualizerMilestone[]; phase: string; totals: ProjectTotals | null; byPhase: PhaseAggregate[]; bySlice: SliceAggregate[]; byModel: ModelAggregate[]; units: UnitMetrics[]; criticalPath: CriticalPathInfo; remainingSliceCount: number; agentActivity: AgentActivityInfo | null; changelog: ChangelogInfo }`
   - Add formatting utility functions (these mirror upstream `metrics.ts` helpers for browser use):
     - `formatCost(cost: number): string` — formats as `$X.XX` or `$X.XXXX` for small values
     - `formatTokenCount(count: number): string` — formats with K/M suffixes
     - `formatDuration(ms: number): string` — formats as `Xs`, `Xm Xs`, or `Xh Xm`

3. **Create `web/app/api/visualizer/route.ts`** — the GET endpoint:
   - Follow the exact pattern of `web/app/api/recovery/route.ts`:
     ```
     import { collectVisualizerData } from "../../../../src/web/visualizer-service.ts"
     export const runtime = "nodejs"
     export const dynamic = "force-dynamic"
     export async function GET(): Promise<Response> { ... }
     ```
   - Try/catch wrapper: success → `Response.json(payload, { headers: { "Cache-Control": "no-store" } })`; error → `Response.json({ error: message }, { status: 500, headers: { "Cache-Control": "no-store" } })`
   - **Critical**: `runtime = "nodejs"` is required — `loadVisualizerData` uses `statSync`, `readFileSync`, and `import('node:fs')` which only work with the Node.js runtime, not the Edge runtime.

4. **Verify Map serialization is correct** — After creating the service, mentally trace: `loadVisualizerData()` returns `CriticalPathInfo` with `Map<string, number>` fields. The service converts them to `Record<string, number>` via `Object.fromEntries()`. The API route JSON-serializes the result. The browser types declare `Record<string, number>`. The chain is type-safe end-to-end.

5. **Build check**: Run `npm run build:web-host` to verify everything compiles.

## Must-Haves

- [ ] `src/web/visualizer-service.ts` exists and exports `collectVisualizerData()`
- [ ] `web/app/api/visualizer/route.ts` exists with `runtime = "nodejs"` and `dynamic = "force-dynamic"`
- [ ] `web/lib/visualizer-types.ts` exists with all interfaces and formatting utils
- [ ] Map→Record conversion is explicit in the service layer (not relying on JSON.stringify)
- [ ] `npm run build:web-host` exits 0

## Verification

- `npm run build:web-host` exits 0
- `rg "Object.fromEntries" src/web/visualizer-service.ts` returns at least 2 matches (one for milestoneSlack, one for sliceSlack)
- `rg "Record<string, number>" web/lib/visualizer-types.ts` returns matches for both slack fields
- `rg 'runtime = "nodejs"' web/app/api/visualizer/route.ts` returns a match

## Inputs

- `src/web/recovery-diagnostics-service.ts` — pattern for service layer (imports `resolveBridgeRuntimeConfig`)
- `web/app/api/recovery/route.ts` — pattern for API route structure
- `src/resources/extensions/gsd/visualizer-data.ts` — upstream data loader, type definitions (DO NOT modify)
- `src/resources/extensions/gsd/metrics.ts` — upstream metric types and formatters (reference only, DO NOT import in browser code)

## Expected Output

- `src/web/visualizer-service.ts` — new file, ~30-40 lines, wraps `loadVisualizerData()` with Map→Record conversion
- `web/app/api/visualizer/route.ts` — new file, ~25 lines, GET endpoint returning serialized visualizer data
- `web/lib/visualizer-types.ts` — new file, ~120-150 lines, all browser-safe interfaces + formatting utilities
