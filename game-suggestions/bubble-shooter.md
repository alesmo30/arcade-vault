---
tema: Bubble Shooter estilo Puzzle Bobble
fecha: 2026-07-30
estado: propuesto
spec: —
---

# BUBBLE SHOOTER (PUZZLE BOBBLE)

## Pregunta original

¿Encaja un bubble shooter estilo Puzzle Bobble (apuntar y disparar burbujas de color a un techo, reventar grupos de 3+) en Arcade Vault?

## Veredicto

**Encaja.** Es el mejor segundo PUZZLE del lote junto a `tuberias`: score entero natural y creciente, **condición de fin propia e inequívoca** (el techo baja hasta la línea de muerte), clásico reconocible de 1994 y estética de bolas de neón que le va como un guante al tema CRT. No se solapa con tetris (no hay caída de piezas ni compactación de filas).

## Ficha técnica

- id: `burbujas`
- cat: PUZZLE
- color: cyan
- cover: `cover-burbujas` (**nueva**). Ninguna huérfana encaja. Propuesta: rejilla hexagonal de círculos cyan/magenta/yellow arriba y un cañón apuntando con línea punteada de trayectoria.
- score: 10 × n por grupo reventado con n≥3, más 20 por cada burbuja **huérfana** que cae al perder contacto con el techo (la caída en cascada es donde está el score grande, igual que en el original), más bonus por burbujas sobrantes al limpiar el tablero. Techo abierto: buen rango para el leaderboard.
- lives: n/a real. Opción: usarlo como "avisos" antes de que baje el techo (cada N disparos sin reventar nada, el techo baja una fila) — mapea bien y da información útil en el HUD.
- level: tablero/pantalla limpiada. Cada nivel arranca con más filas y más colores.
- input: ←/→ para el ángulo del cañón, Espacio para disparar. **Puntero opcional** para apuntar: es de los pocos candidatos donde el ratón es natural sin ser obligatorio, lo que encaja con la decisión de `huecos.md` de tratar el puntero como input alternativo.

## Encaje con el contrato de engine

Directo, y de los más limpios evaluados. `pause/resume` congelan el rAF (la burbuja en vuelo es el único objeto en movimiento continuo, así que reanudar no tiene el problema de acumulador que sí tiene `pinball`). `restart` regenera el tablero inicial. `endNow` fuerza `gameover` con el acumulado. `destroy` quita listeners. `EngineState` cubre todo; el color de la burbuja actual y la siguiente se pintan en el canvas.

## Coste

**Medio.** La parte difícil es la geometría de la rejilla y la conectividad, no la física:

1. **Rejilla hexagonal con filas desplazadas.** Cada celda tiene 6 vecinas y las filas pares/impares se desplazan medio diámetro. Convertir la posición de impacto de la burbuja a la celda libre correcta (snapping) es la fuente clásica de bugs: burbujas que se pegan flotando o que se solapan.
2. **Doble recorrido de grafo por disparo.** Primero flood fill por color desde la burbuja recién pegada para detectar el grupo de 3+; después, si reventó, un segundo recorrido desde la fila del techo para marcar lo alcanzable y **hacer caer todo lo no marcado**. Ambos son BFS sobre pocas decenas de celdas: baratos de ejecutar, fáciles de escribir mal.
3. **Rebote en paredes laterales.** Trivial (reflexión de la componente x), pero la línea guía punteada que lo previsualiza tiene que reproducir exactamente el mismo cálculo o el juego se siente injusto.

Sin física continua, sin IA, sin diseño de niveles a mano (los tableros se generan aleatoriamente con semilla de dificultad). Eso lo mantiene muy por debajo de `pinball` o `gloton`.

## Alternativas consideradas

- **`gemas` (match-3 estilo Bejeweled)**, evaluado en paralelo: mismo territorio de "emparejar colores", pero su análisis lo condiciona a inventarle un modo finito porque el match-3 clásico no termina solo. Bubble shooter **no tiene ese problema**: el techo que baja es la condición de fin, y viene de fábrica. Si hay que elegir un solo puzzle de color, este gana.
- **Rejilla cuadrada en vez de hexagonal**: baja el coste del punto 1 casi a cero, pero se pierde el ángulo de tiro interesante y queda un match-3 disfrazado. No compensa.
- **Bust-A-Move con techo que baja por tiempo** en vez de por disparos fallidos: añade presión pero castiga al jugador que piensa. El original castiga por disparos, y es la elección correcta.

## Notas para el futuro

- Lo que cambiaría el veredicto a "encaja con condiciones": que se quiera el modo infinito de los bubble shooters modernos (filas nuevas por arriba sin fin). Ahí reaparece el problema de `gemas` — el score mide aguante, no habilidad. **El modo por tableros finitos es parte del veredicto positivo, no un detalle.**
- Duda abierta para el spec: si `lives` son avisos hasta la bajada del techo o si se deja en `n/a` y todo se pinta en canvas. Recomendación: usarlos como avisos, el HUD queda vacío si no.
- Aporte de catálogo: segundo PUZZLE (hoy solo tetris) y primera mecánica de **apuntado angular** del catálogo.
- No exige tocar CHECKs de `cat`/`color` ni ampliar `EngineState`.
