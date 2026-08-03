# SPEC GAME JAM — 2048 · Variante B: blitz (motor + catálogo + leaderboard)

> **Status:** Draft
> **Variante:** B — 2048 a contrarreloj: un reloj que se drena marca el fin de la partida, y el bloqueo del tablero se paga con un recurso limitado en vez de terminar el juego.
> **Alternativa:** [spec-a-classic.md](./spec-a-classic.md)
> **Promoción:** al elegirse, se copia a `specs/NN-2048.md` y se aprueba allí; este archivo no se implementa in situ
> **Depends on:** 06-leaderboard-y-catalogo-supabase, 05-asteroides-juego
> **Date:** 2026-08-02
> **Objective:** Diseñar un 2048 de sesión corta para Arcade Vault (rejilla 4×4, fusión de potencias de dos, reloj que se drena y se recarga fundiendo, bloqueo del tablero resuelto con purgas limitadas), registrarlo en el catálogo (`public.games`) y conectarlo al leaderboard real ya existente.

---

## Fuente

**No hay plantilla en `references/templates/started-games/`** para 2048 — el directorio solo contiene `02-asteroids/`, `03-tetris/` y `04-arkanoid/`. El diseño sale de dos fuentes:

- El análisis previo `game-suggestions/2048.md` (2026-07-30, estado `propuesto`), que fijó ficha técnica (`id: 2048`, `cat: PUZZLE`, `color: cyan`, `cover: cover-2048`, score = suma canónica de fusiones, input flechas/WASD) y dejó anotada una tensión explícita: _"genera partidas largas (5–15 min), más que cualquier engine actual; contradice el 'sesión corta' del criterio de plataforma sin llegar a romperlo"_. Esta variante es la respuesta directa a esa nota. El análisis ya se pagó y se reusa; este spec no lo reescribe.
- Las reglas canónicas del 2048 de Gabriele Cirulli (2014) para el núcleo de compresión y fusión, que aquí se conservan **intactas**; lo que cambia es el marco que envuelve la partida.

Nada de lo aquí descrito mezcla mecánicas de otro juego del catálogo: el reloj no es un préstamo de tetris (allí la presión es la caída de la pieza, aquí es un recurso que el jugador recarga con su propio juego).

---

## Scope

**In:**

- Motor 2048 blitz en `app/games/engines/2048/engine.ts` — rejilla lógica 4×4, movimiento por turnos disparado por tecla, fusión canónica, spawn tras movimiento válido, animación de deslizamiento de ~120 ms, **reloj continuo que se drena y se recarga con cada fusión**, **purgas de emergencia limitadas** cuando el tablero se bloquea, fin de partida cuando el reloj llega a cero.
- Registrado en `app/games/engines/registry.ts` bajo la clave `2048` (clave entrecomillada en el literal de objeto; el nombre exportado de la factory no puede empezar por dígito, se llama `create2048Engine` en `export const create2048Engine`).
- Fila nueva `2048` en `public.games` vía migración (`cat: PUZZLE`, `color: cyan`, `cover: cover-2048`, `sort: 12`).
- Clase `.cover-2048` en `app/globals.css`.
- Diseño visual del canvas vía `/frontend-design` antes de fijar la paleta (escala de color por exponente, rejilla, barra de reloj dentro del canvas, tipografía de número).

**Out (queda para specs futuras):**

- Modo sin reloj / clásico relajado (eso es la variante A).
- Deshacer / rebobinar movimientos (la purga no rebobina: limpia).
- Tableros distintos de 4×4, bloques inertes, objetivos de nivel diseñados.
- Sonido.
- Controles táctiles / gestos de swipe en móvil — solo teclado.
- Selector de dificultad o de duración inicial (no hay menús dentro del canvas — restricción vinculante).
- Persistencia de partida en curso entre recargas.
- Cambios en `game-canvas.tsx`, `game-player.tsx`, `actions.ts`, `queries.ts`, rutas de catálogo/salón de la fama — ya son genéricos, no se tocan.
- Tests automatizados (no hay framework instalado; verificación con Playwright MCP / claude-in-chrome).

