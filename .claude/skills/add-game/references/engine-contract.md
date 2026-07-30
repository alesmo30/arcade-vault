# Contrato del motor de juego

Fuente de verdad: `app/games/engines/types.ts` y el port de referencia `app/games/engines/asteroides/engine.ts` (641 líneas, ya en producción).

## Tipos (`app/games/engines/types.ts`)

```ts
export type EngineStatus = "playing" | "dead" | "gameover" | "paused";
export type EngineState = { score: number; lives: number; level: number; status: EngineStatus };

export type GameEngine = {
  pause(): void;
  resume(): void;
  restart(): void;
  endNow(): void;
  destroy(): void;
};
export type GameEngineFactory = (
  canvas: HTMLCanvasElement,
  onState: (s: EngineState) => void,
) => GameEngine;
```

## Invariantes no negociables

- **`"paused"` es externo.** El estado interno del motor (`type InternalStatus`) no incluye `"paused"` — solo `"playing" | "dead" | "gameover"`. La pausa la controla el wrapper (`externalPaused`) sin que la lógica de juego se entere.
- **Canvas lógico fijo 800×600.** `game-canvas.tsx` fija `width={800} height={600}` en el elemento y lo escala por CSS al 100%/100% dentro de `.crt-screen` (`aspect-ratio: 4/3`). Un juego con otra resolución nativa (Tetris: 300×600) se adapta dibujando dentro de ese lienzo lógico (letterboxing, escala interna), **no** cambiando el tamaño del canvas.
- **`maybeEmit()` throttling.** `onState` solo se llama cuando cambia `score`, `lives`, `level` o `status` respecto al último valor emitido — nunca en cada frame de `draw()`. Sin esto son ~60 re-renders/s en React. Patrón exacto:
  ```ts
  let lastEmitted: EngineState | null = null;
  function maybeEmit() {
    const next: EngineState = { score, lives, level, status: externalPaused ? "paused" : state };
    if (!lastEmitted || lastEmitted.score !== next.score || lastEmitted.lives !== next.lives ||
        lastEmitted.level !== next.level || lastEmitted.status !== next.status) {
      lastEmitted = next;
      onState(next);
    }
  }
  ```
- **Loop con dt clamp y reset limpio.**
  ```ts
  function loop(ts: number) {
    const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
    lastTime = ts;
    update(dt);
    draw();
    maybeEmit();
    rafId = requestAnimationFrame(loop);
  }
  function startLoop() {
    lastTime = null; // evita un salto de dt gigante al reanudar tras pausa
    rafId = requestAnimationFrame(loop);
  }
  ```
- **Listeners acotados y limpios.** Se registran en `window` en el momento de crear el motor (no en un `mount()` separado — la factory ya hace ese trabajo), con `preventDefault()` sobre un set de teclas capturadas para no scrollear la página:
  ```ts
  const CAPTURED_KEYS = new Set(["ArrowLeft", "ArrowRight", "ArrowUp", "Space"]);
  const onKeyDown = (e: KeyboardEvent) => {
    if (CAPTURED_KEYS.has(e.code)) e.preventDefault();
    if (!keys[e.code]) justPressed[e.code] = true;
    keys[e.code] = true;
  };
  ```
  `destroy()` **debe** quitar ambos listeners (`keydown`/`keyup`) y cancelar el `rAF` pendiente. Es el criterio de aceptación de "sin fugas al navegar ida y vuelta".
- **Sin globales de módulo, sin DOM fuera del canvas.** Nada de `document.getElementById`. La factory recibe `canvas`, hace `canvas.getContext("2d")` (lanzar si es `null`), y todo el estado vive en variables `let` dentro del closure de la factory. Las clases de entidad (Ship, Bullet, etc.) se declaran **dentro** del closure para capturar `ctx` sin pasarlo como parámetro en cada `draw()`.
- **Paleta centralizada.** Un único `const COLORS = { ... }` con hex/rgba literales cerca del top del archivo — es el único punto que `/frontend-design` necesita tocar para fijar la paleta neón.

## Esqueleto de archivo (orden que sigue `asteroides/engine.ts`)

```ts
import type { EngineState, GameEngine, GameEngineFactory } from "../types";

const W = 800;
const H = 600;

// tunables del juego (velocidades, puntos por tamaño/tipo, duraciones de power-up, etc.)

// helpers puros (wrap, dist, rand, randInt, ...)

const CAPTURED_KEYS = new Set([/* teclas que este juego usa */]);

const COLORS = { /* paleta plana, hex/rgba */ };

type InternalStatus = "playing" | "dead" | "gameover"; // nunca "paused" aquí

export const create<Nombre>Engine: GameEngineFactory = (canvas, onState) => {
  const ctxOrNull = canvas.getContext("2d");
  if (!ctxOrNull) throw new Error("2D context not available");
  const ctx = ctxOrNull;

  // input: keys/justPressed + onKeyDown/onKeyUp + window.addEventListener x2

  // clases de entidad declaradas aquí dentro (capturan ctx)

  // estado mutable: let score, lives, level, state: InternalStatus, ...
  let externalPaused = false;
  let rafId: number | null = null;
  let lastTime: number | null = null;

  // spawn/init/next-level/explode/kill — funciones de transición de estado

  function update(dt: number) { /* switch por state, mover/colisionar */ }
  function draw() { /* fillRect fondo, entidades, HUD, overlay condicional */ }

  let lastEmitted: EngineState | null = null;
  function maybeEmit() { /* ver arriba */ }
  function loop(ts: number) { /* ver arriba */ }
  function startLoop() { /* ver arriba */ }

  initGame();
  maybeEmit();
  startLoop();

  const engine: GameEngine = {
    pause() { /* cancela rAF, marca externalPaused, maybeEmit() */ },
    resume() { /* desmarca externalPaused, maybeEmit(), startLoop() */ },
    restart() { /* initGame(), limpia pausa, maybeEmit(), startLoop() si hacía falta */ },
    endNow() { /* state = "gameover", reanuda loop si estaba en pausa para que se vea */ },
    destroy() { /* quita ambos listeners, cancela rAF */ },
  };

  return engine;
};
```

Registro final en `app/games/engines/registry.ts`:

```ts
import { create<Nombre>Engine } from "./<slug>/engine";

export const ENGINES: Record<string, GameEngineFactory> = {
  asteroides: createAsteroidsEngine,
  <slug>: create<Nombre>Engine,
};
```

La clave debe ser exactamente el `id` de la fila insertada en `public.games` — es el único acoplamiento entre catálogo y motor (`app/components/game-player.tsx:18`: `const hasEngine = !!ENGINES[game.id]`).
