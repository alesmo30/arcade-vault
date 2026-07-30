# SPEC 07 — Juego Tetris (motor + catálogo + leaderboard)

> **Status:** Approved
> **Depends on:** 06-leaderboard-y-catalogo-supabase, 05-asteroides-juego
> **Date:** 2026-07-30
> **Objective:** Portar el Tetris de `references/templates/started-games/03-tetris/game.js` a un motor TypeScript en `app/games/engines/tetris/engine.ts`, registrarlo en el catálogo (`public.games`) y conectarlo al leaderboard real ya existente.

---

## Scope

**In:**

- Motor Tetris en `app/games/engines/tetris/engine.ts` — tablero 10×20, 7 piezas estándar (I O T S Z J L) con rotación por transposición + wall-kicks `[0,±1,±2]`, colisión AABB en grilla, limpieza de líneas, ghost piece, hard/soft drop, aceleración por nivel.
- Registrado en `app/games/engines/registry.ts` bajo la clave `tetris`.
- Fila nueva `tetris` en `public.games` vía migración (`cat: PUZZLE`, `color: yellow`, `cover: cover-tetris`, `sort: 9`).
- Clase `.cover-tetris` en `app/globals.css`.
- Diseño visual del canvas vía `/frontend-design` antes de fijar la paleta.

**Out (queda para specs futuras):**

- La maqueta `caida` — no se toca ni se borra; sigue con la arena maqueta actual, igual que `rocas` tras el port de Asteroides en spec 05.
- Sonido, controles táctiles/móvil y WASD.
- Hold-piece, previsualización de más de una pieza siguiente, randomizador "7-bag" (la plantilla usa `Math.random()` uniforme sobre 7 tipos) y sistema SRS completo de wall-kicks (se porta el kick simplificado `[0,±1,±2]` de la plantilla, no el estándar oficial de Tetris).
- La pieza "tuerca" (índice 8 de la plantilla, anillo 3×3 gris) — se descarta; solo las 7 piezas estándar.
- Cambios en `game-canvas.tsx`, `game-player.tsx`, `actions.ts`, `queries.ts`, rutas de catálogo/salón de la fama — ya son genéricos, no se tocan.
- Tests automatizados (no hay framework instalado; verificación con Playwright MCP / claude-in-chrome).

---

## Data model

Sin estructuras nuevas — reusa `public.games` y `public.scores` (spec 06). Fila de catálogo (descripción, no SQL ejecutable):

- `id`: `tetris`
- `title`: `TETRIS`
- `short`/`long`: texto de card y de detalle, estilo del resto del catálogo (piezas cayendo, limpiar líneas antes de que el tablero se llene)
- `cat`: `PUZZLE`
- `cover`: `cover-tetris`
- `color`: `yellow`
- `plays`: `'0'` (arranca sin datos ficticios, igual que el resto)
- `sort`: `9` (siguiente entero libre tras `asteroides` en 8)

`EngineState` mapeado a la mecánica de Tetris:

- `score`: puntuación acumulada de la plantilla — `LINE_SCORES = [0, 100, 300, 500, 800]` multiplicado por `level` al limpiar líneas, +2 por celda en hard drop, +1 por fila en soft drop.
- `lives`: **1 vida fija.** Tetris no tiene vidas naturales; el tope-out (pieza nueva no cabe al spawnear) la pone directamente en 0 y dispara `status: "gameover"`. El HUD de Vidas muestra 1 mientras se juega y 0 al terminar, sin fingir una mecánica de vidas múltiples.
- `level`: `floor(lines / 10) + 1`, igual que la plantilla; determina `dropInterval = max(100, 1000 − (level−1)×90)`.
- `lines` (líneas limpiadas) **no tiene campo propio en `EngineState`** — se dibuja como texto dentro del panel lateral del canvas, no en el HUD genérico de React.

---

## Implementation plan

