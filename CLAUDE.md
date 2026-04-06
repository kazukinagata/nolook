# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

NoLook — a quiz game challenging vibe coders to prove they read Claude Code tool approval prompts. 30 questions, 60s each, approve or reject.

## Commands

- `npm run dev` — runs server (port 3001) + client (port 5173) concurrently
- `npm run dev:server` — Hono server only via tsx watch
- `npm run dev:client` — Vite dev server only
- `npm run build` — builds client to `dist/client`
- `npm test` — runs vitest (server + client tests)
- `npm run test:watch` — runs vitest in watch mode

## Testing

Vitest with workspace config — server tests run in `node` environment, client tests in `jsdom`.

- **Server tests**: pure logic tests for `Scorer` and `MemoryStorage`
- **Client tests**: hook tests (`useTimer`) + component tests (`ProgressBar`, `ConversationView`, `ToolConfirmation`, `StartScreen`)

## Architecture

### Game Flow

1. `POST /api/game/start` creates a `GameSession` with UUID. Returns first question instantly from static fallback pool (`fallbackQuestions.ts`). Fires background Agent SDK generation of 50 questions (25×2 batches, Haiku model) — fire-and-forget, no await.
2. `POST /api/game/:id/answer` validates answer, returns correctness + explanation + next question (pre-fetched for zero latency).
3. `POST /api/game/:id/serve` resets the server-side timer when the client actually displays a question.
4. `GET /api/game/:id/results` returns final scores with per-category radar data.
5. `GET /api/game/:id/feedback` streams personalized AI commentary via SSE (Hono `streamSSE` + Agent SDK streaming).

### Agent SDK Usage

Two patterns in `questionGenerator.ts`:
- **Structured output** for question generation: `query()` with `outputFormat: { type: "json_schema", schema }`, iterate messages for `type === "result"` to extract `structured_output`.
- **Streaming text** for feedback: `query()` without outputFormat, yield `text_delta` from `stream_event` messages.

Both use `model: "haiku"` with `tools: []`. No API key needed — relies on Claude Code OAuth.

### Question Deduplication

`MemoryStorage.getExistingCommandSummaries()` returns command/file summaries of all served+queued questions. These are passed to the prompt so the LLM avoids generating duplicates.

### Sessions

In-memory `Map<string, GameSession>`. Auto-expired after 10 minutes of inactivity (cleanup interval: 5 min). No persistence layer.

### Animations

Three self-contained HTML+Canvas pages in `public/prototypes/` (bomb, door, roulette). Loaded as iframes by `AnimationOverlay.tsx`. Communication via `postMessage`:
- Parent → iframe: `{ type: "start", isCorrect }`
- Iframe → parent: `{ type: "animationComplete" }`
- 12s safety timeout if iframe fails to signal.

### Client State

Single `useGame` hook manages all game state. Phases: `start` → `playing` → `animating` → `feedback` → (loop or `results`). Next question is cached in state from the answer response for instant transition.

### Key Files

- `src/server/config.ts` — centralized server constants (model, batch size, session expiry, etc.)
- `src/client/config.ts` — centralized client constants (animation timeout, delays)
- `src/server/data/questions-en.ts` and `questions-ja.ts` — static question pools split by language

## Conventions

- Server imports use `.js` extensions (Node ESM resolution)
- Question tool types are limited to Bash, Write, Edit (never Read/Glob/Grep)
- All prompts and explanations support both English and Japanese via `Language` type
- Styling follows GitHub Dark theme (`claude-code.css`)
- Avoid `as` type casts — use type guards and `in` checks instead
- Session validation is handled by Hono middleware (`withSession`) — route handlers access session via `c.get("session")`
- Magic numbers go in `config.ts` files, not inline
