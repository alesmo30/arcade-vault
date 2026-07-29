# SPEC 05 — Juego Asteroides (primer motor real)

> **Status:** Implemented
> **Depends on:** 04-supabase-connection
> **Date:** 2026-07-29
> **Objective:** Portar el Asteroids canvas de `references/templates/started-games/02-asteroids/game.js` a un motor TypeScript montado dentro del chasis CRT existente en `/games/asteroides/jugar`, conectado a un HUD real, mediante una arquitectura de registry que permita enchufar los demás juegos del catálogo en specs futuras sin refactor.

---

## Scope

**In:**

- Motor Asteroides portado a TypeScript en `app/games/engines/asteroides/engine.ts` — clases `Bullet`, `Asteroid`, `Ship`, `Particle`, `PowerUp`, loop `update(dt)`/`draw()`, wrap toroidal, 3 vidas, invencibilidad con parpadeo, niveles (`3 + level` asteroides), partículas, power-up 3x (`POWERUP_DROP_CHANCE 0.15`, garantizado a los 5 kills, `POWERUP_DURATION 5s`).
- El motor no toca el DOM global: recibe el `canvas` en el constructor, registra sus listeners de teclado en `mount()` y los quita en `destroy()`; expone `pause()`, `resume()`, `restart()`, `endNow()` y un callback `onState({score, lives, level, status})`.
- Registry `app/games/engines/registry.ts`: `Record<string, GameEngineFactory>` con una sola entrada, `asteroides`.
- `app/components/game-player.tsx`: si `registry[game.id]` existe, renderiza `<GameCanvas>` (nuevo componente cliente) en vez de `.game-arena`; HUD y modal leen el estado real. Si no existe, comportamiento actual sin cambios.
- Nueva entrada `asteroides` en `app/data/games.ts` (cat `SHOOTER`, `cover: "cover-asteroides"`, color a definir en diseño) + clase `.cover-asteroides` en `app/globals.css`.
- Captura de teclado acotada al canvas/contenedor con foco, y `preventDefault` en flechas/espacio para que la página no scrollee durante la partida.
- Diseño visual del canvas vía `/frontend-design` antes de fijar la paleta.

**Out (queda para specs futuras):**

- Motores para los otros 7 juegos (`rocas` incluido) — siguen con la arena maqueta.
- Persistencia real de puntuación (Supabase/localStorage), tabla `scores`, RLS, leaderboard real.
- Controles táctiles/móvil y WASD.
- Sonido.
- Cambios en auth, `/salon-de-la-fama`, home o `/acerca-de`.
- Tests automatizados (no hay framework instalado; verificación con Playwright MCP como en specs 02-03).

---

## Data model

Sin estructuras persistidas nuevas. Dos tipos en TypeScript:

