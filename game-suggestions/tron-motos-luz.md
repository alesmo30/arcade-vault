---
tema: Tron (motos de luz) contra CPU
fecha: 2026-07-30
estado: propuesto
spec: —
---

# TRON — MOTOS DE LUZ (CONTRA CPU)

## Pregunta original

¿Encaja un Tron de motos de luz contra la CPU como juego VERSUS?

## Veredicto

**Encaja con condiciones** — es el mejor VERSUS del lote después de `duelo-pixel` y el único que aporta una mecánica que el catálogo no tiene: **encerrar al rival negándole espacio**. La condición es el solapamiento visible con `snake` (rejilla + estela propia mortal): entra bien si se implementa después de `duelo-pixel` y se vende como duelo, no como "snake con rival".

## Ficha técnica

- id: `estelas`
- cat: VERSUS
- color: cyan
- cover: `cover-estelas` (**nueva**; las seis huérfanas no sirven: `cover-duelo` está reservada a `duelo-pixel` y el resto son de otro género). Diseño barato: dos trazos neón perpendiculares cyan/magenta que casi se cruzan sobre `cover-bg`.
- score: rondas ganadas × 1000 + segundos sobrevividos × 10 + bonus por victoria sin rozar borde. Partida al mejor de N rondas contra CPU que sube de nivel.
- lives / level: lives = rondas que le quedan al jugador (3 derrotas y fin); level = ronda actual, sube la velocidad de avance y la agresividad de la IA
- input: flechas o WASD, giro discreto a 90° (sin marcha atrás)

## Encaje con el contrato de engine

Directo, con un matiz. `pause/resume` congelan el tick; `restart` limpia la rejilla y reinicia rondas; `endNow` cierra con `gameover`; `destroy` quita listeners. El único punto de fricción es que hay **dos fines distintos**: fin de ronda (choca uno de los dos) y fin de partida. El fin de ronda se resuelve con `status: "dead"` + reinicio interno de la rejilla, exactamente como una vida perdida en cualquier engine actual — no hace falta ampliar `EngineState`.

## Coste

**Medio.** La parte difícil concreta es la **IA de la moto rival**: la versión ingenua (girar solo cuando la casilla de delante está ocupada) muere sola en dos segundos y aburre; la versión buena necesita evaluación de espacio libre por _flood fill_ en cada bifurcación para elegir la región mayor y, en dificultad alta, intentar cortar al jugador. El flood fill sobre rejilla pequeña (p. ej. 80×60) es barato en CPU, pero es la pieza donde se va el tiempo de _tuning_. El resto del engine —rejilla de ocupación, avance discreto, colisión por lectura de celda— es de los más simples posibles, más simple que `snake`.

## Alternativas consideradas

- Tron con power-ups (saltos, boost): añade estado que no cabe limpio en `EngineState` y diluye la pureza del duelo. Fuera del primer spec.
- Tron a tres o cuatro motos (una humana, varias CPU): más espectáculo, pero la IA se multiplica y el score se vuelve ruidoso. Descartado para v1; queda como idea de "modo caos".
- Compararlo con `snake` como razón para rechazarlo: se consideró y se descartó. En snake el enemigo es tu propio crecimiento y el objetivo es recolectar; aquí no hay nada que recoger y el objetivo es geometría contra un adversario. La sensación de partida es distinta.

## Notas para el futuro

- Decisión pendiente para el spec: si el score prioriza rondas ganadas (legible, escalones grandes) o supervivencia en segundos (curva de leaderboard más rica). Mismo dilema que quedó abierto en `duelo-pixel`; conviene resolverlo igual en ambos para que el salón de la fama sea comparable.
- Qué cambiaría el veredicto a "no": que el usuario considere que rejilla + estela ya está cubierta por `snake`. Es un argumento defendible; si lo enuncia, anotarlo como veto de "segunda mecánica de rejilla".
- Con `duelo-pixel` + `estelas` la categoría VERSUS quedaría con dos entradas y reparto ARCADE 2 / SHOOTER 1 / PUZZLE 1 / VERSUS 2. Equilibrado.