---

## Data model

Sin estructuras nuevas — reusa `public.games` y `public.scores` (spec 06). Fila de catálogo (descripción en prosa, **no SQL ejecutable**):

- `id`: `2048`
- `title`: `2048`
- `short`: texto de card, una frase — fundir potencias de dos contra un reloj que solo se recarga fundiendo.
- `long`: texto de detalle, 2–3 frases en el registro neón del resto del catálogo — cada gesto empuja la rejilla entera y el reloj no espera; cada fusión devuelve segundos, y cuanto mayor es la ficha creada, más tiempo compra; cuando el tablero se atasca, quemar una purga limpia las fichas pequeñas, pero solo quedan tres.
- `cat`: `PUZZLE` (ver Decisions — el reloj tienta con `ARCADE`, pero la decisión que gana la partida sigue siendo espacial)
- `cover`: `cover-2048`
- `color`: `cyan`
- `plays`: `'0'`
- `sort`: `12` (siguiente entero libre: 8 asteroides, 9 tetris, 10 arkanoid, 11 snake)

`EngineState` mapeado a esta mecánica:

- **`score`**: base canónica **con multiplicador de cadena**. Cada fusión suma el valor de la ficha resultante multiplicado por el factor de cadena del movimiento: si un solo movimiento produce 1 fusión ×1, 2 fusiones ×2, 3 fusiones ×3, 4 fusiones ×4. Entero, monótono creciente. El multiplicador premia el juego que la variante A no distingue: preparar el tablero para colapsarlo entero de una vez, no ir fundiendo de una en una. Rango típico de una partida: 1.500–15.000, con techo abierto.
- **`lives`**: **purgas de emergencia restantes**, empieza en `3`. Cuando el tablero se bloquea (sin hueco ni par adyacente), se consume automáticamente una purga: desaparecen todas las fichas de valor `2` y `4` del tablero, la partida continúa y `lives` baja en uno. Con `lives` a `0` y el tablero bloqueado de nuevo, la partida termina en `gameover` aunque quede reloj. Es un recurso real, visible y que baja durante la partida.
- **`level`**: **tramo de velocidad del reloj**, `1..8`. Sube cada 45 segundos de partida jugados. Cada nivel aumenta el drenaje del reloj (nivel 1 ≈ 1,0 s de reloj por segundo real; nivel 8 ≈ 2,2 s por segundo real, con tope). Sube la exigencia de fusionar rápido y garantiza que ninguna partida se estire indefinidamente. Nunca baja.

Esta es la divergencia central frente a la variante A: allí `lives` es `1` fijo (decorativo) y `level` es un marcador de logro estático, y nada corre solo. Aquí los tres campos del `EngineState` son recursos vivos que cambian sin que el jugador toque una tecla, y `status` puede pasar a `gameover` en un frame en el que no hubo input.

---

## Implementation plan

