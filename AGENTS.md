# Agent instructions — Content Radar Editorial Engine

## Next.js version warning
This project runs Next.js 16. APIs, conventions, and file structure differ from what your training data knows. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

---

## Architecture you must understand before changing anything

### Branch = client adaptation
Each git branch is a self-contained adaptation for a specific client. Agent instructions, axis configuration, competitor sets, source URLs, and editorial voice are all branch-specific. **Never copy client-specific content from one branch to another.** `main` currently carries the NOVUS Media adaptation; `vercel-editorial-engine` carries the Vercel adaptation; `hpe-editorial-engine` carries the HPE adaptation.

### Axes are the unit of research
An axis is one research lane: a specialist agent that fetches and processes a specific signal source, followed by `distillAgent` to convert raw findings into structured `TopicSignal[]`. Each axis has:
- A Mastra agent in `src/mastra/agents/`
- A Next.js Route Handler in `src/app/api/axis/{axis-name}/route.ts`
- An entry in `ALL_AXES` in `src/components/LoadingState.tsx`

**All three must stay in sync.** Adding an axis without updating `ALL_AXES` means the UI never shows or triggers it.

### `distillAgent` is called twice — intentionally
1. Inside each axis route — converts raw agent output into `TopicSignal[]`
2. Inside `/api/synthesize` — deduplicates and ranks signals from all axes into `RankedTopic[0..7]`

Do not collapse these into one call. They serve different purposes.

### SSE streaming pattern
Axis routes stream progress to the client via Server-Sent Events. The pattern is:

```
withEmitter(send, async () => {
  // run specialist agent
  emit({ type: "step", ... })   // progress events
  // run distillAgent
  emit({ type: "done", topics }) // terminal event
})
```

`withEmitter` and `emit` are in `src/lib/emitter.ts`. Use them — do not write raw SSE manually. Every axis route must close the stream in a `finally` block.

### Mastra + serverExternalPackages
`@mastra/*` is listed under `serverExternalPackages` in `next.config.ts`. This is required for Vercel deployment — do not remove it. If you add a package that also needs this treatment, add it to the same array.

### All agents use the Vercel AI Gateway
Every agent creates its model via:
```ts
const gateway = createOpenAI({
  baseURL: "https://ai-gateway.vercel.sh/v1",
  apiKey: process.env.AI_GATEWAY_API_KEY!
});
model: gateway.chat(process.env.MODEL_ID!)
```
Do not hardcode a model name. Do not use a different provider client. `MODEL_ID` controls the model for all agents at once.

### Redis is lazily initialized
`Redis.fromEnv()` is called on first use, not at module load time. This is intentional — Next.js imports all route modules at build time, and calling `Redis.fromEnv()` at the top level would break builds without env vars. Do not change the lazy proxy pattern in `src/mastra/index.ts`.

---

## Key files and what owns what

| File | Owns |
|---|---|
| `src/lib/types.ts` | All shared Zod schemas (`TopicSignal`, `RankedTopic`, `Brief`). Change schemas here, nowhere else. |
| `src/components/LoadingState.tsx` | `ALL_AXES` — the authoritative list of active axes. |
| `src/mastra/index.ts` | Mastra instance and Redis singleton. |
| `src/lib/emitter.ts` | SSE helpers. Do not duplicate this logic in routes. |
| `src/lib/parseJson.ts` | Safe JSON extraction from LLM output. Always use this instead of `JSON.parse` on model responses. |
| `vercel.json` | Function `maxDuration` per route. Axis and synthesize routes are long-running (up to 300 s on heavy branches). |

---

## What not to do

- Do not call `JSON.parse` directly on agent output — use `parseJsonResponse` from `src/lib/parseJson.ts`
- Do not add `"use client"` to anything in `src/app/api/` — all route handlers are server-only
- Do not import agent files into client components — agents run server-side only
- Do not reduce `maxDuration` in `vercel.json` without checking actual agent run times first; these routes are slow by design
- Do not add client-specific terminology, URLs, or competitor names to shared utility files (`lib/`, `components/`) — those belong in agent files only
