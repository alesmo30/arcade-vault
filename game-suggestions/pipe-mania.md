---
tema: Pipe Mania / Pipe Dream (tuberías contrarreloj)
fecha: 2026-07-30
estado: propuesto
spec: —
---

# PIPE MANIA — TUBERÍAS

## Pregunta original

Evaluar Pipe Mania (colocar tuberías en una rejilla antes de que llegue el fluido) como candidato para el catálogo.

## Veredicto

**Encaja.** Es el mejor segundo PUZZLE evaluado hasta ahora: score numérico natural y creciente, presión de tiempo, y una mecánica que no se solapa con tetris (no hay caída de piezas ni compactación de filas). Canvas 2D puro y clásico reconocible de 1989.

## Ficha técnica

- id: `tuberias`
- cat: PUZZLE
- color: cyan
- cover: `cover-tuberias` (nueva — trazado de tubos neón sobre rejilla; ninguna huérfana sirve)
- score: 100 por tramo de tubería **por el que pasa el fluido** (no por tubería colocada), ×2 si es un cruce atravesado dos veces, + bonus por distancia mínima superada al cambiar de nivel. Métrica creciente y sin techo: ideal para el leaderboard.
- lives: intentos restantes; se pierde uno cuando el fluido se derrama (llega a un extremo sin continuación). 3 por partida. level: pantalla, sube la distancia mínima exigida, la velocidad del fluido y aparecen celdas bloqueadas.
- input: **puntero** para colocar la pieza en una celda (natural), con **cursor de teclado** (flechas + Espacio) como camino equivalente. Es el primer engine donde el puntero es el input primario.

## Encaje con el contrato de engine

Directo. `pause/resume` congelan tanto la cuenta atrás previa como el avance del fluido; `restart` limpia la rejilla y regenera la cola de piezas; `endNow` fuerza `gameover` con el score acumulado; `destroy` quita listeners de ratón y teclado. `EngineState` cubre todo sin ampliaciones. Lo único que no cabe en `EngineState` es la **cola de próximas piezas**, que es información de HUD — se pinta dentro del canvas, como ya hace tetris con su _next_.

## Coste

**Medio.** La parte difícil concreta es el **recorrido del fluido**: hay que modelar cada celda por sus lados abiertos (N/E/S/O), avanzar el fluido lado a lado con interpolación para la animación, y resolver bien dos casos que son la fuente clásica de bugs: (1) la pieza **cruz**, que debe poder atravesarse dos veces en ejes independientes sin conectar los flujos, y (2) la sustitución de una tubería ya colocada pero aún no inundada. El resto —rejilla, cola aleatoria de piezas, temporizador— es trabajo mecánico.

## Alternativas consideradas

- **Modo sin temporizador (puzzle de conexión puro)**: pierde la tensión y el score deja de ser natural. Descartado.
- **Categoría ARCADE**: descartada; la presión de tiempo no lo convierte en acción, y ARCADE ya va sobrado (2 de 4).
- **2048 / Columns** como segundo PUZZLE: ya se descartaron en `juegos-catalogo-2026-q3.md` (no canvas-natural y solapamiento con tetris respectivamente). Tuberías supera a ambos.

## Notas para el futuro

- Cierra de paso, y sin forzarlo, el hueco de **input de puntero**: aquí el ratón no es un adorno, es la forma natural de jugar. La decisión de 2026-07-30 ("el puntero se cubre mejor como input alternativo") se tomó para un juego de reflejos; este caso es distinto y merece revisarse, no contradecirla a ciegas.
- Qué cambiaría el veredicto: nada previsible. El riesgo es de alcance, no de encaje — si el spec intenta meter tuberías especiales (depósitos, bombas, one-way) en la primera versión, el coste se dispara. Primera versión: 6 piezas (recta H, recta V, cuatro codos) + cruz.
- Reparto por categoría si entra: ARCADE 2 / SHOOTER 1 / PUZZLE 2 / VERSUS 0.
