# GAME JAM — 2048 (`2048`)

**Tema/entrada:** el juego 2048, con el análisis previo ya existente en `game-suggestions/2048.md` (2026-07-30, estado `propuesto`) como insumo reutilizado.
**Fecha:** 2026-08-02
**Eje de variación:** **modelo de fracaso** — qué termina la partida. A muere por **agotamiento espacial** (tablero bloqueado, sin reloj, deliberación infinita); B muere por **agotamiento temporal** (reloj que se drena y se recarga fundiendo, con el bloqueo del tablero degradado a un recurso limitado que se gasta).

Se eligió este eje y no otro porque es el único que ataca la única objeción real que el análisis previo dejó anotada contra 2048: _"genera partidas largas (5–15 min), más que cualquier engine actual; contradice el 'sesión corta' del criterio de plataforma"_. Los demás ejes candidatos no daban una decisión de verdad:

- **Ritmo (tick discreto vs continuo)** — no aplica: 2048 es por turnos por definición; volverlo continuo deja de ser 2048.
- **Topología (tablero cerrado vs wrap-around)** — en una rejilla 4×4 con fusión, el wrap rompe la regla canónica de compresión y no produce un juego jugable.
- **Mecánica central (port fiel vs twist)** — el twist sin marco (gravedad, bloques especiales) sería cosmético sobre la misma partida: mismo `EngineState`, mismos criterios, misma tabla de riesgos. No es un eje.
- **Tamaño del tablero (4×4 vs 5×5)** — es un tunable, no una decisión. Prohibido explícitamente.

El eje elegido sí se ve en los tres sitios exigidos: el mapeo de `EngineState` (en A `lives` es 1 fijo y `level` un logro estático; en B ambos son recursos vivos), los criterios de aceptación (A verifica bloqueo y no-fin; B verifica drenaje, recarga, purgas, pausa del reloj y clamp de `dt`) y la tabla de riesgos (B añade seis riesgos que en A no existen: pestaña en segundo plano, pausa que no congela el reloj, calibración del reloj, degeneración del multiplicador, purga inútil, doble vía de `gameover`).

## A vs B

| Dimensión               | A — classic                                                                        | B — blitz                                                                                                                             |
| ----------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Mecánica central        | 2048 canónico puro: deslizar, fundir, spawn. Nada corre solo entre movimientos     | 2048 canónico + reloj continuo que se drena y se recarga con cada fusión (más recarga cuanto mayor la ficha)                          |
| `score`                 | Suma canónica: valor de cada ficha creada por fusión                               | Suma canónica × multiplicador de cadena (1..4 según fusiones simultáneas en el mismo movimiento)                                      |
| `lives` / `level`       | `lives` = 1 fijo (placeholder honesto) / `level` = exponente de la ficha más alta  | `lives` = 3 purgas de emergencia que se gastan al bloquearse el tablero / `level` = tramo de velocidad del reloj (1..8, +1 cada 45 s) |
| Input                   | Flechas + WASD, un movimiento por pulsación, entradas descartadas durante el tween | Idéntico — el input no es el eje                                                                                                      |
| Fin de partida          | Tablero bloqueado (sin hueco **y** sin par adyacente). Única vía                   | Reloj a 0 (vía normal), o tablero bloqueado con 0 purgas restantes (vía secundaria)                                                   |
| Coste (bajo/medio/alto) | **Bajo** — la dificultad es algorítmica (compresión + detección de bloqueo)        | **Medio** — todo lo de A, más reloj, recarga escalada, purgas, aceleración por nivel y ~4 tunables que calibrar                       |
| Riesgo principal        | Partida de 5–15 min contra el criterio de sesión corta de la plataforma            | Calibración del reloj: mal ajustado da partidas de 20 s o partidas eternas, y solo se descubre jugando                                |

Ambas comparten `id` `2048`, `title` `2048`, `cat` `PUZZLE`, `cover` `cover-2048`, `color` `cyan`, `plays` `'0'` y `sort` `12`. Solo divergen en `short`/`long` (B menciona el reloj) y en un supuesto discutible de `cat` que B deja anotado (ver Supuestos).

## Recomendación

**B — blitz.**

`.claude/game-planner/huecos.md` sitúa el reparto actual en ARCADE 2 / SHOOTER 1 / PUZZLE 1 / VERSUS 0, y deja `2048` compitiendo con `match-3-gemas`, `pipe-mania`, `bubble-shooter` y `simon` por **el único asiento de segundo PUZZLE**. Ese asiento hay que ganárselo, y A no se lo gana: un 2048 canónico es el juego que cualquiera puede abrir en otra pestaña, y su aportación al catálogo es un tablero estático junto a cuatro engines que se mueven solos. En `/games`, la card de A sería la única que al abrirse no hace nada hasta que pulsas.

B aporta lo que ningún engine actual tiene: **presión temporal gestionable por el jugador**. Tetris presiona con la caída, snake con la velocidad creciente, arkanoid y asteroides con la reacción — en los cuatro la presión es algo que te pasa. En B la presión es un recurso que administras: cada fusión compra segundos, y fusionar grande compra muchos. Eso es una mecánica nueva en el catálogo, no una variante de las existentes.

Además resuelve la única pega registrada contra 2048 en su análisis previo, sin inventarla: acota la partida a 2–4 minutos, alineándola con la sesión corta de la plataforma, y convierte `lives` y `level` en información real en vez de dos campos del HUD rellenados por compromiso — un problema que A reconoce abiertamente en su propio Data model.