1. **Migración de catálogo.** `supabase/migrations/<ts>_add_game_2048.sql` insertando la fila descrita en _Data model_ (id, title, short, long, cat, cover, color, plays `'0'`, sort 12). Aplicar con `mcp__supabase__apply_migration`; verificar con `list_tables`/`execute_sql` que la fila existe y que `sort` no colisiona. La app sigue ejecutable: la card aparece en `/games` sin motor todavía y `game-player.tsx` cae a la arena maqueta (`hasEngine === false`).
2. **Portada.** Clase `.cover-2048` en `app/globals.css`, en el bloque "Cover art generators", siguiendo el patrón de `.cover-asteroides` (`app/globals.css:801-827`): clase base con `background` oscuro y `::before`/`::after` en `position: absolute; inset: 0` apilando gradientes. Dirección visual: cuatro cuadrados escalonados en diagonal sobre una rejilla tenue, cruzados por una barra horizontal luminosa a media altura que sugiere el reloj drenándose; el cuadrado mayor con `drop-shadow` en `var(--cyan)`. Sin números ni texto. Nunca reusar una portada huérfana. **La clase real la escribe la implementación; este spec solo fija la dirección.**
3. **Motor — rejilla y reglas canónicas.** Crear `app/games/engines/2048/engine.ts` contra el contrato de `app/games/engines/types.ts` (esqueleto exacto en `.claude/skills/add-game/references/engine-contract.md`). En este paso solo la lógica de tablero, sin reloj ni animación:
   - Canvas lógico fijo **800×600**. El tablero es cuadrado: se centra un área de 520×520 px con letterboxing horizontal; la franja inferior restante se reserva para la **barra de reloj**, que sí se dibuja dentro del canvas (ver paso 5). **No** se cambia el tamaño del canvas.
   - Estado del tablero: matriz 4×4 de exponentes (`0` = vacía, `1` = ficha 2, `11` = ficha 2048).
   - Una **única** función de compresión de fila con la regla canónica de una sola fusión por ficha y por movimiento (`[2,2,4]` → `[4,4]`, nunca `[8]`), aplicada a las cuatro direcciones **rotando/transponiendo** la matriz. Prohibido duplicar la lógica por dirección.
   - Un movimiento es válido solo si cambia el tablero. Un movimiento inválido no suma score, no recarga reloj, no genera ficha y no consume turno.
   - Tras cada movimiento válido: spawn de una ficha en una celda vacía aleatoria, `2` al 90% y `4` al 10%.
   - Contar las fusiones producidas por el movimiento para calcular el multiplicador de cadena (1..4) y sumar `valor_resultante × cadena` por cada fusión.
4. **Motor — reloj, purgas y fin de partida.** Sobre el mismo archivo:
   - Reloj: contador en segundos que arranca en `60`, con techo duro de `90` (una racha buena no acumula tiempo infinito). Se drena en `update(dt)` a razón de `dt × factorNivel`, con `factorNivel` derivado de `level` (1,0 → 2,2).
   - Recarga: cada fusión devuelve segundos según el exponente de la ficha creada — fusiones pequeñas devuelven poco (≈0,5 s por una ficha `8`), fusiones grandes devuelven mucho (≈4 s por una ficha `256` o superior), escala creciente con el exponente. El tiempo recargado se **suma después** del drenaje del frame y se recorta al techo de 90 s.
   - `level` sube un tramo cada 45 s de partida jugados (tiempo real transcurrido, no tiempo de reloj), tope en 8.
   - Bloqueo del tablero (sin hueco vacío **y** sin par adyacente igual): se consume una purga → todas las fichas de valor `2` y `4` desaparecen, `lives` baja en 1, y se sigue jugando sin generar ficha nueva en ese instante. Si al purgar **no había** ninguna ficha `2` ni `4` (tablero bloqueado solo con fichas grandes), la purga se consume igual y se limpian las dos fichas de menor valor del tablero, garantizando que siempre libera al menos dos huecos.
   - Fin de partida (`lives → tal cual esté`, `status: "gameover"`) por cualquiera de dos vías, ambas terminales: **reloj a 0**, o **tablero bloqueado con `lives === 0`**. La vía normal y esperada es el reloj.
   - Alcanzar `2048` no termina la partida ni la gana: se sigue jugando.