1. **Migración de catálogo.** `supabase/migrations/<ts>_add_game_tetris.sql` con la fila de `games` descrita arriba. Aplicar con `mcp__supabase__apply_migration`, verificar con `list_tables`/`execute_sql`.
2. **Portada.** `.cover-tetris` en `app/globals.css`, siguiendo el patrón de `.cover-asteroides` (`app/globals.css:801-827`) pero sobre `var(--yellow)`; motivo gráfico: bloques apilados / una línea horizontal iluminada a punto de limpiarse.
3. **Motor.** `app/games/engines/tetris/engine.ts` — port 1:1 de `game.js` (332 líneas) contra el contrato de `app/games/engines/types.ts`. Tablero lógico 10×20 a `BLOCK 30px` (300×600) centrado dentro del lienzo lógico 800×600 del motor; el espacio sobrante a los lados se usa para un panel dibujado en canvas con SIGUIENTE PIEZA, LÍNEAS y NIVEL (reemplaza los elementos DOM `#score`/`#lines`/`#level`/`#next-canvas` de la plantilla, que no existen en el contrato de Arcade Vault). Rotación `rotateCW` + `tryRotate` con kicks `[0,±1,±2]`, `collide`, `clearLines` de abajo hacia arriba, ghost piece a `alpha 0.2` vía `ghostY()`, acumulador `dropAccum` sobre el `dt` clampado del loop estándar del contrato. `KeyP` de la plantilla se retira — la pausa es 100% externa (`externalPaused`), sin atajo interno duplicado. Ver `references/engine-contract.md` del skill `add-game` para el esqueleto exacto de factory/loop/`maybeEmit`.
4. **Registro.** Entrada `tetris` en `app/games/engines/registry.ts`. A partir de aquí el juego es jugable y GUARDAR PUNTUACIÓN empieza a insertar en `scores` sin más cambios.
5. **Diseño visual.** `/frontend-design` para la paleta neón; aplicar al `COLORS` del motor (7 piezas + grilla + panel lateral).
6. **Cierre.** `npm run lint` y `npm run build` limpios.
7. **Verificación.** Sesión Playwright MCP / claude-in-chrome contra los criterios de aceptación.
8. **Confirmación de datos.** `execute_sql` para comprobar la fila de `scores` insertada tras una partida real.

---

## Acceptance criteria

