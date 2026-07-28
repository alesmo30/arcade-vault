# SPEC 02 — Home page, route rename to /games, Acerca de placeholder

> **Status:** Aproved
> **Depends on:** 01-mvp-visual-arcade-vault
> **Date:** 2026-07-27
> **Objective:** Port `references/templates/home-about/home.jsx` to the root route `/`, rename the current library/detail/player routes from `/`+`/juego/[id]` to `/games`+`/games/[id]`, and add an "Acerca de" nav tab pointing to a placeholder stub route — without porting `about.jsx`'s real content.

---

## Scope

**In:**

- Home (`/`): hero with floating pixel silhouettes, "why Arcade Vault" feature grid, games preview rail (first 6 `GAMES`), stats block, live activity ticker + top players list, pricing card + FAQ, final CTA — all from `home.jsx`, decorative sub-data (features/stats/ticker/top-players) as local constants inline in the component.
- Route rename: current `app/page.tsx` (library) → `app/games/page.tsx`, served at `/games`. `app/juego/[id]/` → `app/games/[id]/`, `app/juego/[id]/jugar/` → `app/games/[id]/jugar/`.
- Nav: add "Inicio" tab (→ `/`) and "Acerca de" tab (→ `/acerca-de`) to `app/components/nav.tsx`, both desktop and mobile panel. Update `isActive` for the new `/games` prefix.
- Stub route `app/acerca-de/page.tsx`: minimal "coming soon" placeholder, reusing existing generic classes (e.g. `.av-hero`) — no content ported from `about.jsx`.
- Update every internal link currently pointing at `/` (library) or `/juego/...` to `/games` or `/games/...`: `game-card.tsx`, `game-player.tsx` ("SALIR"), `juego/[id]/page.tsx` ("JUGAR AHORA"), `salon-de-la-fama/page.tsx` ("VOLVER A LA BIBLIOTECA").
- Auth redirect (`app/auth/page.tsx`) after login/guest → `/games`.
- Game-player "VOLVER AL VAULT" (end-of-game modal) → `/games`.
- Logo click in nav stays → `/` (home), matching template convention.
- Append the reference's HOME PAGE CSS block (`references/templates/home-about/styles.css` lines ~930-1070) into `app/globals.css`, ported 1:1.
- `generateStaticParams()` in the renamed `app/games/[id]/page.tsx` keeps working off `GAMES` ids.

**Out of scope:**

- `about.jsx` real content/layout — only a placeholder stub route exists.
- ABOUT CSS block (`styles.css` lines ~1071-1150) — not ported, since about isn't implemented.
- Any change to game logic, scoring, or auth logic beyond the redirect target.
- Any new data files beyond what spec 01 already defined (`app/data/`) — home's decorative content stays inline, not in `app/data/`.
- Automated/committed e2e test suite — verification uses Playwright MCP interactively, no `@playwright/test` dependency added.

---

## Data model

No new data structures. Home's decorative content (feature grid, stats, activity ticker, top players) stays as local literal constants inside the `Home` component — not domain data, not reused elsewhere, doesn't go through `app/data/`.

---

## Implementation plan

