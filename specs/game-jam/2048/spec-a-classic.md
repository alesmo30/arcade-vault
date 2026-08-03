# SPEC GAME JAM — 2048 · Variante A: classic (motor + catálogo + leaderboard)

> **Status:** Draft
> **Variante:** A — 2048 canónico por turnos: la partida acaba cuando el tablero se bloquea, sin reloj ni presión externa.
> **Alternativa:** [spec-b-blitz.md](./spec-b-blitz.md)
> **Promoción:** al elegirse, se copia a `specs/NN-2048.md` y se aprueba allí; este archivo no se implementa in situ
> **Depends on:** 06-leaderboard-y-catalogo-supabase, 05-asteroides-juego
> **Date:** 2026-08-02
> **Objective:** Diseñar el 2048 canónico de Arcade Vault (rejilla 4×4, fusión de potencias de dos, fin por tablero bloqueado), registrarlo en el catálogo (`public.games`) y conectarlo al leaderboard real ya existente.

---

## Fuente

**No hay plantilla en `references/templates/started-games/`** para 2048 — el directorio solo contiene `02-asteroids/`, `03-tetris/` y `04-arkanoid/`. El diseño sale de dos fuentes:

- El análisis previo `game-suggestions/2048.md` (2026-07-30, estado `propuesto`), que ya fijó ficha técnica: `id: 2048`, `cat: PUZZLE`, `color: cyan`, `cover: cover-2048`, score = suma canónica de fusiones, `lives` n/a, `level` = exponente de la ficha más alta, input flechas/WASD. Ese análisis ya se pagó y se reusa tal cual; este spec no lo reescribe.
- Las reglas canónicas del 2048 de Gabriele Cirulli (2014): rejilla 4×4, spawn de una ficha `2` (90%) o `4` (10%) tras cada movimiento válido, deslizamiento hacia una de las cuatro direcciones, fusión de pares iguales adyacentes en la dirección del movimiento con **una sola fusión por ficha y por movimiento**.

Nada de lo aquí descrito mezcla mecánicas de otro juego del catálogo.

---

## Scope

**In:**

- Motor 2048 en `app/games/engines/2048/engine.ts` — rejilla lógica 4×4, movimiento por turnos disparado por tecla, fusión canónica, spawn tras movimiento válido, animación de deslizamiento de ~120 ms, fin de partida por tablero bloqueado.
- Registrado en `app/games/engines/registry.ts` bajo la clave `2048` (clave entrecomillada en el literal de objeto; el nombre exportado de la factory no puede empezar por dígito, se llama `create2048Engine` en `export const create2048Engine`).
- Fila nueva `2048` en `public.games` vía migración (`cat: PUZZLE`, `color: cyan`, `cover: cover-2048`, `sort: 12`).
- Clase `.cover-2048` en `app/globals.css`.
- Diseño visual del canvas vía `/frontend-design` antes de fijar la paleta (escala de color por exponente de ficha, rejilla, tipografía de número).

**Out (queda para specs futuras):**

- Reloj, cuenta atrás o cualquier presión temporal (eso es la variante B).
- Deshacer / rebobinar movimientos, limpiezas de emergencia, comodines.
- Tableros distintos de 4×4, bloques inertes, objetivos de nivel.
- Sonido.
- Controles táctiles / gestos de swipe en móvil — solo teclado.
- Persistencia de partida en curso entre recargas.
- Cambios en `game-canvas.tsx`, `game-player.tsx`, `actions.ts`, `queries.ts`, rutas de catálogo/salón de la fama — ya son genéricos, no se tocan.
- Tests automatizados (no hay framework instalado; verificación con Playwright MCP / claude-in-chrome).

---

## Data model

Sin estructuras nuevas — reusa `public.games` y `public.scores` (spec 06). Fila de catálogo (descripción en prosa, **no SQL ejecutable**):

- `id`: `2048`
- `title`: `2048`
- `short`: texto de card, una frase — deslizar la rejilla y fusionar potencias de dos hasta que no quede movimiento posible.
- `long`: texto de detalle, 2–3 frases en el registro neón del resto del catálogo — una rejilla de cuatro por cuatro donde cada gesto empuja todas las fichas a la vez; los pares iguales se funden y duplican su valor; la partida termina cuando ya no cabe ni un movimiento.
- `cat`: `PUZZLE`
- `cover`: `cover-2048`
- `color`: `cyan` (los cuatro colores están tomados; ver Decisions)
- `plays`: `'0'`
- `sort`: `12` (siguiente entero libre: 8 asteroides, 9 tetris, 10 arkanoid, 11 snake)

