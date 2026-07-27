# SPEC 01 — MVP visual de Arcade Vault

> **Status:** Approved
> **Depends on:** —
> **Date:** 2026-07-25
> **Objective:** Convertir las 5 pantallas de `references/templates/*.jsx` en rutas reales de Next.js App Router con TypeScript, sin implementar ningún juego real.

---

## Por qué existe este spec

El diseño ya está resuelto: `app/globals.css` contiene portado 1:1 el CSS de
`references/templates/styles.css` (909 vs 904 líneas, mismas 48 clases usadas por los templates), y
`app/layout.tsx` ya monta fuentes, `.av-bg`, `.av-noise` y `#root`. Lo que falta es traducir los 5
templates JSX (sin TypeScript, sin bundler, routing por `location.hash`, componentes colgados de
`window`) a rutas de archivo de Next 16, sin escribir la lógica de ningún juego.

---

## Scope

**In:**

- Biblioteca (`/`): hero, buscador por nombre, chips de categoría, grid de cards con tilt 3D, estado vacío.
- Detalle de juego (`/juego/[id]`): cover, tags, descripción larga, stat strip, acciones, leaderboard lateral.
- Reproductor (`/juego/[id]/jugar`): HUD, marco CRT con arena animada por CSS existente, pausa, modal de fin de partida — todo con datos fijos, sin lógica de juego.
- Salón de la Fama (`/salon-de-la-fama`): tabs por juego, podio 2·1·3, tabla completa, fila "tu marca" si hay sesión.
- Auth (`/auth`): tabs login/registro, campos, modo invitado, botones sociales decorativos.
- Nav global y footer en el layout, con menú móvil y estado de sesión.
- Datos ficticios en `app/data/`, tipados, como futuro punto de reemplazo por base de datos.
- Sesión simulada en `localStorage` bajo la clave `av_user`.

**Out of scope (for future specs):**

- Cualquier motor de juego real. La arena del reproductor es decoración CSS ya existente.
- El `setInterval` que simula puntuación creciente en `reproductor.jsx:14-18` — el score del reproductor es un valor fijo de ejemplo.
- Persistencia de puntuaciones (`av_scores`). El botón "GUARDAR PUNTUACIÓN" solo cambia a estado visual "guardado", no escribe nada.
- Backend, base de datos real, validación de credenciales, OAuth real, contador de créditos funcional.
- Tests automatizados (no hay framework instalado; este MVP es puramente visual).
- CSS nuevo o modificado: `app/globals.css` ya cubre las 48 clases usadas.

---

## Data model

Todo en `app/data/`, tipado, exportado como constantes. Es el punto que después se reemplaza por
llamadas a una base de datos.

```ts
// app/data/types.ts
export type GameCategory = "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
export type GameColor = "cyan" | "magenta" | "yellow" | "green";

export type Game = {
  id: string; // "bloque-buster"
  title: string; // "BLOQUE BUSTER"
  short: string; // texto de card
  long: string; // texto de detalle
  cat: GameCategory;
  cover: string; // clase CSS: "cover-bricks" | ...
  color: GameColor; // variante de botón
  best: number;
  plays: string; // "12.4K"
};

export type ScoreRow = { rank: number; name: string; score: number; date: string };
export type SessionUser = { name: string };
```

- `app/data/games.ts` exporta `GAMES: Game[]` (los 8 juegos de `data.jsx`) y `CATS` (`"TODOS"` + las 4 categorías).
- `app/data/scores.ts` exporta `PLAYERS: string[]` (18 nombres) y `seededScores(seed: number, count?: number): ScoreRow[]`, portado literal de `references/templates/data.jsx:102-118` (PRNG determinista LCG `s*9301+49297 % 233280`). Determinista a propósito: servidor y cliente deben producir la misma tabla, sin mismatch de hidratación.
- `app/data/index.ts` re-exporta todo lo anterior.

