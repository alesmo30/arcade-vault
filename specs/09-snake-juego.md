# SPEC 09 — Juego Snake (motor + catálogo + leaderboard)

> **Status:** Aprobado
> **Depends on:** 06-leaderboard-y-catalogo-supabase, 05-asteroides-juego
> **Date:** 2026-07-30
> **Objective:** Diseñar el Snake clásico de Arcade Vault (sin plantilla de referencia en `started-games/`, diseñado desde cero con reglas clásicas + arte de `references/templates/snake-assets/`), registrarlo en el catálogo (`public.games`) y conectarlo al leaderboard real ya existente.

---

## Fuente

No hay plantilla en `references/templates/started-games/` para Snake. La descripción del usuario (crecer al comer fruta, morir al tocar el propio cuerpo) más `references/templates/snake-assets/` (`fruits.png`, hoja 3790×442 px, fondo transparente; `sprites.js` con `SPRITE_ATLAS.fruits`, 22 recortes) son la única fuente concreta. El resto de la mecánica (rejilla, muros, velocidad progresiva, prohibición de giro de 180°) se completa con las reglas del Snake clásico de Nokia, confirmadas por búsqueda web.

---

## Scope

**In:**

- Motor Snake en `app/games/engines/snake/engine.ts` — movimiento por rejilla a tick fijo (no por frame), serpiente que crece al comer fruta, muerte al chocar con muro o con su propio cuerpo, velocidad que aumenta por nivel.
- Registrado en `app/games/engines/registry.ts` bajo la clave `snake`.
- Fila nueva `snake` en `public.games` vía migración (`cat: ARCADE`, `color: green`, `cover: cover-snake`, `sort: 11`).
- Clase `.cover-snake` en `app/globals.css`.
- Asset `fruits.png` copiado a `public/games/snake/fruits.png` y su atlas de recortes portado a una constante TypeScript dentro del motor (basada en `references/templates/snake-assets/sprites.js`).
- Diseño visual del canvas vía `/frontend-design` antes de fijar la paleta (color de serpiente, rejilla, HUD).

**Out (queda para specs futuras):**

- Sonido.
- Controles táctiles/móviles y WASD — solo flechas.
- Power-ups distintos de fruta (velocidad, invencibilidad, etc.), obstáculos internos, modo "sin muros" (wrap-around).
- Multijugador / segunda serpiente.
- Selector de dificultad inicial — el nivel sube automáticamente por progreso, no se elige al empezar.
- Cambios en `game-canvas.tsx`, `game-player.tsx`, `actions.ts`, `queries.ts`, rutas de catálogo/salón de la fama — ya son genéricos, no se tocan.
- Tests automatizados (no hay framework instalado; verificación con Playwright MCP / claude-in-chrome).

---

## Data model

Sin estructuras nuevas — reusa `public.games` y `public.scores` (spec 06). Fila de catálogo (descripción, no SQL ejecutable):

- `id`: `snake`
- `title`: `SNAKE`
- `short`/`long`: texto de card y de detalle, estilo del resto del catálogo (serpiente que crece al comer fruta, muere al chocar consigo misma o con el muro)
- `cat`: `ARCADE`
- `cover`: `cover-snake`
- `color`: `green` (único aún libre entre `cyan`/`asteroides`, `yellow`/`tetris`, `magenta`/`arkanoid`)
- `plays`: `'0'` (arranca sin datos ficticios, igual que el resto)
- `sort`: `11` (siguiente entero libre tras `arkanoid` en 10)

`EngineState` mapeado a la mecánica de Snake:

- `score`: acumulado, +10 fruta común / +25 fruta rara / +50 fruta legendaria.
- `lives`: `1` fijo. Snake clásico no tiene vidas extra — cualquier choque (muro o cuerpo propio) es fin de partida inmediato. Baja a `0` al morir y dispara `status: "gameover"`.
- `level`: `1..10`, sube cada 5 frutas comidas (independiente del tier). Cada nivel reduce el intervalo de tick (acelera la serpiente); no hay tope de "victoria" — el juego termina solo por choque.

---

## Implementation plan

