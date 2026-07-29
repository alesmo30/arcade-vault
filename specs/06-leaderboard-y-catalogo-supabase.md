# SPEC 06 — Leaderboard real y catálogo de juegos en Supabase

> **Status:** Implemented
> **Depends on:** 04-supabase-connection, 05-asteroides-juego
> **Date:** 2026-07-29
> **Objective:** Crear las tablas `games` y `scores` en el Supabase remoto, mover el catálogo a la base de datos como fuente de verdad, alimentar `/games`, `/games/[id]` y `/salon-de-la-fama` con datos reales, y hacer que "GUARDAR PUNTUACIÓN" en Asteroides inserte de verdad una fila vía Server Action.

---

## Context

Hoy la app es una maqueta con conexión: la spec 04 dejó los clientes de Supabase listos (`lib/supabase/client.ts`, `lib/supabase/server.ts`) pero la base de datos remota está **vacía — 0 tablas**. El catálogo vive hardcodeado en `app/data/games.ts` (9 juegos), el salón de la fama inventa filas con `seededScores()` (`app/data/scores.ts`), y el botón GUARDAR PUNTUACIÓN de `app/components/game-player.tsx:149` solo dispara un toast falso. Asteroides (spec 05) ya produce puntuaciones reales que se tiran a la basura al cerrar el modal.

Este spec cierra ese hueco: esquema en Postgres, lectura real en las tres rutas del catálogo/leaderboard, y una escritura real desde el único juego con motor.

---

## Scope

**In:**

- Tablas `public.games` y `public.scores` en el proyecto remoto, con RLS activo, creadas vía MCP `apply_migration` y el SQL versionado en `supabase/migrations/`.
- Seed de los 9 juegos actuales de `app/data/games.ts` a `games`, y seed de scores demo a `scores` para los 9 juegos.
- `app/data/games.ts` deja de ser fuente de verdad: se elimina el array `GAMES` y `seededScores()`; el catálogo se lee de la DB.
- Capa de acceso a datos `app/data/queries.ts` (server-only): `getGames()`, `getGameById(id)`, `getTopScores(gameId, limit)`, `getBestScore(gameId)`.
- `/games` (`app/games/page.tsx`): pasa a Server Component que hace fetch y delega los filtros/búsqueda a un client component nuevo.
- `/games/[id]` y `/games/[id]/jugar`: leen el juego de la DB; el leaderboard lateral del detalle usa `scores` reales.
- `/salon-de-la-fama`: podio + tabla con datos reales por juego, estado vacío cuando un juego no tiene marcas.
- Server Action `saveScore` que inserta en `scores` usando la **secret key** (service_role) — nunca expuesta al browser — conectada al botón GUARDAR PUNTUACIÓN, solo en Asteroides.
- `SUPABASE_SECRET_KEY` en `.env.local` y `.env.template`.

**Out (queda para specs futuras):**

- Auth real de Supabase. La identidad sigue siendo el `av_user` de localStorage, sin verificación.
- Escritura de puntuación desde los 8 juegos sin motor (arena maqueta).
- Incremento real de `plays` por partida.
- Realtime en el leaderboard, paginación, filtros por fecha/temporada.
- Panel de administración del catálogo (alta/edición de juegos desde la app).
- Tests automatizados (no hay framework instalado; verificación con Playwright MCP como en specs 02-03 y 05).

---

## Data model

### Tabla `public.games`

| Columna | Tipo      | Notas                                                    |
| ------- | --------- | -------------------------------------------------------- |
| `id`    | `text` PK | slug: `asteroides`, `bloque-buster`, …                   |
| `title` | `text`    | `NOT NULL`                                               |
| `short` | `text`    | `NOT NULL` — texto de card                               |
| `long`  | `text`    | `NOT NULL` — texto de detalle                            |
| `cat`   | `text`    | `CHECK (cat IN ('ARCADE','PUZZLE','SHOOTER','VERSUS'))`  |
| `cover` | `text`    | clase CSS: `cover-asteroides`, …                         |
| `color` | `text`    | `CHECK (color IN ('cyan','magenta','yellow','green'))`   |
| `plays` | `text`    | valor congelado actual (`"12.4K"`); nadie lo incrementa  |
| `sort`  | `int`     | orden de aparición en `/games`, preserva el orden actual |

`best` **no** es columna: se deriva de `MAX(scores.score)` por juego.

### Tabla `public.scores`

| Columna       | Tipo          | Notas                                                           |
| ------------- | ------------- | --------------------------------------------------------------- |
| `id`          | `uuid` PK     | `default gen_random_uuid()`                                     |
| `game_id`     | `text`        | `references games(id) on delete cascade`, `NOT NULL`            |
| `player_name` | `text`        | `NOT NULL`, `CHECK (char_length(player_name) between 1 and 20)` |
| `score`       | `int`         | `NOT NULL`, `CHECK (score >= 0)`                                |
| `is_demo`     | `boolean`     | `default false` — marca las filas del seed                      |
| `created_at`  | `timestamptz` | `default now()`                                                 |

