# Los 4 puntos de integración

Añadir un juego a Arcade Vault toca exactamente estos 4 archivos/tipos de archivo. Todo lo demás del pipeline ya es genérico (ver "Qué NO se toca" al final).

## 1. Fila en `public.games` — migración SQL

Esquema (`supabase/migrations/20260729180408_create_games_and_scores.sql`):

```sql
create table public.games (
  id text primary key,
  title text not null,
  short text not null,
  long text not null,
  cat text not null check (cat in ('ARCADE','PUZZLE','SHOOTER','VERSUS')),
  cover text not null,
  color text not null check (color in ('cyan','magenta','yellow','green')),
  plays text not null default '0',
  sort int not null default 0
);
```

`best` no es columna — se deriva de `MAX(scores.score)` en `app/data/queries.ts`.

Fila de ejemplo real (`supabase/migrations/20260729180409_seed_games.sql`, última entrada, sort 8 = la más reciente):

```sql
insert into public.games (id, title, short, long, cat, cover, color, plays, sort) values
('asteroides', 'ASTEROIDES', 'Vuela, dispara y parte rocas en gravedad cero.',
 'Una nave vectorial flota en el vacío mientras campos de asteroides giran a la deriva. Rota, propúlsate y dispara: cada roca destruida se parte en fragmentos más pequeños hasta desintegrarse.',
 'SHOOTER', 'cover-asteroides', 'cyan', '0', 8);
```

Un juego nuevo va en `supabase/migrations/<timestamp>_add_game_<slug>.sql`, `sort` = siguiente entero libre (hoy 0..8 ocupados → 9 es el próximo), `plays` arranca en `'0'` (decisión del spec 06: ningún contador ficticio). Se aplica con `mcp__supabase__apply_migration` — **esto lo hace el paso de implementación, no el skill de diseño.**

`scores` no necesita tocarse por juego nuevo — el `game_id` es una FK genérica con `on delete cascade` y sin policy de INSERT pública (la escritura pasa por `app/games/actions.ts` con el cliente admin).

## 2. Portada — `.cover-<slug>` en `app/globals.css`

Bloque "Cover art generators" empieza en `app/globals.css:640`. Patrón: clase base con `background`, más `::after` (y a veces `::before`) en `position: absolute; inset: 0` apilando `radial-gradient`/`linear-gradient` y `filter: drop-shadow(...)`. Usa las variables de tema `var(--cyan)`, `var(--magenta)`, `var(--yellow)`, `var(--green)`, `var(--ink)` cuando el color coincide con el `color` de catálogo del juego.

Ejemplo completo, `.cover-asteroides` (`app/globals.css:801-827`):

```css
.cover-asteroides {
  background: linear-gradient(160deg, #001a2e, #000);
}
.cover-asteroides::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 20% 25%, var(--cyan) 0 2px, transparent 3px),
    radial-gradient(circle at 65% 15%, var(--cyan) 0 2px, transparent 3px),
    radial-gradient(circle at 85% 55%, var(--cyan) 0 2px, transparent 3px),
    radial-gradient(circle at 30% 80%, var(--cyan) 0 2px, transparent 3px),
    radial-gradient(circle at 55% 68%, #667 0 20px, transparent 21px),
    radial-gradient(circle at 78% 32%, #889 0 14px, transparent 15px);
  filter: drop-shadow(0 0 6px rgba(0, 245, 255, 0.35));
}
.cover-asteroides::before {
  content: "";
  position: absolute;
  left: 46%;
  top: 46%;
  width: 22px;
  height: 22px;
  border: 1.5px solid var(--cyan);
  clip-path: polygon(100% 50%, 0% 0%, 22% 50%, 0% 100%);
  filter: drop-shadow(0 0 6px var(--cyan));
}
```

Nunca reusar la clase de otro juego ni renderizar un frame real del canvas como miniatura (decisión explícita de spec 05) — identidad visual propia vía CSS puro.

## 3. Motor — `app/games/engines/<slug>/engine.ts`

Ver `references/engine-contract.md` de este mismo skill para el contrato completo y el esqueleto.

## 4. Registry — `app/games/engines/registry.ts`

Archivo completo hoy (6 líneas):

```ts
import type { GameEngineFactory } from "./types";
import { createAsteroidsEngine } from "./asteroides/engine";

export const ENGINES: Record<string, GameEngineFactory> = {
  asteroides: createAsteroidsEngine,
};
```

Un juego nuevo añade un import y una entrada, nada más.

---

## Qué NO se toca (ya es genérico, funciona para cualquier `game.id`)

- `app/games/engines/game-canvas.tsx` — host genérico: busca `ENGINES[gameId]`, monta/destruye, expone `pause/resume/restart/endNow` vía `useImperativeHandle`.
- `app/components/game-player.tsx` — `hasEngine = !!ENGINES[game.id]` (línea 18) decide todo: si es `true`, HUD/pausa/fin/reinicio/guardado usan el motor real; si es `false`, sigue la arena maqueta. Ningún juego nuevo necesita tocar este archivo.
- `app/games/actions.ts` — `saveScore({ gameId, playerName, score })` ya valida, inserta en `scores` con el cliente admin, e incrementa `plays` cuando es un entero plano. Funciona para cualquier `gameId` que exista en `games`.
- `app/data/queries.ts` — `getGames`, `getGameById`, `getTopScores`, `getBestScore`, `getGameWithBest`, `getGamesWithBest` leen de la DB sin lista hardcodeada de ids.
- Rutas `app/games/page.tsx`, `app/games/[id]/page.tsx`, `app/games/[id]/jugar/page.tsx`, `app/salon-de-la-fama/` — genéricas, iteran sobre lo que devuelva la DB.
- CSS de CRT/HUD/modal (`.av-player`, `.crt`, `.crt-screen`, `.modal`, `.toast-saved`, etc.) — compartido por todos los juegos con motor.

Si un spec para un juego nuevo propone cambios en algo de esta lista, es señal de que el scope está mal planteado — coméntalo en vez de incluirlo silenciosamente en el Implementation plan.