```ts
// app/games/engines/types.ts
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

Más una entrada `Game` en el array `GAMES` existente (mismo tipo de `app/data/types.ts`, sin cambios al tipo).

---

## Implementation plan

1. **Tipos + registry vacío.** `app/games/engines/types.ts` y `registry.ts` (mapa vacío). Nada cambia en runtime.
2. **Motor.** `app/games/engines/asteroides/engine.ts` — port 1:1 de `game.js` a TS, encapsulado en una factory (sin globales, sin `document.getElementById`), colores aún los de la referencia. Registrarlo en `registry.ts`.
3. **Componente canvas.** `app/games/engines/game-canvas.tsx` (`"use client"`): `<canvas width={800} height={600}>` a `width:100%` dentro de `.crt-screen`, monta el motor en `useEffect`, lo destruye en cleanup, propaga `onState` hacia arriba.
4. **Conectar `GamePlayer`.** Detecta motor por `game.id`; HUD lee `EngineState` real; PAUSA llama `pause/resume` y mantiene el overlay actual; FIN llama `endNow()`; el modal usa el score real; JUGAR DE NUEVO llama `restart()`. Rama maqueta intacta para los otros juegos.
5. **Catálogo + portada.** Entrada `asteroides` en `games.ts`, clase `.cover-asteroides` en `globals.css` siguiendo el patrón de `.cover-rocas` (`app/globals.css:477-494`).
6. **Diseño visual.** `/frontend-design` para la paleta neón del canvas; aplicar al `draw()` del motor (nave, asteroides, balas, partículas, power-up, HUD interno si se conserva).
7. **Cierre.** `npm run lint` y `npm run build` limpios.
8. **Verificación.** Sesión Playwright MCP contra los criterios de aceptación.

---

## Acceptance criteria

- [x] `npm run lint` y `npm run build` sin errores ni warnings.
- [x] `/games` muestra 9 juegos; la card ASTEROIDES tiene su propia portada, distinta de ROCAS.
- [x] `/games/asteroides` renderiza la página de detalle; "JUGAR AHORA" lleva a `/games/asteroides/jugar`.
- [x] En `/games/asteroides/jugar` el canvas dibuja nave + asteroides y responde a `←` `→` (rotar), `↑` (propulsar), `Espacio` (disparar).
- [x] Disparar a un asteroide grande lo parte en dos medianos y suma 20 puntos; mediano → 2 pequeños y 50; pequeño desaparece y suma 100.
- [x] El HUD (Puntuación / Vidas / Nivel) refleja el estado real del motor, no `28450`/`3`/`01`.
- [x] Chocar con un asteroide resta una vida y reaparece la nave con parpadeo de invencibilidad; a las 3 muertes aparece el modal FIN DEL JUEGO con la puntuación real.
- [x] Destruir todos los asteroides sube de nivel y respawnea más asteroides.
- [x] Aparece el power-up 3x y al recogerlo la nave dispara triple durante ~5 s.
- [x] PAUSA congela el juego (nada se mueve) y muestra el overlay EN PAUSA; REANUDAR continúa sin saltos de posición.
- [x] FIN abre el modal con la puntuación real acumulada; JUGAR DE NUEVO reinicia a score 0, 3 vidas, nivel 1.
- [x] Salir de la ruta (SALIR / VOLVER AL VAULT) destruye el motor: no quedan listeners ni `requestAnimationFrame` corriendo (verificado sin errores en consola al navegar ida y vuelta 2 veces).
- [x] Pulsar flechas/espacio durante la partida no scrollea la página.
- [x] Regresión: `/games/bloque-buster/jugar` y el resto de juegos siguen mostrando la arena maqueta con su comportamiento actual.
- [x] Sin errores de hidratación en consola en `/games`, `/games/asteroides`, `/games/asteroides/jugar`.
- [x] A 375 px de ancho el canvas escala dentro del CRT sin desbordar horizontalmente.
- [x] Verificado vía Playwright MCP: `npm run dev`, recorrer `/games` → card ASTEROIDES → detalle → JUGAR AHORA → jugar la partida comprobando HUD, split, power-up, pausa, muerte y modal → JUGAR DE NUEVO → SALIR → volver a entrar (consola limpia) → regresión en `/games/bloque-buster/jugar`. Sesión manual, sin test file comiteado.

---

## Decisions

- **Sí:** nueva entrada `asteroides` en el catálogo. **No:** reusar o renombrar `rocas`. `rocas` sigue como maqueta de otro spec; evita romper links/`generateStaticParams` ya cacheados de specs previas, y dos entradas conviven sin colisión de id.
- **Sí:** integración vía registry (`app/games/engines/registry.ts`) consultado por `id` de juego. **No:** componente dedicado por ruta ni reemplazo total de `GamePlayer`. Prepara los 7 juegos restantes sin refactor futuro, y no rompe la maqueta de los juegos sin motor.
- **Sí:** port 1:1 de `game.js`, power-up 3x incluido. **No:** recorte del power-up. La referencia ya está balanceada y probada; recortarla es trabajo extra sin beneficio.
- **Sí:** HUD/modal con datos reales del motor; "GUARDAR PUNTUACIÓN" sigue siendo el toast maqueta actual. **No:** persistencia real (Supabase o localStorage) en este spec. Spec 04 sólo dejó la conexión con Supabase lista; tabla/esquema de scores es una decisión con su propio spec.
- **Sí:** motor en `app/games/engines/`. **No:** `lib/games/` ni un archivo único en `components`. Vive junto a la ruta que lo consume; el registry por id crece ahí mismo cuando se sumen más motores.
- **Sí:** estética "Neón Arcade Vault" diseñada con `/frontend-design`, no el wireframe blanco original. **No:** blanco puro ni blanco+glow. Coherente con el resto del sitio (CRT, paleta de botones), evita que el juego se vea "pegado" en vez de integrado.
- **Sí:** los botones PAUSA/FIN/JUGAR DE NUEVO controlan el motor real (`pause/resume/endNow/restart`). **No:** dejarlos operando sólo el estado React desincronizado, ni eliminar el botón FIN. Mantiene el overlay de pausa existente funcional y consistente con lo que el jugador ve en pantalla.
- **Sí:** clase CSS nueva `.cover-asteroides`, siguiendo el patrón de `.cover-rocas`. **No:** reusar `.cover-rocas` ni renderizar un frame real del canvas como miniatura. Identidad visual propia sin el costo de generar una miniatura dinámica.

---

## Risks

| Risk                                                                                                                     | Mitigation                                                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Fuga de `requestAnimationFrame`/listeners al navegar fuera de la ruta                                                    | `destroy()` obligatorio en el cleanup del `useEffect` de `GameCanvas`; criterio de aceptación explícito de ida-y-vuelta con consola limpia |
| `onState` disparado en cada frame provoca ~60 re-renders/s en React                                                      | El motor sólo invoca `onState` cuando cambian score, vidas, nivel o status — no en cada frame de `draw()`                                  |
| El canvas 800×600 se deforma dentro de `.crt-screen`                                                                     | Resolución interna del canvas fija; el CSS lo escala con `width:100%` dentro de `.crt-screen`, que ya es `aspect-ratio: 4/3`               |
| El port a TypeScript `strict` choca con las variables de estado sueltas del original (`let ship, bullets, ...` globales) | El motor se encapsula en una clase o closure con campos tipados en vez de globales de módulo                                               |
| Canvas negro puro desentona con el marco neón del vault                                                                  | Paso 6 del plan usa `/frontend-design` para fijar la paleta antes de tocar el `draw()` del motor                                           |

---

## Qué **no** está en este spec

- Motores para `rocas` ni los otros 6 juegos restantes.
- Persistencia real de puntuación, tabla `scores`, RLS o leaderboard real.
- Controles táctiles, móviles o WASD.
- Sonido.
- Cambios en auth, `/salon-de-la-fama`, home o `/acerca-de`.
- Suite de tests automatizada y comiteada.

Cada uno de estos, si se implementa, va en su propio spec.