1. **Migración de catálogo.** `supabase/migrations/<ts>_add_game_snake.sql` con la fila de `games` descrita arriba. Aplicar con `mcp__supabase__apply_migration`, verificar con `list_tables`/`execute_sql`.
2. **Portada.** `.cover-snake` en `app/globals.css`, siguiendo el patrón de `.cover-asteroides` (`app/globals.css:801-827`) pero sobre `var(--green)`; motivo gráfico: rejilla oscura con un trazo serpenteante de celdas verdes y una fruta en primer plano.
3. **Asset + motor.**
   - Copiar `references/templates/snake-assets/fruits.png` a `public/games/snake/fruits.png`.
   - Portar `references/templates/snake-assets/sprites.js` (`SPRITE_ATLAS.fruits`, 22 entradas `{x,y,w,h}`) a una constante `FRUIT_ATLAS` dentro de `app/games/engines/snake/engine.ts`.
   - `app/games/engines/snake/engine.ts` contra el contrato de `app/games/engines/types.ts` (ver `references/engine-contract.md` del skill `add-game` para el esqueleto exacto de factory/loop/`maybeEmit`). Canvas lógico 800×600, rejilla 32×24 celdas de 25 px, sin letterboxing.
   - Movimiento: acumulador de tiempo que dispara un "tick" de rejilla cuando supera el intervalo del nivel actual (~0,16 s en nivel 1, decreciendo hasta ~0,055 s en nivel 10); en cada tick la serpiente avanza una celda en la dirección de la cola de input.
   - Input: cola de dirección con buffer de hasta 2 entradas por tick; giro de 180° instantáneo (ej. derecha → izquierda en el mismo tick) se ignora, se conserva la dirección previa.
   - Fruta: una sola en el tablero a la vez, tier elegido por peso (común ~70% / rara ~25% / legendaria ~5%) en cada respawn, posición aleatoria sobre una celda libre (fuera del cuerpo de la serpiente).
   - Crecimiento al comer: común +1 segmento, rara +2, legendaria +3; se añaden en la cola en los siguientes ticks (no de golpe) para mantener el paso de un segmento por tick.
   - Colisión letal: cabeza fuera de la rejilla (choque con muro) o cabeza coincidiendo con cualquier segmento del cuerpo → `lives → 0`, `status: "gameover"`.
   - `CAPTURED_KEYS` = `ArrowUp`/`ArrowDown`/`ArrowLeft`/`ArrowRight`.
   - Carga de `fruits.png` vía `new Image()` fuera del `rAF` crítico; mientras `!img.complete` se dibuja un fallback procedural (círculo neón sólido) en la celda de la fruta, para no bloquear el primer frame ni el `maybeEmit()` inicial.
   - Sin overlay de pausa interno — la pausa la dibuja `game-player.tsx` fuera del canvas. HUD de score/vidas/nivel lo pinta React vía `EngineState`, no se dibuja en el canvas.
   - `maybeEmit()` con throttling, loop con `dt` clamp a 0.05 y `lastTime = null` al reanudar tras pausa, `destroy()` quitando ambos listeners (`keydown`/`keyup`), cancelando el `rAF` pendiente y liberando la referencia a la imagen cargada.
4. **Registro.** Entrada `snake` en `app/games/engines/registry.ts`. A partir de aquí el juego es jugable y GUARDAR PUNTUACIÓN empieza a insertar en `scores` sin más cambios.
5. **Diseño visual.** `/frontend-design` para la paleta neón verde (cuerpo de serpiente, cabeza diferenciada, rejilla de fondo, HUD); aplicar al `COLORS` del motor.
6. **Cierre.** `npm run lint` y `npm run build` limpios.
7. **Verificación.** Sesión Playwright MCP / claude-in-chrome contra los criterios de aceptación.
8. **Confirmación de datos.** `execute_sql` para comprobar la fila de `scores` insertada tras una partida real.

---

## Acceptance criteria

- [ ] `npm run lint` y `npm run build` sin errores ni warnings.
- [ ] `/games` muestra la card SNAKE con portada propia (`.cover-snake`), distinta de `asteroides`, `tetris` y `arkanoid`.
- [ ] `/games/snake` renderiza el detalle; "JUGAR AHORA" lleva a `/games/snake/jugar`.
- [ ] El canvas responde a: `↑`/`↓`/`←`/`→` cambian la dirección de la serpiente, sin scrollear la página.
- [ ] Un giro de 180° en el mismo tick (dirección opuesta a la actual) se ignora — la serpiente no puede chocar consigo misma por una tecla contraria instantánea.
- [ ] La serpiente avanza por rejilla a intervalo fijo (no por frame); el intervalo decrece visiblemente al subir de nivel.
- [ ] Comer fruta común suma 10 puntos y crece 1 segmento; rara suma 25 y crece 2; legendaria suma 50 y crece 3.
- [ ] Solo hay una fruta visible en el tablero a la vez; al comerla aparece otra en una celda libre.
- [ ] El nivel sube automáticamente cada 5 frutas comidas (de cualquier tier), hasta nivel 10.
- [ ] Tocar cualquier borde del tablero termina la partida en `gameover` con la puntuación real acumulada.
- [ ] La cabeza tocando cualquier segmento del propio cuerpo termina la partida en `gameover` con la puntuación real acumulada.
- [ ] El HUD (Puntuación / Vidas / Nivel) refleja el estado real del motor (`lives` siempre 1 mientras esté viva).
- [ ] PAUSA congela el juego (nada se mueve) y muestra el overlay EN PAUSA; REANUDAR continúa sin saltos de posición ni pérdida de la cola de dirección.
- [ ] FIN abre el modal con la puntuación real; JUGAR DE NUEVO reinicia a score 0, serpiente de 3 segmentos en el centro, nivel 1.
- [ ] Salir de la ruta destruye el motor: sin errores en consola, ida y vuelta ×2 verificado.
- [ ] Las teclas capturadas (`↑`/`↓`/`←`/`→`) tienen `preventDefault()` en el listener.
- [ ] Las frutas se dibujan con el sprite de `fruits.png` correspondiente a su tier; si la imagen aún no cargó, se ve el fallback procedural sin que el juego se congele.
- [ ] GUARDAR PUNTUACIÓN inserta en `scores` (confirmado por SQL); la marca aparece en `/salon-de-la-fama`; `plays` incrementa en 1.
- [ ] Sin errores de hidratación en consola en `/games`, `/games/snake`, `/games/snake/jugar`, `/salon-de-la-fama`.
- [ ] A 375 px de ancho el canvas escala dentro del CRT sin desbordar horizontalmente (o el mismo overflow preexistente ya documentado en specs anteriores, no un defecto nuevo de este motor).