`EngineState` mapeado a esta mecánica:

- **`score`**: suma canónica — cada fusión suma el **valor de la ficha resultante** (dos `64` → `128` suma 128). Entero, monótono creciente, nunca decrece. Es la única fuente de puntos: mover sin fusionar no suma nada. Rango típico de una partida completa: 2.000–20.000.
- **`lives`**: fijo en `1` durante toda la partida. 2048 canónico no tiene muertes parciales ni reintentos: el primer bloqueo es el último. Pasa a `0` en el mismo instante en que se detecta el bloqueo y se emite `status: "gameover"`. El HUD muestra `1` toda la partida y `0` al final — comportamiento deliberado, no un bug de mapeo.
- **`level`**: **exponente de la ficha más alta alcanzada** hasta ahora (`128` → 7, `512` → 9, `2048` → 11, `4096` → 12). Empieza en `1` (ficha `2`) y solo sube; nunca baja aunque esa ficha se funda después. No hay cambio de dificultad asociado: `level` aquí es **una segunda métrica de logro**, no un tramo de velocidad — porque en esta variante nada acelera.

Esta es la divergencia central frente a la variante B: aquí `lives` es un placeholder honesto (siempre 1) y `level` es un marcador de logro estático; en B ambos son recursos vivos que el jugador gasta y ve moverse.

---

## Implementation plan

1. **Migración de catálogo.** `supabase/migrations/<ts>_add_game_2048.sql` insertando la fila descrita en _Data model_ (id, title, short, long, cat, cover, color, plays `'0'`, sort 12). Aplicar con `mcp__supabase__apply_migration`; verificar con `list_tables`/`execute_sql` que la fila existe y que `sort` no colisiona. La app sigue ejecutable: la card aparece en `/games` sin motor todavía y `game-player.tsx` cae a la arena maqueta (`hasEngine === false`).
2. **Portada.** Clase `.cover-2048` en `app/globals.css`, en el bloque "Cover art generators", siguiendo el patrón de `.cover-asteroides` (`app/globals.css:801-827`): clase base con `background` oscuro y `::before`/`::after` en `position: absolute; inset: 0` apilando gradientes. Dirección visual: cuatro cuadrados escalonados en diagonal, de menor a mayor luminosidad, sobre una rejilla tenue; el mayor con brillo `drop-shadow` en `var(--cyan)`. Sin números reales (el CSS no escribe texto en la portada). Nunca reusar `.cover-tetris` ni ninguna portada huérfana. **La clase real la escribe la implementación; este spec solo fija la dirección.**
3. **Motor — rejilla y reglas.** Crear `app/games/engines/2048/engine.ts` contra el contrato de `app/games/engines/types.ts` (esqueleto exacto en `.claude/skills/add-game/references/engine-contract.md`). En este paso solo la lógica pura, dibujada en seco sin animación:
   - Canvas lógico fijo **800×600**. El tablero es cuadrado: se centra un área de 560×560 px con letterboxing horizontal (márgenes laterales pintados con el fondo), **no** se cambia el tamaño del canvas.
   - Estado del tablero: matriz 4×4 de exponentes (`0` = celda vacía, `1` = ficha 2, `11` = ficha 2048). Trabajar con exponentes evita comparar valores grandes y hace trivial el cálculo de `level`.
   - Una **única** función de compresión de fila que aplica la regla canónica: mover todo hacia el inicio, fundir pares iguales adyacentes de una sola pasada, marcar la ficha fusionada como no fusionable en ese mismo movimiento (`[2,2,4]` → `[4,4]`, nunca `[8]`). Las cuatro direcciones se resuelven **rotando/transponiendo** la matriz, aplicando esa función a las cuatro filas y deshaciendo la rotación. Prohibido duplicar la lógica por dirección.
   - Un movimiento es **válido** solo si cambia el tablero (alguna ficha se desplaza o se funde). Un movimiento inválido no suma score, no genera ficha nueva y no consume turno.
   - Tras cada movimiento válido: spawn de una ficha en una celda vacía elegida al azar, con valor `2` al 90% y `4` al 10%.
   - Fin de partida: **no hay celda vacía Y no existe ningún par adyacente igual** (comprobar horizontal y vertical). Solo entonces `lives → 0`, `status: "gameover"`. Mientras quede un solo movimiento legal, la partida sigue.
   - Alcanzar `2048` **no** termina la partida ni la gana: se sigue jugando (ver Decisions).