Índice `scores_game_score_idx on scores (game_id, score desc)` para el top-N.

### RLS

- `games`: RLS activo. Policy `SELECT` para `anon`/`authenticated`. Sin INSERT/UPDATE/DELETE públicos.
- `scores`: RLS activo. Policy `SELECT` para `anon`/`authenticated`. **Sin policy de INSERT** — la escritura pasa solo por la Server Action con secret key, que evita RLS.

### Tipos TypeScript

`app/data/types.ts` conserva `Game` (ahora con `sort`, sin `best`) y `ScoreRow`, más un tipo derivado `GameWithBest = Game & { best: number }` para el detalle.

---

## Implementation plan

1. **Secret key + entorno.** Añadir `SUPABASE_SECRET_KEY` a `.env.local` (valor del dashboard, formato `sb_secret_…`) y su placeholder en `.env.template`. Verificar que `.env.local` sigue fuera de git. Nada cambia en runtime todavía.
2. **Migración de esquema.** `supabase/migrations/<ts>_create_games_and_scores.sql`: tablas, CHECKs, índice, RLS activo y policies de SELECT. Aplicar con MCP `apply_migration`. Verificar con `list_tables`.
3. **Migración de seed.** `<ts>_seed_games_and_demo_scores.sql`: los 9 juegos exactos del array actual (mismo id/title/short/long/cat/cover/color/plays, `sort` = índice actual) + scores demo por juego (`is_demo = true`) usando los nombres de `PLAYERS`. La app sigue leyendo del array: aún no rompe nada.
4. **Capa de queries.** `app/data/queries.ts` (`import "server-only"`): `getGames()`, `getGameById()`, `getTopScores()`, `getBestScore()`, usando `createClient()` de `lib/supabase/server.ts`. Nada la consume todavía.
5. **Cliente admin + Server Action.** `lib/supabase/admin.ts` — cliente con `SUPABASE_SECRET_KEY` vía `createClient` de `@supabase/supabase-js` (no `@supabase/ssr`, no cookies), `import "server-only"`. `app/games/actions.ts` con `saveScore({ gameId, playerName, score })`: valida rangos, comprueba que `gameId` existe, inserta, devuelve `{ ok }`. Sigue el patrón de `app/acerca-de/actions.ts`.
6. **`/games` a servidor.** `app/games/page.tsx` pasa a Server Component `async` que llama `getGames()` y renderiza `<GameGrid games={…} />`; el nuevo `app/components/game-grid.tsx` (`"use client"`) se queda con el estado de búsqueda + chips de categoría y el `GameCard` actual. `CATS` se mantiene donde está.
7. **Detalle y jugar a servidor.** `app/games/[id]/page.tsx`: `getGameById()` + `notFound()`, `getTopScores(id, 10)` para el aside, `getBestScore(id)` para "Mejor global". `app/games/[id]/jugar/page.tsx`: `getGameById()`. Eliminar `generateStaticParams` en ambas (las rutas pasan a dinámicas).
8. **Salón de la fama.** `app/salon-de-la-fama/page.tsx` pasa a Server Component que carga juegos + top 12 de cada uno y los entrega a un client component nuevo (`app/components/hall-tabs.tsx`) que conserva pestañas, podio, tabla y la fila "TU MEJOR MARCA" (esta última, si el jugador de localStorage aparece en las filas reales; si no, no se muestra). Estado vacío diseñado cuando un juego no tiene scores.
9. **Guardar puntuación real.** En `app/components/game-player.tsx`, el botón GUARDAR PUNTUACIÓN llama `saveScore` cuando `hasEngine` es true, con el nombre del `av_user` (si no hay sesión, el botón invita a iniciar sesión y no inserta). Estados: guardando / guardado / error, reusando el toast actual. Los juegos sin motor mantienen el toast maqueta.
10. **Limpieza.** Eliminar `GAMES`, `seededScores` y `PLAYERS` de `app/data/`, ajustar `app/data/index.ts` y `types.ts`. Sin imports muertos.
11. **Cierre.** `npm run lint` y `npm run build` limpios.
12. **Verificación.** Sesión Playwright MCP contra los criterios de aceptación + `execute_sql` para comprobar la fila insertada.

---

## Acceptance criteria