---

## Decisions

- **Sí:** diseño desde cero sobre reglas clásicas de Snake (Nokia), sembrado por la descripción del usuario y el arte de `references/templates/snake-assets/`. **No:** portar 1:1 una plantilla de `started-games/` — no existe ninguna para Snake en este repo.
- **Sí:** spritesheet real `fruits.png` copiado a `public/games/snake/` y dibujado con `drawImage` según el atlas portado. **No:** arte 100% procedural como en asteroides/tetris/arkanoid. El usuario aportó explícitamente el asset de frutas y pidió usarlo; es la única desviación consciente de la convención "sin binarios" de specs anteriores.
- **Sí:** movimiento por tick de rejilla acumulando `dt`, no desplazamiento continuo por frame. **No:** movimiento suave px/frame. Es la mecánica que define al Snake clásico (colisión exacta celda contra celda).
- **Sí:** `lives: 1` fijo, cualquier choque termina la partida. **No:** vidas múltiples con reinicio de posición conservando score. Fiel al Snake clásico — no existe la noción de "vida extra" en el original.
- **Sí:** `level` = tramo de velocidad, sube cada 5 frutas, sin techo de "victoria". **No:** nivel derivado de longitud o de patrones de tablero (no aplica, Snake no tiene niveles de diseño como Arkanoid). Snake termina solo por choque, no por completar algo.
- **Sí:** 3 tiers de fruta por valor y crecimiento (común/rara/legendaria) usando las 22 frutas del atlas. **No:** una sola fruta con valor fijo. Aprovecha el atlas completo aportado y añade variedad de riesgo/recompensa sin apartarse de "una fruta a la vez, aparición aleatoria" que pidió el usuario.
- **Sí:** cola de dirección con buffer de 2 entradas y bloqueo de giro de 180° en el mismo tick. **No:** aplicar la última tecla pulsada sin filtro. Evita la muerte instantánea injusta por un giro contrario a la dirección actual, comportamiento estándar en implementaciones modernas del clásico.
- **Sí:** tocar el borde del tablero es game over (clásico). **No:** wrap-around. Es la variante más reconocible y la que pidió el usuario implícitamente ("el tradicional juego de Snake").
- **Sí:** controles solo teclado (flechas). **No:** WASD ni táctil. Mismo criterio que spec 08 — un único patrón de input probado en el contrato del motor.
- **Sí:** integración vía registry consultado por `id`. **No:** componente dedicado por ruta. Heredado del patrón general de specs 05/06/08.
- **Sí:** clase CSS nueva `.cover-snake` con `color: green`. **No:** reusar la portada o el color de otro juego. `green` es el único color de catálogo aún libre.

---

## Risks

| Risk                                                                                  | Mitigation                                                                                                                               |
| ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Fuga de `requestAnimationFrame`/listeners al navegar fuera de la ruta                 | `destroy()` obligatorio; criterio de aceptación explícito de ida-y-vuelta con consola limpia                                             |
| `onState` disparado en cada frame provoca re-renders excesivos en React               | `maybeEmit()` solo emite cuando cambia score/vidas/nivel/status                                                                          |
| `fruits.png` (572 KB) no cargado a tiempo para el primer frame                        | Carga asíncrona con `new Image()` fuera del loop crítico; fallback procedural (círculo neón) mientras `!complete`                        |
| Input perdido o mal aplicado entre ticks (varias teclas en el mismo intervalo)        | Cola de dirección con buffer de 2 entradas, se consume una por tick                                                                      |
| Giro de 180° instantáneo mata a la serpiente contra su propio segundo segmento        | Se ignora cualquier input que sea el opuesto exacto de la dirección actual                                                               |
| Respawn de fruta en tablero casi lleno (pocas celdas libres) degrada a búsqueda lenta | Recorrido acotado de celdas libres del tablero (32×24 = 768 celdas máx.); si no queda ninguna, se trata como fin de partida (`gameover`) |
| Velocidad de nivel 10 demasiado alta para que el input llegue a tiempo                | Intervalo mínimo acotado (~0,055 s) en vez de decrecer sin límite                                                                        |

---

## Qué **no** está en este spec

- Sonido, controles táctiles/móviles, WASD.
- Power-ups distintos de fruta, obstáculos internos, modo sin muros (wrap-around).
- Multijugador / segunda serpiente.
- Selector de dificultad inicial.
- Cambios en auth, `/acerca-de`, home.
- Suite de tests automatizada y comiteada.

Cada uno de estos, si se implementa, va en su propio spec.