- [x] `npm run lint` y `npm run build` sin errores ni warnings.
- [x] `/games` muestra la card TETRIS con portada propia (`.cover-tetris`), distinta de `caida` y del resto.
- [x] `/games/tetris` renderiza el detalle; "JUGAR AHORA" lleva a `/games/tetris/jugar`.
- [x] El canvas responde a: `←`/`→` mover pieza, `↓` soft drop (+1 punto/fila), `↑` o `X` rotar con wall-kicks, `Espacio` hard drop (+2 puntos/celda). Verificado hard drop (+2/celda, score 0→18); resto validado por lectura de código (mismo patrón `collide`/`tryRotate` de la plantilla).
- [ ] Limpiar una línea suma `LINE_SCORES[n] × level`; el ghost piece se ve semitransparente. No se llegó a completar una línea en la sesión de verificación (partida corta); lógica idéntica a la plantilla, revisada por lectura de código, no observada en vivo.
- [x] El HUD (Puntuación / Vidas / Nivel) refleja el estado real del motor; el panel lateral del canvas muestra SIGUIENTE PIEZA y LÍNEAS limpiadas.
- [ ] El nivel sube cada 10 líneas limpiadas y la velocidad de caída aumenta en consecuencia. No observado en vivo (requiere limpiar 10 líneas); lógica revisada por código.
- [x] El tope-out pone `lives` en 0 y dispara el modal FIN DEL JUEGO con la puntuación real. Verificado vía `endNow()` (botón FIN); mismo código que ejecuta `spawn()` en un tope-out real.
- [x] PAUSA congela el juego y muestra el overlay EN PAUSA; REANUDAR continúa sin saltos de posición.
- [x] FIN abre el modal con la puntuación real; JUGAR DE NUEVO reinicia a score 0, 1 vida, nivel 1, tablero vacío.
- [x] Salir de la ruta destruye el motor: sin errores en consola, ida y vuelta ×2 verificado.
- [x] Las teclas capturadas (flechas, `X`, Espacio) tienen `preventDefault()` en el listener (verificado por código, igual patrón que `asteroides/engine.ts`).
- [x] GUARDAR PUNTUACIÓN inserta en `scores` (confirmado por SQL: score 18, INVITADO); la marca aparece en `/salon-de-la-fama` (#01 INVITADO 18); `plays` incrementó de 0 a 1.
- [x] Regresión: `/games/caida/jugar` sigue mostrando la arena maqueta (28.450 / 3 vidas fijas) sin cambios.
- [x] Sin errores de hidratación en consola en `/games`, `/games/tetris`, `/games/tetris/jugar`, `/salon-de-la-fama`, `/games/caida/jugar`.
- [ ] A 375 px de ancho el canvas desborda 28px horizontalmente (`scrollWidth` 403 vs `clientWidth` 375) — **igual en `/games/asteroides/jugar`** (mismo overflow, ya en producción). Es un problema preexistente del chasis CRT genérico (`game-canvas.tsx`/CSS compartido), no introducido por este motor; queda fuera del scope de este spec, a reportar aparte.

---

## Decisions

- **Sí:** fila de catálogo nueva `tetris`. **No:** enchufar el motor a la fila existente `caida`. Sigue el precedente de spec 05 (`asteroides` nuevo, `rocas` intacto); evita romper links/textos ya cacheados de `caida` y permite comparar ambas cards sin colisión de id.
- **Sí:** `color: yellow`, `cat: PUZZLE`. **No:** magenta (ya usado por `caida`) ni cyan (ya usado por `asteroides`/`bloque-buster`). Distingue visualmente la card en `/games`.
- **Sí:** `lives = 1` fija, a 0 en tope-out. **No:** simular 3 vidas con 3 tableros. Tetris no tiene vidas naturales; inventar una mecánica de reinicio de tablero cambiaría el juego original sin pedido explícito.
- **Sí:** port de las 7 piezas estándar únicamente. **No:** la pieza "tuerca" (índice 8) de la plantilla. Es una variante propia de la plantilla, no Tetris clásico, y complica el balance sin que se haya pedido.
- **Sí:** tablero 300×600 centrado en el lienzo lógico 800×600 con panel lateral dibujado en el mismo canvas (SIGUIENTE/LÍNEAS/NIVEL). **No:** segundo `<canvas>` para la pieza siguiente. El contrato de motor de Arcade Vault solo admite un canvas por juego.
- **Sí:** retirar el atajo `KeyP` de pausa. **No:** mantenerlo en paralelo al botón PAUSA externo. `"paused"` es estado externo por contrato; un atajo interno duplicado abriría una segunda fuente de verdad desincronizable sin tocar `game-player.tsx` (fuera de scope).
- **Sí:** integración vía registry consultado por `id`. **No:** componente dedicado por ruta. Heredado del patrón general de spec 05/06, ya probado con Asteroides.
- **Sí:** clase CSS nueva `.cover-tetris`. **No:** reusar `.cover-tetro` (la de `caida`). Identidad visual propia vía CSS puro, mismo criterio que `.cover-asteroides` frente a `.cover-rocas`.

---

## Risks

| Risk                                                                                           | Mitigation                                                                                                            |
| ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Fuga de `requestAnimationFrame`/listeners al navegar fuera de la ruta                          | `destroy()` obligatorio; criterio de aceptación explícito de ida-y-vuelta con consola limpia                          |
| `onState` disparado en cada frame provoca re-renders excesivos en React                        | `maybeEmit()` solo emite cuando cambia score/vidas/nivel/status                                                       |
| Reanudar tras pausa con `dropAccum` acumulado o un `dt` gigante provoca una caída instantánea  | `lastTime = null` al reiniciar el loop (`startLoop()`), y `dropAccum` no avanza mientras `externalPaused` está activo |
| Tablero angosto (300×600) dentro de un lienzo lógico ancho (800×600) se ve descentrado o vacío | Layout centrado con panel lateral informativo dibujado en el mismo canvas, sin cambiar el tamaño del elemento canvas  |
| `lines` no tiene campo propio en `EngineState` y podría "perderse" del HUD                     | Se dibuja explícitamente en el panel lateral del canvas junto a SIGUIENTE PIEZA, no depende del HUD genérico de React |

---

## Qué **no** está en este spec

- La maqueta `caida` — no se toca ni se elimina.
- Sonido, controles táctiles/móviles, WASD.
- Hold-piece, cola de más de una pieza siguiente, randomizador 7-bag, SRS oficial completo.
- La pieza "tuerca" de la plantilla.
- Cambios en auth, `/acerca-de`, home.
- Suite de tests automatizada y comiteada.

Cada uno de estos, si se implementa, va en su propio spec.
