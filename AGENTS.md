<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Next.js version gate (non-negotiable)

This project runs **Next.js 16.2.12 + React 19.2.4 + Tailwind v4** — newer than most training data. Before writing any Next.js code, read the relevant page under `node_modules/next/dist/docs/`:

- `01-app/01-getting-started/` — layouts/pages, server vs client components, fetching, mutating, caching, error handling, CSS, fonts, metadata, route handlers, proxy
- `01-app/03-api-reference/01-directives/`, `02-components/`, `03-file-conventions/`, `04-functions/`, `05-config/`
- `01-app/02-guides/` for specific use cases

Prefer these files over memory. Heed deprecation notices in them.

## Commands

```bash
npm run dev          # dev server (Turbopack)
npm run build        # production build
npm run start        # serve production build
npm run lint         # eslint (flat config, bare `eslint` — no args needed)
npm run format       # prettier --write .
npm run format:check # prettier --check .
```

No test framework is installed. If a spec requires tests, pick one and record the decision in that spec.

Prettier is wired in (`.prettierrc.json`, `eslint-config-prettier`); run `npm run format` before committing.

## Spec-driven workflow (this is how work starts here)

The repo follows the spec-driven method from `Klerith/fernando-skills` via two skills:

1. `/spec <one-sentence description>` — designs `specs/NN-slug.md` section by section. **Writes no code.** Saves with status `Draft`; the user promotes it to `Approved` manually.
2. `/spec-impl <NN-slug>` — refuses to run unless the spec's status line means _Approved_ (any language). Creates/switches to branch `spec-NN-slug` (controlled by `AutoCreateBranch` in `specs/.spec-config.yml`), then implements step by step, pausing for diff review.

Consequences for any implementation work:

- The spec's **Implementation plan** is the source of truth for order; each numbered step must leave the app runnable.
- The spec's **Acceptance criteria** is the definition of done — verify against it, don't self-declare.
- Don't widen scope past the spec's "what is NOT in" section. New ideas become a new spec.

## Architecture

Arcade platform: play canvas games in the browser, save scores to Supabase, compete on leaderboards. Specs 01–09 are implemented.

### Routes (App Router only, `app/`)

| Route               | File                                   | Kind                               |
| ------------------- | -------------------------------------- | ---------------------------------- |
| `/`                 | `app/page.tsx` → `app/home-client.tsx` | server shell + client landing      |
| `/games`            | `app/games/page.tsx`                   | server, catalog from Supabase      |
| `/games/[id]`       | `app/games/[id]/page.tsx`              | server, game detail + top scores   |
| `/games/[id]/jugar` | `app/games/[id]/jugar/page.tsx`        | server shell → `GamePlayer` client |
| `/salon-de-la-fama` | `app/salon-de-la-fama/page.tsx`        | server, global leaderboard         |
| `/acerca-de`        | `app/acerca-de/page.tsx`               | server + contact form (Resend)     |
| `/auth`             | `app/auth/page.tsx`                    | client, fake local session         |

`app/layout.tsx` loads `Press_Start_2P`, `Courier_Prime`, `JetBrains_Mono` via `next/font/google` into `--font-pixel` / `--font-courier` / `--font-jetbrains`, and wraps everything in `AuthProvider` + `Nav`.

### Game engines

- Engines are framework-free TypeScript in `app/games/engines/<slug>/engine.ts` (asteroides, tetris, arkanoid, snake). No React, no DOM outside the canvas.
- Contract in `app/games/engines/types.ts`: a `GameEngineFactory(canvas, onState)` returns `GameEngine` with `pause/resume/restart/endNow/destroy`, and pushes `EngineState { score, lives, level, status }` upward.
- `app/games/engines/registry.ts` maps `game.id` → factory. **Adding a game = new engine folder + registry entry + a Supabase migration inserting the row in `games`.** A row without a registry entry is a broken game — remove one and you remove both.
- `GameCanvas` (`game-canvas.tsx`) is the only bridge: mounts/destroys the engine, forwards the imperative handle. `GamePlayer` (`app/components/game-player.tsx`) owns HUD, pause overlay, game-over and score submit.

### Data layer

- `app/data/queries.ts` is `server-only`: `getGames`, `getGameById`, `getTopScores`, `getBestScore`, `getGameWithBest`, `getGamesWithBest`. Server Components read from here — never query Supabase inline in a page.
- `app/data/types.ts` holds `Game`, `GameWithBest`, `ScoreRow`, `SessionUser`, `CATS`. Re-exported from `app/data`.
- Three Supabase clients, do not mix them: `lib/supabase/server.ts` (SSR + cookies, publishable key, reads), `lib/supabase/client.ts` (browser, publishable key), `lib/supabase/admin.ts` (`server-only`, secret key, writes only).
- Schema in `supabase/migrations/`: `games` (text id, cat/color CHECKs, `plays`, `sort`) and `scores` (game_id FK, player_name ≤20, score ≥ 0, `created_at`), index `(game_id, score desc)`. RLS on both tables with **select-only** policies for `anon`/`authenticated` — that's why inserts go through the admin client in a Server Action.
- Writes are Server Actions: `app/games/actions.ts#saveScore` (validates, inserts score, bumps `plays`), `app/acerca-de/actions.ts#sendContactMessage` (Resend, `useActionState` shape).
- Supabase MCP server is configured in `.mcp.json` (project `izyihpadbcilwqlynmud`). Schema changes go through a migration file in `supabase/migrations/`, not ad-hoc SQL.

### Auth

`app/auth-context.tsx` is a **fake client-side session**: `useSyncExternalStore` over `localStorage["av_user"]`, just a `{ name }` used to prefill the score submit. No Supabase Auth, no server session. Don't treat it as security.

### Styling

- **Tailwind v4, CSS-first.** No `tailwind.config.*`. `app/globals.css` (~2.8k lines) holds the whole arcade theme: CSS vars in `:root` (`--bg`, `--cyan`, `--magenta`, `--yellow`, `--green`, `--gold`, `--pixel`, `--mono`…), `@theme inline` bridging, plus hand-written component classes (covers, cards, CRT effects). Extend there; match the existing neon/CRT language.
- `references/templates/` holds the original HTML/JSX design mockups and the starter game sources — consult them before inventing new UI or game feel.
- TypeScript `strict`, `noEmit`; alias `@/*` → repo root.
- Env vars: see `.env.template` (`RESEND_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `SUPABASE_DB_PASSWORD`).

## Language

The user works in Spanish. Specs, clarifying questions, and discussion follow the language of the prompt; code, identifiers, and commit keywords stay in English.