- [x] `npm run lint` y `npm run build` terminan sin errores ni warnings.
- [x] `list_tables` sobre `public` devuelve `games` y `scores` con RLS activo en ambas.
- [x] `games` contiene exactamente 9 filas, con los mismos id/title/cat/cover/color que tenía `app/data/games.ts`.
- [x] ~~`scores` contiene filas demo (`is_demo = true`) para los 9 juegos.~~ Decisión revertida a pedido del usuario tras implementar: se sembraron y luego se borraron todas las filas de `scores` para arrancar el salón de la fama vacío y llenarlo con partidas reales (ver Decisiones).
- [x] Un `INSERT` en `scores` con la key publishable desde fuera de la app es rechazado por RLS (verificado con `curl` contra `/rest/v1/scores`, 401); el mismo insert con la secret key funciona (201).
- [x] `SUPABASE_SECRET_KEY` no aparece en ningún bundle de cliente (`grep` sobre `.next/static` no la encuentra) y no está trackeada por git.
- [x] `/games` muestra los 9 juegos leídos de la DB; búsqueda y filtros por categoría siguen funcionando igual que antes.
- [x] `/games/asteroides` muestra el aside "MEJORES PUNTUACIONES" (estado vacío tras el borrado de scores) y "Mejor global" deriva de `MAX(score)` real (0 con la tabla vacía), no `28450` hardcodeado.
- [x] Un juego sin ninguna fila en `scores` muestra el estado vacío diseñado ("AÚN NADIE HA MARCADO"), sin romper el layout ni mostrar `NaN`.
- [x] `/salon-de-la-fama` muestra el estado vacío diseñado en todas las pestañas (tabla `scores` vacía por decisión final); la lógica de podio/tabla con datos reales está verificada por el HTML servido cuando había datos.
- [ ] Jugar Asteroides con sesión iniciada, morir, pulsar GUARDAR PUNTUACIÓN, y confirmar por SQL la fila insertada — **no verificado por UI**: Playwright MCP falló por conflicto de sesión de Chrome y `claude-in-chrome` no estaba disponible en la sesión. Verificado el mecanismo equivalente por `curl` directo contra la REST API de Supabase (RLS bloquea anon, secret key inserta).
- [ ] Tras guardar, recargar `/salon-de-la-fama` y ver la marca reflejada — no verificado por el mismo motivo; la lectura real desde `scores` sí está verificada (paso anterior con datos demo antes del borrado).
- [x] ~~Sin sesión iniciada, GUARDAR PUNTUACIÓN no inserta nada y avisa al jugador.~~ Decisión revertida a pedido del usuario: esto es una app de entrenamiento, no de producción. Sin sesión, GUARDAR PUNTUACIÓN sí inserta usando el nombre editable en el input (default `INVITADO`), igual que el resto de los juegos maqueta. Con sesión, el nombre queda fijo al `av_user` y el input se deshabilita.
- [x] Regresión: `/games/bloque-buster/jugar` sigue mostrando la arena maqueta (`game-arena` presente en el HTML); Asteroides sigue sirviendo `canvas`/`crt-screen`.
- [x] Sin errores de hidratación en consola en `/games`, `/games/asteroides`, `/games/asteroides/jugar` y `/salon-de-la-fama` (log del dev server limpio).
- [x] `grep -r "seededScores\|GAMES\b" app/` no devuelve referencias vivas.

---

## Decisions