1. **Route rename — library.** `git mv app/page.tsx app/games/page.tsx`. No content change yet.
2. **Route rename — detail/player.** Move `app/juego/[id]/` content into `app/games/[id]/` (move the `[id]` subtree into the already-existing `app/games/` directory from step 1, not a folder-level `git mv app/juego app/games`, since the target dir already exists). Verify `app/games/[id]/page.tsx` and `app/games/[id]/jugar/page.tsx` land correctly, then remove the now-empty `app/juego/`.
3. **Fix internal links post-rename.** Update `game-card.tsx` (`/juego/${id}` → `/games/${id}`), `game-player.tsx` ("SALIR" → `/games/${game.id}`, "VOLVER AL VAULT" → `/games`), `app/games/[id]/page.tsx` ("JUGAR AHORA" → `/games/${id}/jugar`, back-link → `/games`), `salon-de-la-fama/page.tsx` ("VOLVER A LA BIBLIOTECA" → `/games`), `auth/page.tsx` (both `router.push("/")` → `router.push("/games")`).
4. **CSS — HOME PAGE block.** Append `references/templates/home-about/styles.css:930-1070` verbatim into `app/globals.css`.
5. **Home page — `app/page.tsx`.** New file (root now free after step 1) porting `home.jsx`: `FloatingSilhouettes`, `MiniCard`, `FeatureIcon` as local components in the same file; `useReveal()` hook for the `IntersectionObserver` scroll-in effect (`"use client"`). `navigate({name:"biblioteca"})` → `<Link href="/games">`, `navigate({name:"auth"})` → `<Link href="/auth">`, `navigate({name:"detalle", id})` → `<Link href={`/games/${id}`}>`, `navigate({name:"salon"})` → `<Link href="/salon-de-la-fama">`. `GAMES.slice(0,6)` from `@/app/data`. Feature/stats/ticker/top-players arrays stay as local literals, ported as-is from `home.jsx:135-227`.
6. **Nav — `app/components/nav.tsx`.** Add "Inicio" link (→ `/`) before "Biblioteca" in both desktop `links` and mobile panel. Add "Acerca de" link (→ `/acerca-de`) after "Salón de la Fama" in both. Update `isActive`: `"biblioteca"` now checks `pathname.startsWith("/games")` (drop the `/` and `/juego` checks), add `"home"` (`pathname === "/"`) and `"about"` (`pathname === "/acerca-de"`) cases.
7. **Stub — `app/acerca-de/page.tsx`.** Minimal Server Component, reuses `.av-hero`/`.sub` classes already in `globals.css` for a "PRÓXIMAMENTE" placeholder heading, no `about.jsx` content.
8. **Cierre.** `npm run lint` and `npm run build` clean.
9. **Verification.** Use Playwright MCP to walk every route and click-path in the acceptance criteria below; confirm component presence and resulting URLs match, including the full regression pass over the 4 untouched screens.

---

## Acceptance criteria

- [ ] `npm run build` and `npm run lint` finish with no errors or warnings.
- [ ] `/` renders the home page: hero, feature grid, 6-game preview rail, stats block, activity ticker + top players, pricing/FAQ, final CTA.
- [ ] `/games` renders the library (search + category chips + grid), exactly what `/` showed before this spec.
- [ ] `/juego/bloque-buster` no longer resolves; `/games/bloque-buster` shows the detail page (title, description, stat strip, 10-row leaderboard).
- [ ] `/games/no-existe` returns 404.
- [ ] "JUGAR AHORA" on the detail page leads to `/games/bloque-buster/jugar`.
- [ ] Nav shows 4 tabs in order: Inicio, Biblioteca, Salón de la Fama, Acerca de. Inicio is active only on `/`; Biblioteca is active on `/games` and `/games/*`.
- [ ] Clicking "Acerca de" navigates to `/acerca-de` and shows a placeholder page (no 404, no ported about content).
- [ ] Logging in from `/auth` (or "JUGAR COMO INVITADO") redirects to `/games`.
- [ ] Ending a game and clicking "VOLVER AL VAULT" in the end-of-game modal navigates to `/games`.
- [ ] "VOLVER A LA BIBLIOTECA" on `/salon-de-la-fama` navigates to `/games`.
- [ ] Clicking a mini-card or "VER TODOS LOS JUEGOS" on the home page navigates correctly (`/games/<id>` and `/games` respectively).
- [ ] At 375px width, home page's floating silhouettes/sections don't overflow horizontally; nav still collapses to hamburger.
- [ ] No hydration errors in browser console on `/`, `/games`, `/games/[id]`, `/acerca-de`.
- [ ] Full regression: `/salon-de-la-fama` (tabs + podium unchanged), `/auth` (login/guest flow unchanged apart from new redirect target), `/games/bloque-buster` and `/games/bloque-buster/jugar` (stat strip, leaderboard, HUD, pause, save-score toast, end-of-game modal) all still work exactly as in spec 01, confirmed via the same Playwright MCP session as the new-route checks.
- [ ] Verified via Playwright MCP: navigate each route (`/`, `/games`, `/games/bloque-buster`, `/games/bloque-buster/jugar`, `/acerca-de`, `/salon-de-la-fama`), confirm expected components render, click the nav links and CTAs listed above, confirm the resulting URL matches. Manual MCP session only — no test file committed.