5. **Motor — input, animación y contrato.** Sobre el mismo archivo:
   - `CAPTURED_KEYS` = `ArrowUp`/`ArrowDown`/`ArrowLeft`/`ArrowRight`/`KeyW`/`KeyA`/`KeyS`/`KeyD`, todas con `preventDefault()` en `keydown`.
   - Un movimiento por pulsación (flanco `justPressed`); mantener la tecla **no** repite. Las pulsaciones durante la animación se descartan, no se encolan.
   - Animación de deslizamiento: tween lineal de ~120 ms origen→destino, más _pop_ de escala en la ficha fusionada y en la generada. **El reloj sigue drenándose durante el tween** — es tiempo real, no una pausa gratis.
   - Barra de reloj dibujada dentro del canvas (franja inferior), con cambio de tratamiento visual bajo 10 s. Es la única excepción a "el HUD lo pinta React": el reloj cambia continuamente y no cabe en `EngineState`, que solo tiene `score`/`lives`/`level`/`status`. El HUD de React sigue mostrando Puntuación / Vidas / Nivel desde `EngineState`, sin duplicar el reloj.
   - Loop: `rAF` con `dt` clamp a `0.05` y `lastTime = null` al reanudar tras pausa. **El clamp es aquí una regla de juego, no solo de render**: sin él, una pestaña en segundo plano devolvería un `dt` enorme y vaciaría el reloj de golpe.
   - `maybeEmit()` con throttling: emite solo cuando cambia `score`, `lives`, `level` o `status`. El reloj **no** entra en `EngineState` y por tanto no provoca emisiones por frame.
   - `pause()`/`resume()`: bloquean el input, marcan `externalPaused` (el estado interno nunca es `"paused"`), **detienen el drenaje del reloj y el contador de tramo de nivel**, y congelan el tween. Aquí la pausa tiene significado real y es verificable: el reloj debe valer lo mismo antes y después.
   - `restart()`: tablero limpio con dos fichas, `score = 0`, `lives = 3`, `level = 1`, reloj a 60, animación cancelada. `endNow()`: `status = "gameover"` con el score real, reanudando el loop si estaba pausado.
   - `destroy()`: quita **ambos** listeners (`keydown`/`keyup`) y cancela el `rAF` pendiente.
   - Sin globales de módulo, sin DOM fuera del canvas, paleta en un único `const COLORS`.
6. **Registro.** Añadir el import y la entrada `"2048": create2048Engine` en `app/games/engines/registry.ts`. A partir de aquí el juego es jugable y GUARDAR PUNTUACIÓN inserta en `scores` sin más cambios.
7. **Diseño visual.** `/frontend-design` para la escala de color por exponente (derivada de `var(--cyan)`, de apagado a saturado), el tratamiento de la barra de reloj y su estado de alarma bajo 10 s, y el número dentro de la ficha en `--font-pixel`. Aplicar al `const COLORS` del motor.
8. **Cierre y verificación.** `npm run lint` y `npm run build` limpios; `npm run format` antes de commitear. Sesión Playwright MCP / claude-in-chrome contra los criterios de aceptación, y `execute_sql` para confirmar la fila insertada en `scores` tras una partida real y el `plays` incrementado.

---

## Acceptance criteria

Fijos de plataforma:

- [ ] `npm run lint` y `npm run build` sin errores ni warnings.
- [ ] `/games` muestra la card `2048` con portada propia (`.cover-2048`), visualmente distinta de asteroides, tetris, arkanoid y snake.
- [ ] `/games/2048` renderiza el detalle; "JUGAR AHORA" lleva a `/games/2048/jugar`.
- [ ] El HUD (Puntuación / Vidas / Nivel) refleja el estado real del motor, sin valores inventados.
- [ ] PAUSA congela el juego (ninguna ficha se mueve, la animación se detiene) y muestra el overlay EN PAUSA; REANUDAR continúa sin saltos.
- [ ] FIN abre el modal con la puntuación real acumulada; JUGAR DE NUEVO reinicia a score 0, 3 purgas, nivel 1, reloj a 60 s, tablero limpio con dos fichas.
- [ ] Salir de la ruta destruye el motor: ida y vuelta ×2 sin errores en consola.
- [ ] Las teclas capturadas (flechas y WASD) tienen `preventDefault()` y no scrollean la página.
- [ ] GUARDAR PUNTUACIÓN inserta en `scores` (confirmado por SQL); la marca aparece en `/salon-de-la-fama`; `plays` incrementa en 1.
- [ ] Sin errores de hidratación en consola en `/games`, `/games/2048`, `/games/2048/jugar`, `/salon-de-la-fama`.
- [ ] A 375 px de ancho el canvas escala dentro del CRT sin desbordar horizontalmente (o mantiene el mismo overflow preexistente ya documentado, no uno nuevo).

