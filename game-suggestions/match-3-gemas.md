---
tema: Match-3 estilo Bejeweled
fecha: 2026-07-30
estado: propuesto
spec: —
---

# MATCH-3 ESTILO BEJEWELED — "GEMAS"

## Pregunta original

¿Encaja un match-3 tipo Bejeweled en Arcade Vault?

## Veredicto

**Encaja con condiciones.** Mecánicamente es sólido y el score es natural, pero el match-3 clásico **no termina solo**: sin una condición de fin, el score es una función del tiempo que el jugador aguante, no de su habilidad, y el leaderboard queda inservible. La condición es elegir modo finito en el spec.

## Ficha técnica

- id: `gemas`
- cat: PUZZLE
- color: magenta
- cover: `cover-gemas` (nueva). Rombos de colores en rejilla; ninguna huérfana sirve.
- score: 10 × (nº de gemas de la combinación) × multiplicador de cascada (×1, ×2, ×4… por cada resolución encadenada). Bonus por combinaciones de 4 y 5.
- lives: n/a → mapear a **movimientos restantes** si se elige modo por movimientos (es lo que mejor encaja con el HUD existente). level: tablero/objetivo completado, sube el requisito.
- input: **flechas + Espacio** (cursor de selección e intercambio con la adyacente). El puntero con arrastre es la forma nativa del género y debería ser el input alternativo, no el único.

## Encaje con el contrato de engine

Directo para `pause/resume/restart/destroy`. Un matiz: las **cascadas son animaciones no interrumpibles** (resolver → caer → rellenar → volver a resolver). `pause()` durante una cascada debe congelar el fotograma, no abortar la resolución; y `endNow()` debe dejar terminar la cascada en curso antes de emitir `gameover`, o el jugador pierde puntos ya ganados. Nada de esto sale de `EngineState`.

## Coste

**Medio.** Cuatro piezas, todas conocidas pero ninguna gratis:

1. Detección de coincidencias (barridos horizontal y vertical, ≥3).
2. Resolución en cascada con gravedad y relleno por arriba, en bucle hasta estabilizar.
3. **Validación del intercambio**: un swap que no genera combinación debe revertirse con animación — es la fuente clásica de bugs de estado.
4. **Tablero sin movimientos posibles**: detectar y barajar. Además el tablero inicial debe generarse _sin_ combinaciones preexistentes.

La parte realmente difícil es la 4 combinada con la 2: la máquina de estados (idle → swapping → resolving → refilling → checking-deadlock) hay que escribirla explícita o el engine se vuelve inmantenible.

## Alternativas consideradas

- **Candy Crush con objetivos por nivel** — más contenido y más diseño; multiplica el coste sin mejorar el leaderboard.
- **Match-3 sin límite (endless)** — descartado: es exactamente lo que rompe el score comparable.
- **Modo contrarreloj (60–90 s)** — la opción recomendada: sesión corta, presión real, y `lives` queda en n/a mientras el tiempo se pinta dentro del canvas.
- **Modo por movimientos (p. ej. 30)** — segunda opción, y la que mejor aprovecha el campo `lives` del HUD.

## Notas para el futuro

- Lo que cambiaría el veredicto a "no encaja": que se insista en el modo endless. Con fin finito, encaja sin reservas.
- Cubre parcialmente el hueco de "input de puntero" registrado en `huecos.md`, pero como input secundario — el teclado debe seguir siendo suficiente para jugar.
- Sería el tercer PUZZLE si entran también 2048 y burbujas; vigilar el reparto por categoría antes de aprobar los tres.
