# SPEC 08 — Juego Arkanoid (motor + catálogo + leaderboard)

> **Status:** Approved
> **Depends on:** 06-leaderboard-y-catalogo-supabase, 05-asteroides-juego
> **Date:** 2026-07-30
> **Objective:** Portar el Arkanoid de `references/templates/started-games/04-arkanoid/game.js` a un motor TypeScript en `app/games/engines/arkanoid/engine.ts`, registrarlo en el catálogo (`public.games`) y conectarlo al leaderboard real ya existente.

---

## Scope

**In:**

- Motor Arkanoid en `app/games/engines/arkanoid/engine.ts` — paleta (81×14 px) controlada por teclado, bola con colisión AABB (no circular), 6×10 bloques de `64×24` px con origen centrado en `y=80`, 3 vidas, 5 niveles portados de `levels.js` (parrilla completa, pirámide centrada, tablero de ajedrez, filas con huecos, marco+cruz) con multiplicadores de velocidad `1.00 / 1.10 / 1.21 / 1.33 / 1.46`, 10 puntos por bloque destruido, partículas de explosión procedurales al romper un bloque.
- Registrado en `app/games/engines/registry.ts` bajo la clave `arkanoid`.
- Fila nueva `arkanoid` en `public.games` vía migración (`cat: ARCADE`, `color: magenta`, `cover: cover-arkanoid`, `sort: 10`).
- Clase `.cover-arkanoid` en `app/globals.css`.
- Diseño visual del canvas vía `/frontend-design` antes de fijar la paleta.

**Out (queda para specs futuras):**

- Sonido — la plantilla usa `ball-bounce.mp3`/`break-sound.mp3`; se omiten, igual que el resto del catálogo (decisión spec 05).
- Control por mouse, táctil/móvil y WASD — solo `←`/`→`.
- Spritesheet binario (`spritesheet-breakout.png`) — el arte se porta procedural/vectorial, sin assets copiados a `public/`.
- Selector de nivel clicable en el overlay de pausa (botones 1–5 de la plantilla) — la pausa es 100 % externa por contrato.
- Power-ups, bloques de varios golpes u otras mecánicas no presentes en la plantilla original.
- Cambios en `game-canvas.tsx`, `game-player.tsx`, `actions.ts`, `queries.ts`, rutas de catálogo/salón de la fama — ya son genéricos, no se tocan.
- Tests automatizados (no hay framework instalado; verificación con Playwright MCP / claude-in-chrome).

---

## Data model

Sin estructuras nuevas — reusa `public.games` y `public.scores` (spec 06). Fila de catálogo (descripción, no SQL ejecutable):

- `id`: `arkanoid`
- `title`: `ARKANOID`
- `short`/`long`: texto de card y de detalle, estilo del resto del catálogo (paleta, bola, romper hileras de bloques antes de perder las 3 vidas)
- `cat`: `ARCADE`
- `cover`: `cover-arkanoid`
- `color`: `magenta`
- `plays`: `'0'` (arranca sin datos ficticios, igual que el resto)
- `sort`: `10` (siguiente entero libre tras `tetris` en 9)

`EngineState` mapeado a la mecánica de Arkanoid:

- `score`: acumulado entre niveles, +10 por bloque destruido (igual que la plantilla).
- `lives`: 3 al iniciar, −1 cada vez que la bola cae bajo `y > H`; a 0 dispara `status: "gameover"`.
- `level`: 1..5, avanza automáticamente al destruir el último bloque vivo del nivel actual, aumentando la velocidad de la bola según el multiplicador de ese nivel. Limpiar el nivel 5 también dispara `status: "gameover"` (con la puntuación real acumulada) — no existe un estado `"win"` separado en el contrato de `EngineState`.

---

## Implementation plan