Específicos de esta variante:

- [ ] Cada flecha (o su equivalente WASD) desliza todas las fichas hacia esa dirección en un solo gesto.
- [ ] La regla de una sola fusión por ficha y movimiento se cumple: `[2,2,4]` → `[4,4]`, nunca `[8]`; `[4,4,4,4]` → `[8,8]`.
- [ ] Un movimiento que no cambia el tablero no suma puntos, no recarga reloj, no genera ficha nueva ni consume turno.
- [ ] La barra de reloj se drena de forma visible y continua **sin que el jugador toque ninguna tecla**.
- [ ] Cada fusión recarga reloj; una fusión de ficha alta (`256`+) recarga notablemente más que una de ficha baja (`8`).
- [ ] El reloj no supera nunca el techo de 90 s por muchas fusiones encadenadas que se hagan.
- [ ] Un movimiento con 3 fusiones simultáneas puntúa más que tres movimientos de una fusión cada uno sobre las mismas fichas (multiplicador de cadena aplicado).
- [ ] `level` sube un tramo cada ~45 s de partida y el drenaje del reloj acelera de forma perceptible entre nivel 1 y nivel 8; nunca baja.
- [ ] Con el tablero bloqueado y `lives > 0`: se consume una purga, desaparecen las fichas `2` y `4`, `lives` baja en 1 en el HUD y **la partida continúa**.
- [ ] Una purga sobre un tablero bloqueado sin fichas `2` ni `4` libera igualmente al menos dos huecos.
- [ ] Con el tablero bloqueado y `lives === 0` la partida termina en `gameover` con la puntuación real, aunque quede reloj.
- [ ] Reloj a 0 termina la partida en `gameover` con la puntuación real, aunque el tablero tenga movimientos disponibles y purgas sin usar.
- [ ] Con PAUSA activa el reloj **no** se drena: el valor mostrado antes de pausar y al reanudar es el mismo, y el nivel no avanza durante la pausa.
- [ ] Volver a la pestaña tras dejarla en segundo plano ~30 s **no** vacía el reloj de golpe (clamp de `dt` a 0,05 verificado).
- [ ] Alcanzar la ficha `2048` no interrumpe la partida ni muestra pantalla de victoria.
- [ ] Una partida completa desde el inicio hasta `gameover` por reloj dura del orden de 2–4 minutos, no 10+.

---

## Decisions

