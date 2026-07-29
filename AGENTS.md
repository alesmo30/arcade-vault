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
npm run dev      # dev server (Turbopack)
npm run build    # production build
npm run start    # serve production build
npm run lint     # eslint (flat config, bare `eslint` — no args needed)
```

No test framework is installed. If a spec requires tests, pick one and record the decision in that spec.

## Spec-driven workflow (this is how work starts here)

The repo follows the spec-driven method from `Klerith/fernando-skills` via two skills:

1. `/spec <one-sentence description>` — designs `specs/NN-slug.md` section by section. **Writes no code.** Saves with status `Draft`; the user promotes it to `Approved` manually.
2. `/spec-impl <NN-slug>` — refuses to run unless the spec's status line means _Approved_ (any language). Creates/switches to branch `spec-NN-slug` (controlled by `AutoCreateBranch` in `specs/.spec-config.yml`), then implements step by step, pausing for diff review.

Consequences for any implementation work:

- The spec's **Implementation plan** is the source of truth for order; each numbered step must leave the app runnable.
- The spec's **Acceptance criteria** is the definition of done — verify against it, don't self-declare.
- Don't widen scope past the spec's "what is NOT in" section. New ideas become a new spec.

## Architecture

Untouched `create-next-app` scaffold. Nothing project-specific exists yet, so the shape below is what a game must slot into:

- **App Router only** (`app/`). `app/layout.tsx` wires Geist/Geist_Mono via `next/font/google` into `--font-geist-sans` / `--font-geist-mono` CSS variables.
- **Tailwind v4, CSS-first.** No `tailwind.config.*` — theme tokens live in `app/globals.css` under `@theme inline`, and Tailwind loads through `@import "tailwindcss"` with `@tailwindcss/postcss`. Add design tokens there, not in a JS config.
- TypeScript `strict`, `noEmit`; import alias `@/*` maps to the repo root.
- Product intent (README): an online platform to play arcade games and compete on score — so game loops are client-side (`"use client"`, canvas/rAF) while scores/leaderboards are the server-side concern. No backend or persistence has been chosen yet; that decision belongs in a spec.

## Language

The user works in Spanish. Specs, clarifying questions, and discussion follow the language of the prompt; code, identifiers, and commit keywords stay in English.