`localStorage` usa una única clave, `av_user`, con valor `SessionUser | null`. Sin versionado de
esquema: si el JSON no parsea, se trata como sesión ausente.

---

## Implementation plan

1. **Capa de datos — `app/data/`.** Crear `types.ts`, `games.ts`, `scores.ts`, `index.ts` según el modelo de arriba, portando los 8 juegos y los 18 nombres desde `references/templates/data.jsx`. Sin `window.*`, solo exports ES.
2. **Sesión — `app/auth-context.tsx`.** `"use client"`. `AuthProvider` + hook `useSession()` con `{ user, signIn, signOut }`. Lee `av_user` de `localStorage` en un `useEffect` de montaje (nunca durante el render inicial, para no romper hidratación); escribe en cada `signIn`/`signOut`. `signIn(null)` es el modo invitado.
3. **Layout global — `app/layout.tsx` + `app/components/nav.tsx`.** Envolver `#root` en `<AuthProvider>`, insertar `<Nav />` antes de `main.av-main` y el `<footer>` de `app.jsx:43-45` después. `Nav` es `"use client"`: `usePathname()` para el estado activo (la Biblioteca queda activa también en `/juego/*`), `<Link>` para navegar, `useState` para el panel móvil, `useSession()` para alternar "Iniciar Sesión" / `"{user.name} ▾"`.
4. **Biblioteca — `app/page.tsx` + `app/components/game-card.tsx`.** Reemplaza el placeholder de `create-next-app`. `"use client"` por buscador/chips/tilt. Filtrado con `useMemo` sobre `GAMES` (categoría + substring de `title`, case-insensitive), incluye estado vacío. `GameCard` conserva el tilt con `useRef` + `getBoundingClientRect` de `biblioteca.jsx:5-16`. Card y botón "JUGAR" navegan a `/juego/[id]`.
5. **Detalle — `app/juego/[id]/page.tsx`.** Server Component. `params` es una `Promise` en esta versión de Next (`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md:44-48`): `const { id } = await params`. Si el `id` no existe en `GAMES`, `notFound()`. `generateStaticParams()` con los ids de `GAMES`. Leaderboard con `seededScores(id.length * 17 + 3, 10)`.
6. **Reproductor — `app/juego/[id]/jugar/page.tsx` + `app/components/game-player.tsx`.** La page (Server Component) resuelve `params`, valida el juego y delega en `GamePlayer` (client). Sin `setInterval`: `score`/`lives`/`level` son constantes de ejemplo (`28450`, 3, `01`). "PAUSA" alterna el overlay "EN PAUSA" (estado local visual). "FIN" abre el modal de fin de partida con el score fijo. "GUARDAR PUNTUACIÓN" cambia a `.toast-saved` sin persistir. "JUGAR DE NUEVO" cierra el modal; "SALIR"/"VOLVER AL VAULT" navegan.
7. **Salón de la Fama — `app/salon-de-la-fama/page.tsx`.** `"use client"` por los tabs. Tab inicial `GAMES[0].id`, filas `seededScores(tab.length * 23 + 7, 12)`, podio y tabla con los delays de animación por índice. La fila "TU MEJOR MARCA" solo aparece si `useSession()` devuelve usuario.
8. **Auth — `app/auth/page.tsx`.** `"use client"`. Tabs login/registro (campo email solo en registro, con `.slide-in`). Submit sin validación: `signIn({ name: (user || "PLAYER1").toUpperCase().slice(0, 10) })` y `router.push("/")`. "JUGAR COMO INVITADO" hace `signIn(null)` y navega. Botones sociales inertes.
9. **Cierre.** `npm run lint` y `npm run build` limpios. Borrar los SVG sin uso de `create-next-app` en `public/` (`next.svg`, `vercel.svg`, `file.svg`, `globe.svg`, `window.svg`).

---

## Acceptance criteria