- **Sí:** diseño desde cero sobre las reglas canónicas del 2048 de 2014, con la ficha técnica de `game-suggestions/2048.md`. **No:** portar una plantilla de `references/templates/started-games/` — no existe ninguna para 2048.
- **Sí (eje de variación frente a la variante A):** **el fin de partida es temporal, no espacial: manda un reloj que se drena y se recarga fundiendo, y el bloqueo del tablero se paga con un recurso limitado en vez de terminar el juego.** **No:** fin exclusivamente por tablero bloqueado, sin reloj (variante A, `classic`). Esta rama existe por una razón anotada en el análisis previo: el 2048 canónico produce partidas de 5–15 minutos, más largas que cualquier engine del catálogo, y la plataforma busca sesión corta. El reloj acota la partida a 2–4 minutos, convierte la deliberación infinita en decisión bajo presión, y hace que `lives` y `level` signifiquen algo en vez de ser placeholders.
- **Sí:** el reloj se recarga fundiendo, con recompensa creciente por exponente. **No:** cuenta atrás fija sin recarga. Una cuenta atrás pura convertiría el juego en "hacer movimientos rápido"; recargar por fusión mantiene el incentivo en jugar **bien**, que es lo que 2048 mide, y hace que sobrevivir sea consecuencia de construir fichas grandes.
- **Sí:** techo duro de 90 s en el reloj. **No:** acumulación ilimitada de tiempo. Sin techo, un jugador experto acumularía minutos en los primeros 30 segundos y la variante se volvería la A con pasos extra.
- **Sí:** `lives` = purgas de emergencia (3), consumidas automáticamente al bloquearse el tablero. **No:** `lives` fijo en 1 como en la variante A, ni purga activada por una tecla dedicada. Automática porque una tecla de purga sería una decisión de menú dentro del canvas, y `restricciones.md` veta las UI de selección en el canvas; automática además hace la lectura del HUD inequívoca (baja justo cuando se ve la limpieza).
- **Sí:** la purga limpia (elimina fichas `2` y `4`). **No:** deshacer/rebobinar el último movimiento. Rebobinar convierte el juego en ensayo y error y desactiva el coste de equivocarse; limpiar es un rescate que cuesta material y no devuelve el tiempo.
- **Sí:** `score` = suma canónica con multiplicador de cadena por fusiones simultáneas. **No:** suma canónica pura. Bajo presión de reloj, la suma pura premia machacar teclas; el multiplicador premia montar el tablero para colapsarlo entero, que es la habilidad real y la que diferencia el leaderboard.
- **Sí:** `level` = tramo de aceleración del reloj cada 45 s. **No:** `level` = exponente de la ficha máxima (eso es la variante A). Aquí el `level` tiene que ser dificultad porque la partida está acotada en el tiempo y necesita una curva; el exponente máximo ya se lee en el propio tablero.
- **Sí:** `cat: PUZZLE`. **No:** `cat: ARCADE`. El reloj tienta con ARCADE, pero cada movimiento sigue siendo una decisión espacial deliberada, no un reflejo; y `PUZZLE` hoy solo tiene tetris, que es el hueco de catálogo que este juego viene a llenar. Anotado en el README como supuesto revisable.
- **Sí:** barra de reloj dibujada dentro del canvas. **No:** exponer el reloj vía `EngineState`. `EngineState` es un contrato cerrado de cuatro campos (`score`/`lives`/`level`/`status`) y ampliarlo obligaría a tocar `types.ts`, `game-canvas.tsx` y `game-player.tsx` — genéricos que este spec no toca. Además un reloj en `EngineState` rompería el throttling de `maybeEmit()` (emitiría cada frame).
- **Sí:** una única función de compresión de fila reutilizada por rotación/transposición. **No:** cuatro implementaciones direccionales. Es el punto histórico de bugs de fusión.
- **Sí:** input por flanco de pulsación, descartando entradas durante la animación. **No:** auto-repetición al mantener la tecla ni cola de movimientos. Bajo reloj, una ráfaga accidental destruiría el tablero en medio segundo.
- **Sí:** flechas **y** WASD. **No:** solo flechas (como specs 08 y 09). El input es un gesto discreto por turno, sin timing fino, y es el mapeo con el que el juego se conoce en web. Desviación consciente del precedente, anotada.
- **Sí:** `pause()` congela el reloj y el contador de nivel. **No:** dejar el reloj corriendo con el overlay puesto. Sería un fallo funcional visible: el jugador perdería la partida mirando el overlay de PAUSA.
- **Sí:** clase CSS nueva `.cover-2048` con `color: cyan`. **No:** reusar una portada huérfana ni el `yellow` de tetris. Los cuatro colores están tomados y hay que reusar uno: `cyan` es de asteroides (`sort` 8), lejos de la posición 12 en la rejilla de `/games`, cuyas vecinas son arkanoid (`magenta`, 10) y snake (`green`, 11). Además evita que los dos PUZZLE parezcan la misma familia visual.
- **Sí:** letterboxing horizontal más franja inferior para el reloj dentro del canvas 800×600. **No:** cambiar el tamaño del canvas. Invariante del contrato, ya resuelto así por tetris.