4. **Motor — input, animación y contrato.** Sobre el mismo archivo:
   - `CAPTURED_KEYS` = `ArrowUp`/`ArrowDown`/`ArrowLeft`/`ArrowRight`/`KeyW`/`KeyA`/`KeyS`/`KeyD`, todas con `preventDefault()` en `keydown` para no scrollear la página.
   - Un movimiento por pulsación (flanco `justPressed`): mantener la tecla apretada **no** repite el movimiento. Las pulsaciones recibidas mientras corre la animación se **descartan**, no se encolan.
   - Animación de deslizamiento: tween lineal de ~120 ms sobre las posiciones origen→destino de cada ficha, más un pequeño _pop_ de escala en la ficha recién fusionada y en la recién generada. Durante el tween el tablero lógico ya está en su estado final; solo el dibujo interpola.
   - Loop: `requestAnimationFrame` con `dt` clamp a `0.05` y `lastTime = null` al reanudar tras pausa. El loop corre siempre (aunque el juego esté en reposo entre movimientos) para mantener el patrón único del contrato; `update(dt)` no hace nada cuando no hay animación activa.
   - `maybeEmit()` con throttling: emite solo cuando cambia `score`, `lives`, `level` o `status`. En este juego el estado cambia como mucho una vez por movimiento, así que la emisión es naturalmente escasa — el throttling sigue siendo obligatorio.
   - `pause()`/`resume()`: bloquean/desbloquean el input y marcan `externalPaused` (el estado interno nunca es `"paused"`). Congelan además el tween en curso. Son semánticamente casi vacíos en esta variante (no hay nada corriendo solo), pero se implementan igual para que el overlay de `game-player.tsx` siga siendo coherente.
   - `restart()`: tablero limpio, dos fichas iniciales, `score = 0`, `level = 1`, `lives = 1`, animación cancelada. `endNow()`: `status = "gameover"` con el score real acumulado, reanudando el loop si estaba pausado para que el último frame se vea.
   - `destroy()`: quita **ambos** listeners (`keydown`/`keyup`) y cancela el `rAF` pendiente.
   - Sin globales de módulo, sin DOM fuera del canvas, paleta en un único `const COLORS`.
   - Sin overlay de pausa ni HUD dibujados dentro del canvas: los pinta React desde `EngineState`.
5. **Registro.** Añadir el import y la entrada `"2048": create2048Engine` en `app/games/engines/registry.ts`. A partir de aquí el juego es jugable y GUARDAR PUNTUACIÓN inserta en `scores` sin más cambios.
6. **Diseño visual.** `/frontend-design` para la escala de color por exponente (11+ tonos derivados de `var(--cyan)`, de apagado a saturado, legibles sobre fondo oscuro), el tratamiento de la rejilla y el número dentro de la ficha en `--font-pixel`. Aplicar el resultado al `const COLORS` del motor.
7. **Cierre.** `npm run lint` y `npm run build` limpios. `npm run format` antes de commitear.
8. **Verificación.** Sesión Playwright MCP / claude-in-chrome contra los criterios de aceptación, y `execute_sql` para confirmar la fila insertada en `scores` tras una partida real y el `plays` incrementado.

---

## Acceptance criteria

Fijos de plataforma:

- [ ] `npm run lint` y `npm run build` sin errores ni warnings.
- [ ] `/games` muestra la card `2048` con portada propia (`.cover-2048`), visualmente distinta de asteroides, tetris, arkanoid y snake.
- [ ] `/games/2048` renderiza el detalle; "JUGAR AHORA" lleva a `/games/2048/jugar`.
- [ ] El HUD (Puntuación / Vidas / Nivel) refleja el estado real del motor, sin valores inventados.
- [ ] PAUSA congela el juego (ninguna ficha se mueve, la animación en curso se detiene) y muestra el overlay EN PAUSA; REANUDAR continúa sin saltos ni fichas teletransportadas.
- [ ] FIN abre el modal con la puntuación real acumulada; JUGAR DE NUEVO reinicia a score 0, nivel 1, tablero limpio con dos fichas.
- [ ] Salir de la ruta destruye el motor: ida y vuelta ×2 sin errores en consola.
- [ ] Las teclas capturadas (flechas y WASD) tienen `preventDefault()` y no scrollean la página.
- [ ] GUARDAR PUNTUACIÓN inserta en `scores` (confirmado por SQL); la marca aparece en `/salon-de-la-fama`; `plays` incrementa en 1.
- [ ] Sin errores de hidratación en consola en `/games`, `/games/2048`, `/games/2048/jugar`, `/salon-de-la-fama`.
- [ ] A 375 px de ancho el canvas escala dentro del CRT sin desbordar horizontalmente (o mantiene el mismo overflow preexistente ya documentado en specs anteriores, no uno nuevo).