- **Sí:** `games` como fuente de verdad en Postgres. **No:** dejar el array y usar la DB solo para el FK. Decisión explícita del usuario: el catálogo deja de vivir en el código.
- **Sí:** `player_name` libre desde el `av_user` de localStorage. **No:** bloquear este spec hasta tener auth real. El leaderboard funciona ya; la migración a `user_id` es un spec propio cuando llegue auth.
- **Sí:** SELECT anónimo + INSERT solo por Server Action con secret key. **No:** INSERT anónimo con CHECKs. Sin auth, un INSERT público es una tabla escribible desde la consola del navegador de cualquiera.
- **Sí (decisión final):** GUARDAR PUNTUACIÓN funciona sin sesión iniciada, con nombre libre editable en el input (igual que los juegos maqueta). **No:** bloquear el guardado hasta iniciar sesión. El diseño original de la spec exigía login para guardar; el usuario pidió revertirlo explícitamente porque esto es una app de entrenamiento, no de producción — la protección real llegará junto con auth real en un spec futuro.
- **Sí (diseño original):** seed de scores demo marcados con `is_demo`. **Decisión final del usuario, al cerrar la implementación:** se sembraron y luego se borraron todas las filas de `scores` (`delete from public.scores`) para arrancar el salón de la fama vacío y llenarlo solo con partidas reales desde cero. La columna `is_demo` queda en el esquema por si se reutiliza el seed más adelante, pero no hay filas marcadas actualmente. La migración `20260729180409_seed_games.sql` quedó actualizada para reflejar esto (solo siembra `games`).
- **Sí:** `best` derivado de `MAX(score)`. **Decisión final del usuario, al cerrar la implementación:** `plays` deja de estar congelado para juegos con motor real — `saveScore` (`app/games/actions.ts`) lo incrementa en 1 tras cada guardado exitoso, solo cuando el valor actual es un entero plano (`/^\d+$/`), para no corromper los strings tipo `"12.4K"` de los juegos maqueta. El backfill de la primera partida de Asteroides se corrigió a mano por SQL.
- **Sí:** `plays` arranca en `'0'` para los 9 juegos, incluidos los 8 sin motor todavía. **No:** dejar los valores ficticios (`"12.4K"`, `"31.8K"`, etc.) del array original. El usuario pidió consistencia: si un juego no es jugable de verdad todavía, su contador de partidas no debe mentir. `supabase/migrations/20260729180409_seed_games.sql` y la DB remota quedaron alineados en `'0'` para los 8 juegos maqueta.
- **Sí:** Server Components dinámicos, sin cache. **No:** `revalidatePath` ni cacheo del catálogo. Los datos siempre frescos, menos piezas que coordinar; el tráfico de este proyecto no justifica el cacheo aún.
- **Sí:** partir `/games` y `/salon-de-la-fama` en server (fetch) + client (interacción). **No:** consultar Supabase desde el browser. La secret key nunca toca el cliente y el HTML llega ya poblado.
- **Sí:** migraciones aplicadas por MCP `apply_migration` con el SQL en `supabase/migrations/`. **No:** Supabase CLI local ni dashboard a mano. Sin stack local, pero el esquema queda versionado en el repo.
- **Sí:** eliminar `generateStaticParams` de `/games/[id]`. **No:** mantenerlo consultando la DB en build. Las rutas ya son dinámicas por los scores; prerenderizar solo añade una consulta en build sin beneficio.

---

## Risks

| Riesgo                                                                        | Mitigación                                                                                                                                      |
| ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| La secret key se filtra a un bundle de cliente                                | `lib/supabase/admin.ts` con `import "server-only"`, variable sin prefijo `NEXT_PUBLIC_`, criterio de aceptación con `grep` sobre `.next/static` |
| Cualquiera puede guardar cualquier nombre y puntuación desde la Server Action | Aceptado y explícito: sin auth no hay defensa real. `is_demo` y `created_at` permiten auditar y limpiar; se cierra con el spec de auth          |
| Convertir `/games` y `/salon-de-la-fama` a servidor rompe filtros/pestañas    | Paso 6 y 8 extraen el estado a client components dedicados sin tocar el JSX ni las clases CSS existentes                                        |
| La app queda rota entre el paso 3 y el 10 si se mezclan array y DB            | Los pasos 2-5 no consumen nada; el switch de fuente ocurre en 6-8 y la limpieza del array en 10, ya sin lectores                                |
| Falta la secret key en `.env.local` y todo el guardado falla en silencio      | Paso 1 es prerequisito bloqueante: sin `SUPABASE_SECRET_KEY` no se avanza. La Server Action falla ruidosa, con error visible en el modal        |
| `notFound()` en rutas ahora dinámicas cambia el comportamiento de 404         | Criterio de regresión sobre `/games/bloque-buster/jugar` y verificación de un id inexistente                                                    |

---

## Qué **no** está en este spec

- Auth real de Supabase y migración de `player_name` a `user_id`.
- Guardar puntuación en los 8 juegos sin motor.
- `plays` real, Realtime, paginación o temporadas del leaderboard.
- Administración del catálogo desde la app.
- Suite de tests automatizada y comiteada.

---

## Prerequisito de ejecución

`SUPABASE_SECRET_KEY` debe copiarse del dashboard de Supabase (Project Settings → API keys → secret, formato `sb_secret_…`) a `.env.local` antes del paso 2. MCP no expone esa key.

---

## Verificación end-to-end

1. `npm run dev`.
2. MCP Supabase: `list_tables` (esquema), `execute_sql` con `select count(*) from games` y `select game_id, count(*) from scores group by 1`.
3. Playwright MCP: `/games` (9 cards, búsqueda, chips) → card ASTEROIDES → detalle (aside con scores reales, "Mejor global" real) → JUGAR AHORA → partida hasta FIN DEL JUEGO → GUARDAR PUNTUACIÓN → `/salon-de-la-fama` pestaña ASTEROIDES y comprobar la marca → pestaña de un juego sin scores para ver el estado vacío → regresión en `/games/bloque-buster/jugar`.
4. `execute_sql`: confirmar la fila insertada con nombre y score de la partida.
5. `npm run build` y `grep -r "sb_secret" .next/static` sin resultados.