1. **Migración de catálogo.** `supabase/migrations/<ts>_add_game_arkanoid.sql` con la fila de `games` descrita arriba. Aplicar con `mcp__supabase__apply_migration`, verificar con `list_tables`/`execute_sql`.
2. **Portada.** `.cover-arkanoid` en `app/globals.css`, siguiendo el patrón de `.cover-asteroides` (`app/globals.css:801-827`) pero sobre `var(--magenta)`; motivo gráfico: hileras de bloques de colores con paleta y bola en primer plano.
3. **Motor.** `app/games/engines/arkanoid/engine.ts` — port de `game.js` (268 líneas) + `levels.js` (50 líneas) contra el contrato de `app/games/engines/types.ts`. Canvas lógico 800×600, igual que el nativo de la plantilla (sin letterboxing). `LEVELS` pasa a ser una constante dentro del propio archivo del motor (en la plantilla vive en `levels.js` cargado como script global aparte). `CAPTURED_KEYS` = `ArrowLeft`/`ArrowRight`. Colisión bola-bloque AABB tal como en la plantilla (`collideAABB`), no la colisión circular de `asteroides/engine.ts`. Rebote en paleta con ángulo según el punto de impacto respecto al centro de la paleta (desviación consciente frente al `vy = -vy` plano de la plantilla — ver Decisions). Saque de bola automático al iniciar nivel o tras perder vida, igual que la plantilla. Explosión de bloque como partículas procedurales (no los 4 frames de sprite de `EXPLOSION_FRAMES`). Sin overlay de pausa interno ni selector de nivel — la pausa la dibuja `game-player.tsx` fuera del canvas. HUD de score/vidas/nivel lo pinta React vía `EngineState`, no se dibuja en el canvas (a diferencia de la plantilla, que lo hacía con `fillText`). `maybeEmit()` con throttling, loop con `dt` clamp a 0.05 y `lastTime = null` al reanudar tras pausa, `destroy()` quitando ambos listeners (`keydown`/`keyup`) y cancelando el `rAF` pendiente. Ver `references/engine-contract.md` del skill `add-game` para el esqueleto exacto de factory/loop/`maybeEmit`.
4. **Registro.** Entrada `arkanoid` en `app/games/engines/registry.ts`. A partir de aquí el juego es jugable y GUARDAR PUNTUACIÓN empieza a insertar en `scores` sin más cambios.
5. **Diseño visual.** `/frontend-design` para la paleta neón; aplicar al `COLORS` del motor (6 colores de fila de bloques heredados de `rowColors1`/`rowColors2`/`rowColors4` de la plantilla + paleta + bola + partículas).
6. **Cierre.** `npm run lint` y `npm run build` limpios.
7. **Verificación.** Sesión Playwright MCP / claude-in-chrome contra los criterios de aceptación.
8. **Confirmación de datos.** `execute_sql` para comprobar la fila de `scores` insertada tras una partida real.

---

## Acceptance criteria

- [ ] `npm run lint` y `npm run build` sin errores ni warnings.
- [ ] `/games` muestra la card ARKANOID con portada propia (`.cover-arkanoid`), distinta de `asteroides` y `tetris`.
- [ ] `/games/arkanoid` renderiza el detalle; "JUGAR AHORA" lleva a `/games/arkanoid/jugar`.
- [ ] El canvas responde a: `←`/`→` mueven la paleta, sin scrollear la página.
- [ ] La bola rebota en los muros (izquierda, derecha, arriba), en la paleta (con ángulo según el punto de impacto) y en los bloques (colisión AABB).
- [ ] Cada bloque destruido suma 10 puntos y dispara una animación de partículas.
- [ ] El nivel avanza automáticamente al vaciar el tablero, la bola acelera según el multiplicador del siguiente nivel (1.00 → 1.46), y el patrón de bloques corresponde al nivel (parrilla, pirámide, ajedrez, filas con huecos, marco+cruz).
- [ ] La bola cayendo bajo el borde inferior resta una vida y se repone automáticamente si quedan vidas; a 0 vidas dispara `gameover`.
- [ ] Limpiar el nivel 5 también termina la partida en `gameover` con la puntuación real acumulada.
- [ ] El HUD (Puntuación / Vidas / Nivel) refleja el estado real del motor.
- [ ] PAUSA congela el juego (nada se mueve) y muestra el overlay EN PAUSA; REANUDAR continúa sin saltos de posición ni de trayectoria de la bola.
- [ ] FIN abre el modal con la puntuación real; JUGAR DE NUEVO reinicia a score 0, 3 vidas, nivel 1, tablero del nivel 1 completo.
- [ ] Salir de la ruta destruye el motor: sin errores en consola, ida y vuelta ×2 verificado.
- [ ] Las teclas capturadas (`←`/`→`) tienen `preventDefault()` en el listener.
- [ ] GUARDAR PUNTUACIÓN inserta en `scores` (confirmado por SQL); la marca aparece en `/salon-de-la-fama`; `plays` incrementa en 1.
- [ ] Sin errores de hidratación en consola en `/games`, `/games/arkanoid`, `/games/arkanoid/jugar`, `/salon-de-la-fama`.
- [ ] A 375 px de ancho el canvas escala dentro del CRT; si desborda horizontalmente, es el mismo overflow preexistente ya documentado en `specs/07-tetris-juego.md` (chasis CRT genérico), no un defecto nuevo de este motor.