Específicos de esta variante:

- [ ] Cada flecha (o su equivalente WASD) desliza **todas** las fichas del tablero hacia esa dirección en un solo gesto.
- [ ] La regla de una sola fusión por ficha y movimiento se cumple: una fila `[2,2,4]` deslizada hacia el inicio da `[4,4]`, nunca `[8]`.
- [ ] Una fila `[4,4,4,4]` deslizada da `[8,8]`, no `[16]` ni `[8,4,4]`.
- [ ] Fundir dos fichas suma al score el valor de la ficha resultante (dos `64` suman 128); mover sin fundir no suma nada.
- [ ] Un movimiento que no cambia el tablero (pared o fichas ya compactadas) **no** genera ficha nueva ni suma puntos ni consume turno.
- [ ] Tras cada movimiento válido aparece exactamente una ficha nueva, en una celda que estaba vacía, con valor 2 o 4.
- [ ] La animación de deslizamiento dura ~120 ms; durante ella las pulsaciones se descartan y no se acumulan movimientos en cola.
- [ ] Mantener pulsada una flecha ejecuta **un** movimiento, no una ráfaga.
- [ ] El `level` del HUD equivale al exponente de la ficha más alta alcanzada (`128` → 7, `2048` → 11) y nunca baja, aunque esa ficha se funda después.
- [ ] `lives` vale `1` durante toda la partida y `0` al terminar.
- [ ] Con el tablero lleno pero con al menos un par adyacente igual, la partida **no** termina: ese movimiento sigue siendo legal.
- [ ] La partida solo termina cuando no hay celda vacía **y** no hay ningún par adyacente igual (ni en filas ni en columnas).
- [ ] Alcanzar la ficha `2048` no interrumpe la partida ni muestra pantalla de victoria: se puede seguir jugando y sumando.
- [ ] El botón FIN (`endNow`) permite cerrar una partida larga en cualquier momento conservando el score real — sin él, una partida puede pasar de 10 minutos.

---

## Decisions

- **Sí:** diseño desde cero sobre las reglas canónicas del 2048 de 2014, con la ficha técnica ya fijada en `game-suggestions/2048.md`. **No:** portar una plantilla de `references/templates/started-games/` — no existe ninguna para 2048 (solo asteroids, tetris y arkanoid).
- **Sí (eje de variación frente a la variante B):** **fin de partida por bloqueo del tablero, sin reloj de ningún tipo.** **No:** cuenta atrás con presión temporal (variante B, `blitz`). Esta rama apuesta por el 2048 que la gente reconoce: el fracaso es **espacial**, se lo hace el jugador a sí mismo llenando el tablero con fichas que no encajan, y el tiempo de deliberación es infinito. El coste es una partida larga (5–15 min), mitigada por el botón FIN. Es la lectura fiel; B es la lectura de recreativa.
- **Sí:** `score` = suma canónica del valor de cada ficha creada por fusión. **No:** ficha máxima alcanzada como score. La ficha máxima produce muy pocos valores distintos (`2048`, `4096`…) y llenaría el leaderboard de empates; la suma es un entero fino, monótono y comparable, exactamente lo que ordena el índice `(game_id, score desc)`.
- **Sí:** `level` = exponente de la ficha más alta alcanzada, como métrica de logro. **No:** `level` como tramo de dificultad. En esta variante nada acelera ni cambia con el progreso, así que un `level` de dificultad sería mentira; el exponente es información real y gratuita para el HUD.
- **Sí:** `lives` fijo en `1`. **No:** vidas múltiples, deshacer o rebobinado. El 2048 canónico no perdona: un movimiento malo se paga. Cualquier recurso de rescate cambia el juego (y es justo lo que explora B).
- **Sí:** alcanzar `2048` no termina la partida. **No:** pantalla de victoria y cierre en `2048`. Cortar ahí pondría un techo bajo y artificial al leaderboard, que es exactamente uno de los vetos de `restricciones.md` ("score de techo cerrado y bajo"); dejando seguir, el score queda abierto.
- **Sí:** animación de deslizamiento con tween lineal de ~120 ms. **No:** redibujado seco instantáneo. El análisis previo ya lo señala: sin el deslizamiento se pierde casi toda la sensación de "empujar" el tablero, y el coste es un tween trivial sobre posiciones origen→destino.
- **Sí:** una única función de compresión de fila reutilizada mediante rotación/transposición de la matriz. **No:** cuatro implementaciones direccionales. Es el punto donde históricamente aparecen los bugs de fusión; una sola función se depura una sola vez.
- **Sí:** input por flanco de pulsación (un movimiento por tecla), descartando entradas durante la animación. **No:** repetición automática al mantener la tecla ni cola de movimientos. 2048 es por turnos; una ráfaga accidental destruye partidas y no aporta nada.
- **Sí:** flechas **y** WASD. **No:** solo flechas (como specs 08 y 09). Aquí el input es un gesto discreto por turno, sin timing fino, así que el segundo mapeo no añade riesgo de contrato; y es el mapeo con el que el juego se conoce en web. Es una desviación consciente del precedente, anotada como tal.
- **Sí:** `pause()`/`resume()` implementados aunque no haya nada continuo que congelar. **No:** dejarlos como no-op sin emitir estado. El overlay de `game-player.tsx` depende de `status: "paused"`; romperlo desalinearía la UI compartida.
- **Sí:** clase CSS nueva `.cover-2048` con `color: cyan`. **No:** reusar una portada huérfana (`cover-bricks`, `cover-rocas`…) ni el `yellow` de tetris. Los cuatro colores del catálogo están tomados y hay que reusar uno: `cyan` pertenece a asteroides (`sort` 8), lejos de la posición 12 en la rejilla de `/games`, mientras que las cards vecinas son arkanoid (`magenta`, 10) y snake (`green`, 11). Además evita que los dos PUZZLE (tetris `yellow` y 2048) parezcan la misma familia visual.
- **Sí:** letterboxing horizontal para encajar un tablero cuadrado en el canvas 800×600. **No:** cambiar el tamaño del canvas. Es el invariante del contrato, ya resuelto así por tetris (300×600 nativo).