---

## Risks

| Risk                                                                                                   | Mitigation                                                                                                                                                        |
| ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fuga de `requestAnimationFrame`/listeners al navegar fuera de la ruta                                  | `destroy()` obligatorio quitando ambos listeners y cancelando el `rAF`; criterio de aceptación explícito de ida y vuelta ×2 con consola limpia                    |
| `onState` disparado en cada frame provoca re-renders excesivos en React                                | `maybeEmit()` solo emite cuando cambia score/vidas/nivel/status; el reloj deliberadamente **fuera** de `EngineState` para no forzar emisión por frame             |
| Regla de fusión mal implementada (`[2,2,4]` → `[8]`): el bug clásico de 2048                           | Una sola función de compresión con marca de "ya fusionada" por ficha, reutilizada en las 4 direcciones por rotación; criterios de aceptación con casos exactos    |
| Pestaña en segundo plano: `rAF` se detiene y al volver un `dt` gigante vacía el reloj de golpe         | `dt` clamp a 0,05 tratado como regla de juego; criterio de aceptación específico de volver tras ~30 s en segundo plano                                            |
| El reloj sigue drenándose durante la pausa y el jugador pierde mirando el overlay                      | `pause()` detiene drenaje y contador de nivel; criterio de aceptación de "mismo valor antes y después"                                                            |
| Reloj demasiado tacaño o demasiado generoso: partida de 20 s o partida infinita                        | Tres tunables acotados (inicio 60 s, techo 90 s, recarga escalada por exponente) más la aceleración por `level`; criterio de aceptación de duración 2–4 min       |
| El multiplicador de cadena degenera en "machacar teclas" si las fusiones simples puntúan casi igual    | El multiplicador escala con el número de fusiones del mismo movimiento (×1..×4), no con el tiempo; verificable comparando 3 fusiones simultáneas contra 3 sueltas |
| Purga que no libera huecos (tablero bloqueado sin fichas `2` ni `4`) consume vida sin desbloquear nada | Regla de respaldo: si no hay `2` ni `4`, se limpian las dos fichas de menor valor; criterio de aceptación dedicado                                                |
| Dos vías de `gameover` (reloj y bloqueo sin purgas) que se pisan y emiten estado dos veces             | Una sola transición a `gameover` guardada por el estado interno; `maybeEmit()` deduplica por comparación con `lastEmitted`                                        |
| Movimiento inválido que igualmente recarga reloj o genera ficha                                        | Un movimiento solo cuenta si cambia el tablero; criterio de aceptación dedicado                                                                                   |
| Input encolado durante la animación provoca movimientos fantasma bajo presión                          | Pulsaciones descartadas mientras el tween está activo; input por flanco, sin auto-repetición                                                                      |
| Barra de reloj dentro del canvas duplicando información del HUD de React y confundiendo                | El HUD de React muestra solo Puntuación / Vidas / Nivel; el reloj vive únicamente en el canvas, sin duplicado                                                     |

---

## Qué **no** está en este spec

- Modo sin reloj / clásico relajado — eso es la variante A (`spec-a-classic.md`).
- Deshacer / rebobinar movimientos.
- Tableros distintos de 4×4, bloques inertes, objetivos de nivel diseñados.
- Sonido.
- Controles táctiles / swipe.
- Selector de dificultad o de duración inicial.
- Persistencia de la partida en curso entre recargas.
- Cambios en `game-canvas.tsx`, `game-player.tsx`, `app/games/actions.ts`, `app/data/queries.ts`, rutas de `/games` y `/salon-de-la-fama`.
- Cambios en auth, `/acerca-de`, home.
- Suite de tests automatizada y comiteada.

Cada uno de estos, si se implementa, va en su propio spec.