---

## Decisions

- **Sí:** arte procedural vectorial (rectángulos/gradientes neón, partículas para explosiones). **No:** copiar `spritesheet-breakout.png` a `public/` y dibujar con `drawImage`. Mantiene el estilo consistente con `asteroides/engine.ts` y evita carga asíncrona de un asset binario antes del primer frame.
- **Sí:** controles solo teclado `←`/`→`. **No:** `mousemove` sobre el canvas de la plantilla. Es el único patrón de input ya probado en el contrato del motor; añadir mouse introduce un tipo de listener que ningún motor actual usa.
- **Sí:** limpiar los 5 niveles dispara `status: "gameover"` con la puntuación real. **No:** un estado `"win"` separado. `EngineState` no contempla victoria como estado distinto de fin de partida; el modal genérico de fin ya muestra y permite guardar la puntuación.
- **Sí:** `id: arkanoid`, `color: magenta`, `cat: ARCADE`, `sort: 10`. **No:** cyan (ya usado por `asteroides`) ni yellow (ya usado por `tetris`). Distingue visualmente la card en `/games`; `ARCADE` porque no encaja como `PUZZLE`, `SHOOTER` ni `VERSUS`.
- **Sí:** saque de bola automático al iniciar nivel o tras perder vida, igual que la plantilla. **No:** bola pegada a la paleta esperando una tecla de lanzamiento. Port fiel sin sub-estado adicional ni tecla capturada extra.
- **Sí:** ángulo de rebote en la paleta según el punto de impacto respecto al centro (Arkanoid clásico). **No:** el `vy = -vy` plano de la plantilla. Desviación consciente: el rebote fijo de la plantilla produce trayectorias repetitivas y riesgo de bucles; dar control direccional al jugador es estándar del género y evita ese riesgo sin cambiar el resto de la mecánica.
- **Sí:** retirar el selector de nivel clicable del overlay de pausa. **No:** mantenerlo en paralelo al overlay externo de `game-player.tsx`. La pausa es estado externo por contrato; un selector de nivel accesible en pausa permitiría farmear/saltar niveles, invalidando el leaderboard.
- **Sí:** integración vía registry consultado por `id`. **No:** componente dedicado por ruta. Heredado del patrón general de spec 05/06, ya probado con Asteroides y Tetris.
- **Sí:** clase CSS nueva `.cover-arkanoid`. **No:** reusar la portada de otro juego. Identidad visual propia vía CSS puro, mismo criterio que `.cover-asteroides`/`.cover-tetris`.

---

## Risks

| Risk                                                                                                                       | Mitigation                                                                                                            |
| -------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Fuga de `requestAnimationFrame`/listeners al navegar fuera de la ruta                                                      | `destroy()` obligatorio; criterio de aceptación explícito de ida-y-vuelta con consola limpia                          |
| `onState` disparado en cada frame provoca re-renders excesivos en React                                                    | `maybeEmit()` solo emite cuando cambia score/vidas/nivel/status                                                       |
| Rebote con ángulo mal acotado produce una bola casi horizontal que nunca sube a los bloques                                | Clamp del ángulo resultante a un rango mínimo respecto a la vertical al calcular `vx`/`vy` tras el impacto en paleta  |
| Bola atravesando bloques ("túnel") a la velocidad más alta (nivel 5, ×1.46) si el `dt` es grande                           | `dt` clamp a 0.05 heredado del contrato, más una sola colisión de bloque procesada por frame (igual que la plantilla) |
| Ambigüedad de ancho de paleta entre fuentes de la plantilla (`CLAUDE.md` documenta 162 px, `game.js` usa 81 px en runtime) | Se porta el valor real ejecutado en `game.js` (81 px), no el documentado                                              |

---

## Qué **no** está en este spec

- Sonido, controles táctiles/móviles, WASD.
- Spritesheet binario copiado a `public/`.
- Selector de nivel clicable en pausa.
- Power-ups, bloques de varios golpes u otras mecánicas ajenas a la plantilla original.
- Cambios en auth, `/acerca-de`, home.
- Suite de tests automatizada y comiteada.

Cada uno de estos, si se implementa, va en su propio spec.
