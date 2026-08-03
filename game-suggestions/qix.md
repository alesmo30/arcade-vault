---
tema: Qix (conquista de área por trazado)
fecha: 2026-07-30
estado: propuesto
spec: —
---

# QIX

## Pregunta original

¿Encaja Qix — recortar área del tablero trazando líneas mientras un enemigo errático patrulla el interior y los Sparx recorren el borde — en Arcade Vault?

## Veredicto

**Encaja con condiciones.** Es el candidato del lote con la **mecánica más singular**: ningún engine del catálogo, ni ninguno de los propuestos, se basa en reclamar territorio. El score (porcentaje de área conquistada) es un entero natural y perfectamente comparable entre jugadores. La condición es de implementación: **aceptar el tablero como rejilla de celdas con relleno por flood fill**, no como polígonos vectoriales. Con polígonos, el coste se dispara a nivel `pinball`.

## Ficha técnica

- id: `qix`
- cat: ARCADE
- color: yellow
- cover: `cover-qix` (**nueva**). Ninguna huérfana sirve. Propuesta: rectángulo con dos zonas irregulares rellenas en yellow/cyan y una línea quebrada en curso desde el borde.
- score: área conquistada × 100 por nivel; ×2 si el trazo se hizo en modo lento (riesgo alto, recompensa alta — es la decisión que da profundidad al juego); bonus por el porcentaje que exceda la cuota del nivel. Techo abierto y buen rango.
- lives: 3 marcadores. level: pantalla superada al alcanzar la cuota de área (75 % en el original); sube la velocidad del Qix y aparece un segundo Sparx.
- input: flechas para moverse por el borde y para iniciar el trazo hacia el interior; Espacio mantenido = modo lento (doble puntuación).

## Encaje con el contrato de engine

Directo. `pause/resume` congelan el rAF; el trazo en curso se queda a medias sin estado especial. `restart` limpia el tablero al 0 %. `endNow` fuerza `gameover`. `destroy` quita listeners.

Un matiz de HUD: el **porcentaje conquistado en el nivel actual** (la métrica que el jugador mira todo el rato) no tiene campo en `EngineState`. Se pinta dentro del canvas — que además es donde tiene sentido, superpuesto al área ya reclamada. No es bloqueante, pero conviene decidirlo en el spec y no improvisarlo.

## Coste

**Medio-alto**, y baja a **medio** con la condición de la rejilla. Las partes difíciles, concretas:

1. **Decidir qué mitad se rellena.** Al cerrar un trazo, el tablero queda partido en dos regiones y hay que rellenar **la que no contiene al Qix**. Con rejilla se resuelve con un flood fill desde la celda del Qix: lo alcanzado sigue libre, lo demás se reclama. Con polígonos hay que hacer point-in-polygon y booleanas de áreas: mucho más caro y mucho más frágil.
2. **Colisión del Qix contra el trazo en curso.** El Qix es un segmento que rota y se desplaza; si toca la línea que estás dibujando, pierdes vida. Es colisión segmento-vs-polilínea, y hay que evaluarla **por sub-pasos** o el Qix la cruza entre frames a alta velocidad. Mismo problema de tunneling que `pinball`, pero acotado a un objeto.
3. **Recorrido de los Sparx por el borde.** El borde cambia de forma cada vez que reclamas área, así que los Sparx no siguen un rectángulo fijo: recorren el **grafo de aristas vivas**, que hay que reconstruir tras cada cierre. Es la parte que más silenciosamente se rompe.
4. **Movimiento del Qix.** Errático pero no aleatorio puro: es un vaivén con inercia angular. Es tuning, no algoritmia.

## Alternativas consideradas

- **Volfied / Gals Panic** (Qix con jefes y sprite de fondo) — misma mecánica, más contenido, sin aportar nada al leaderboard. Descartado por scope.
- **Versión sin Sparx** (solo el Qix) — quita el punto 3, que es el más frágil, y deja el juego perfectamente jugable: sin Sparx, el riesgo de quedarse quieto en el borde desaparece, así que habría que compensar con un temporizador por nivel. **Es el recorte recomendado para el spec si el coste asusta.**
- **Rejilla gruesa (celdas de 4–8 px)** — abarata todo y da un aspecto pixelado que encaja con el tema CRT. Recomendado.
- **`dig-dug`** (evaluado en paralelo): también modifica el terreno, pero excavando pasillos, no reclamando superficie; y su análisis llega a la misma conclusión de aceptar rejilla en vez de máscara por píxel. Coinciden en técnica, no en mecánica.

## Notas para el futuro

- Lo que cambiaría el veredicto a "encaja, prioridad alta": que el catálogo necesite variedad más que equilibrio de categorías. Qix es la mecánica más distinta de todo lo evaluado hasta hoy — el argumento en contra es casi solo que sería otro ARCADE en una categoría ya cargada.
- Lo que lo empeora: insistir en trazado vectorial libre o en fidelidad al Qix original (dos Qix enlazados en niveles altos).
- Decisión pendiente para el spec: rejilla o polígonos, y si entran los Sparx en v1. Ambas son la diferencia entre coste medio y alto.
- No exige tocar CHECKs de `cat`/`color` ni ampliar `EngineState`.