- [ ] `npm run build` y `npm run lint` terminan sin errores ni warnings.
- [ ] `/` lista los 8 juegos; escribir "cai" deja solo CAÍDA; el chip PUZZLE deja solo CAÍDA; una búsqueda sin match muestra "NO HAY RESULTADOS".
- [ ] Click en una card lleva a `/juego/bloque-buster` con título, descripción larga, stat strip y 10 filas de leaderboard.
- [ ] `/juego/no-existe` devuelve la página 404.
- [ ] "JUGAR AHORA" lleva a `/juego/bloque-buster/jugar` con HUD de score fijo y marco CRT con arena animada.
- [ ] En el reproductor, "PAUSA" muestra/oculta el overlay "EN PAUSA" y "FIN" abre el modal con el score.
- [ ] "GUARDAR PUNTUACIÓN" reemplaza el input por "▸ PUNTUACIÓN GUARDADA_" y no escribe en `localStorage`.
- [ ] `/salon-de-la-fama` muestra podio y 12 filas; cambiar de tab cambia la tabla; sin sesión no aparece la fila "TU MEJOR MARCA".
- [ ] Login en `/auth` con usuario "px_kai" hace que el nav muestre "PX_KAI ▾", `localStorage.av_user` contenga `{"name":"PX_KAI"}`, y la fila "TU MEJOR MARCA" aparezca en el salón.
- [ ] Tras recargar la página la sesión persiste; el botón del nav la cierra y limpia `av_user`.
- [ ] A 375px de ancho el nav colapsa en hamburguesa y el panel lateral abre y cierra.
- [ ] La consola del navegador no reporta errores de hidratación en ninguna de las 5 pantallas.
- [ ] `app/globals.css` no cambió respecto a la versión commiteada.

---

## Decisions

- **Sí:** rutas de archivo de Next (`/`, `/juego/[id]`, `/juego/[id]/jugar`, `/salon-de-la-fama`, `/auth`). **No:** routing por hash de `app.jsx`. URLs compartibles, back/forward del navegador, es el idioma del framework.
- **Sí:** slugs en español. **No:** `/game/[id]`, `/hall-of-fame`. La UI ya está en español; consistencia.
- **Sí:** `localStorage` con clave `av_user` vía Context. **No:** estado solo en memoria. La sesión sobrevive a la recarga sin backend, igual que el template.
- **Sí:** `seededScores` determinista, portado literal. **No:** datos aleatorios en cada render. Servidor y cliente coinciden, sin mismatch de hidratación.
- **Sí:** datos en `app/data/`. **No:** `app/lib/`. Decisión explícita del usuario — es el punto de reemplazo por base de datos.
- **Sí:** reproductor estático, sin el `setInterval` del template. **No:** mantener el simulador de score. El encargo es "solo visual, ningún juego".
- **Sí:** sin persistir puntuaciones (`av_scores`). **No:** guardar en `localStorage`. No hay partida real que genere un score legítimo.
- **Sí:** Server Components para detalle y reproductor, client solo donde hay interacción. **No:** todo `"use client"`. Menos JS al cliente; los datos son estáticos.

---

## Risks

| Risk | Mitigation |
| --- | --- |
| Mismatch de hidratación por leer la sesión durante el render inicial | Leer `localStorage` en `useEffect` de montaje; el nav arranca en estado "sin sesión" |
| `params` tratado como objeto síncrono (así lo asume la mayoría del material de entrenamiento) | `await params` en cada page dinámica, según `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md` |
| Deriva del CSS si se inventa alguna clase no presente en el template | Todo el marcado se transcribe literal de los templates; el último criterio de aceptación exige que `globals.css` no cambie |

---

## Qué **no** está en este spec

- Ningún motor de juego real (ni siquiera uno simple). Cada juego, si se implementa, es su propio spec.
- Persistencia de puntuaciones (`av_scores`) y cualquier leaderboard real.
- Backend, base de datos, autenticación real u OAuth.
- Tests automatizados.

Cada uno de estos, si se implementa, va en su propio spec.