---

## Risks

| Risk                                                                                                | Mitigation                                                                                                                                                             |
| --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fuga de `requestAnimationFrame`/listeners al navegar fuera de la ruta                               | `destroy()` obligatorio quitando ambos listeners y cancelando el `rAF`; criterio de aceptación explícito de ida y vuelta ×2 con consola limpia                         |
| `onState` disparado en cada frame provoca re-renders excesivos en React                             | `maybeEmit()` solo emite cuando cambia score/vidas/nivel/status                                                                                                        |
| Regla de fusión mal implementada (`[2,2,4]` → `[8]`): el bug clásico de 2048                        | Una sola función de compresión de fila con marca de "ya fusionada" por ficha, reutilizada en las 4 direcciones por rotación; criterios de aceptación con casos exactos |
| Duplicar la lógica por dirección y que solo tres de las cuatro sean correctas                       | Rotación/transposición de la matriz obligatoria en el plan; prohibido el código direccional duplicado                                                                  |
| Detección de fin de partida incompleta (solo mira huecos, no pares adyacentes) → game over injusto  | La condición exige las dos cosas a la vez; criterio de aceptación específico para tablero lleno con par adyacente disponible                                           |
| Movimiento inválido que igualmente genera ficha nueva → el tablero se llena solo y la partida muere | Un movimiento solo cuenta si cambia el tablero; criterio de aceptación dedicado                                                                                        |
| Input encolado durante la animación provoca movimientos fantasma tras soltar la tecla               | Pulsaciones descartadas mientras el tween está activo; input por flanco, sin auto-repetición                                                                           |
| Partida de 5–15 min contradice el criterio de sesión corta de la plataforma                         | El botón FIN (`endNow`) cierra la partida en cualquier momento conservando el score; criterio de aceptación explícito                                                  |
| Tween congelado a medias por una pausa deja fichas en posición intermedia al reanudar               | El tablero lógico ya está en estado final durante el tween; `resume()` con `lastTime = null` reanuda la interpolación o la completa de golpe, nunca la abandona        |
| Escala de color por exponente ilegible al llegar a fichas altas (`4096`, `8192`)                    | Paleta definida por `/frontend-design` con contraste verificado; a partir del último tono definido se reusa el más saturado y solo cambia el número                    |

---

## Qué **no** está en este spec

- Reloj, cuenta atrás o cualquier presión temporal — eso es la variante B (`spec-b-blitz.md`).
- Deshacer / rebobinar, limpiezas de emergencia, comodines.
- Tableros distintos de 4×4, bloques inertes, objetivos de nivel.
- Sonido.
- Controles táctiles / swipe.
- Persistencia de la partida en curso entre recargas.
- Cambios en `game-canvas.tsx`, `game-player.tsx`, `app/games/actions.ts`, `app/data/queries.ts`, rutas de `/games` y `/salon-de-la-fama`.
- Cambios en auth, `/acerca-de`, home.
- Suite de tests automatizada y comiteada.

Cada uno de estos, si se implementa, va en su propio spec.