El coste extra es real pero acotado: el núcleo algorítmico (compresión, fusión, detección de bloqueo) es idéntico en ambas y es la parte difícil; B añade encima un contador, una escala de recarga y una regla de purga. Lo que sí exige B es una sesión de calibración jugando — presupuéstala.

Si el criterio que pesa es _fidelidad al clásico y mínimo riesgo de implementación_, A es defendible y no está mal. Pero para el asiento de segundo PUZZLE, B es la que justifica gastarlo.

## Supuestos

- `color: cyan`, reusado de asteroides. Los cuatro colores están tomados (cyan/asteroides 8, yellow/tetris 9, magenta/arkanoid 10, green/snake 11) y hay que repetir uno: asteroides es la card más lejana en la rejilla de `/games` respecto a la posición 12, y usar `yellow` haría que los dos PUZZLE parecieran la misma familia visual.
- `sort: 12`, verificado contra `supabase/migrations/` (último ocupado: 11, snake). Coincide con lo anotado en `.claude/game-planner/huecos.md`.
- `cat: PUZZLE` en **ambas** variantes. En B es discutible: el reloj tienta con `ARCADE`. Se mantiene `PUZZLE` porque la decisión que gana la partida sigue siendo espacial y porque `PUZZLE` es el hueco que este juego viene a llenar. Si prefieres B como `ARCADE`, es un cambio de una palabra en la migración y desaparece la justificación de catálogo de la recomendación.
- `cover: cover-2048`, clase nueva. Se comprobó la lista de portadas huérfanas de `huecos.md` (`cover-duelo`, `cover-invaders`, `cover-glot`, `cover-rana`, `cover-bricks`, `cover-rocas`): ninguna encaja con una rejilla de fichas.
- Input flechas **+ WASD**. Es una desviación consciente de specs 08 y 09 (solo flechas). Se asume porque el input aquí es un gesto discreto por turno sin timing fino y WASD es el mapeo con el que 2048 se conoce en web. Si prefieres el precedente estricto, quita WASD de `CAPTURED_KEYS` en la variante elegida.
- Animación de deslizamiento de ~120 ms incluida en ambas variantes, no diferida a un spec posterior. El análisis previo la marcaba como opcional pero recomendable; sin ella el juego pierde casi toda la sensación de empuje y el coste es un tween lineal.
- Alcanzar `2048` no gana ni termina la partida en ninguna de las dos. Cortar ahí pondría un techo bajo al leaderboard, que es un veto explícito de `restricciones.md`.
- La clave de registry va entrecomillada (`"2048"`) y el export se llama `create2048Engine`: un identificador de JavaScript no puede empezar por dígito. La carpeta es `app/games/engines/2048/`.
- Tunables de B (reloj inicial 60 s, techo 90 s, recarga 0,5–4 s según exponente, +1 nivel cada 45 s, drenaje ×1,0 → ×2,2): son puntos de partida razonados, **no** medidos. Se calibran jugando durante la implementación.
- Textos `short`/`long` descritos en prosa, no redactados palabra por palabra: los fija la migración en el momento de implementar, siguiendo el registro neón del resto del catálogo.

## Choques con restricciones

Ninguna de las dos variantes choca con un veto de `.claude/game-planner/restricciones.md`. Comprobado uno por uno:

- _Métrica que minimiza_ — no aplica: el score suma y solo crece.
- _Turnos con resultado binario_ — 2048 es por turnos, pero **no** tiene resultado binario: produce un entero natural que crece con la habilidad. El veto apunta a Conecta 4 / artillería, no aquí.
- _Score de techo cerrado y bajo_ — evitado por diseño: alcanzar `2048` no cierra la partida en ninguna de las dos variantes, así que el score queda abierto.
- _Menús o UI de selección dentro del canvas_ — evitado por diseño en B: la purga se consume **automáticamente** al bloquearse el tablero, no con una tecla de decisión. Fue una restricción activa a la hora de diseñar la variante, no una casualidad.
- Técnicas (canvas 2D sin React/DOM, un jugador, entero único en `scores`, `cat` y `color` del CHECK, alta = engine + registry + migración): las dos cumplen.

Sí hay **una tensión, no un veto**, con el criterio de plataforma de sesión corta: A produce partidas de 5–15 min. La transformación mínima que lo resuelve es exactamente la variante B; en A queda mitigado (no eliminado) por el botón FIN, que cierra la partida en cualquier momento conservando el score real.

Nota de alcance: ninguna de las dos variantes propone tocar `game-canvas.tsx`, `game-player.tsx`, `app/games/actions.ts`, `app/data/queries.ts` ni las rutas de `/games` y `/salon-de-la-fama`. El único punto donde B rozó ese límite fue el reloj: exponerlo en el HUD habría exigido ampliar `EngineState` en `types.ts` y propagarlo por los genéricos. Se resolvió dibujando el reloj dentro del canvas, que es lo correcto — si en la revisión decides que el reloj debe vivir en el HUD de React, eso es un spec aparte sobre el contrato del motor, no un paso escondido dentro de este.

## Siguiente paso

Elegir variante, copiarla a `specs/10-2048.md`, poner `Status: Aprobado` y ejecutar `/spec-impl 10-2048`.