---

## Decisions

- **Sí:** `/games` for library, English literal per user instruction. **No:** `/biblioteca` (would match spec 01's Spanish-slug convention). Explicit override — the prompt named `/games` directly.
- **Sí:** `/games/[id]` and `/games/[id]/jugar` replacing `/juego/[id]`. **No:** keep `/juego/[id]` alongside a separate `/games` list. One coherent prefix, matches the literal `/games/<game name>` pattern requested.
- **Sí:** home page's feature/stats/ticker/top-players data stays inline as local constants. **No:** `app/data/home.ts`. Purely decorative, not domain data, matches the template's own approach.
- **Sí:** "Acerca de" gets a real stub route (`/acerca-de`) with placeholder text. **No:** disabled/inert nav item. Avoids a dead-end tab; still zero `about.jsx` content ported.
- **Sí:** logo click stays `/` (home). **No:** logo → `/games`. Standard convention, matches template's own `nav.jsx` (`go({name:"home"})` on logo).
- **Sí:** auth redirect and "VOLVER AL VAULT" both target `/games`. **No:** `/`. Preserves prior behavior — user lands where they pick a game, not on the marketing page.
- **Sí:** append reference's HOME PAGE CSS block into `globals.css`; ABOUT CSS block not ported. **No:** leave `globals.css` untouched (spec 01's rule) or port ABOUT CSS. This spec adds new screens (home + about-stub), so the CSS-frozen rule from spec 01 doesn't extend to it; ABOUT CSS is skipped since no about content exists to style.
- **Sí:** verification via Playwright MCP, one-time, no committed test file. **No:** `@playwright/test` as a dependency. CLAUDE.md notes no test framework is installed; adding one is a bigger decision than this spec's scope.

---

## Risks

| Risk | Mitigation |
| --- | --- |
| `git mv app/juego app/games` collides with `app/games/page.tsx` already created in step 1 (target dir exists) | Do the `page.tsx` move first, then move each `[id]` subtree content into the same `app/games/` directory rather than a folder-level `git mv`, avoiding a merge conflict |
| Reveal-on-scroll (`IntersectionObserver` in `useReveal()`) causes hydration mismatch if class toggling runs before mount | Effect only touches `classList` post-mount inside `useEffect`, same pattern spec 01 already uses for session read — no server/client markup divergence |
| Stray internal links to `/juego/...` or old `/` missed during rename cause silent 404s or wrong redirects | Full link inventory taken via grep across `app/`: 7 call sites confirmed (`auth/page.tsx` x2, `salon-de-la-fama/page.tsx`, `nav.tsx` x3, `game-player.tsx` x2, `game-card.tsx`, `games/[id]/page.tsx` x2) — each one is a named step-3 edit, not a blanket find/replace |
| Renaming `/` breaks the 4 untouched screens (`/salon-de-la-fama`, `/auth`, `/games/[id]`, `/games/[id]/jugar`) if a shared import path assumes the old structure | Full regression pass added to acceptance criteria: confirm all 4 existing screens still render and their own internal actions (search, tabs, login, pause/save/exit) still work post-rename, not just the new routes |

---

## Qué **no** está en este spec

- `about.jsx` real content/layout.
- ABOUT CSS block.
- Cualquier cambio a la lógica de juegos, puntuación o autenticación más allá del destino de redirect.
- Nuevos archivos en `app/data/` para el contenido decorativo del home.
- Suite de tests e2e automatizada y comiteada.

Cada uno de estos, si se implementa, va en su propio spec.
