---
tema: Peggle (pinball de clavijas / pachinko)
fecha: 2026-07-30
estado: rechazado
spec: —
---

# PEGGLE (PINBALL DE CLAVIJAS)

## Pregunta original

¿Encaja un Peggle — apuntar un cañón arriba, soltar una bola que rebota entre clavijas y las va apagando — en Arcade Vault?

## Veredicto

**No encaja.** Ya fue descartado de pasada al evaluar `pinball` el mismo día ([pinball.md](./pinball.md), sección "Alternativas consideradas": _"misma familia física pero sin flippers ni control real del jugador; el score sería casi azar y el leaderboard mediría suerte"_). Al analizarlo a fondo, la conclusión se mantiene y se refuerza: **paga el coste de física de `pinball` sin comprar su profundidad de control**.

## Ficha técnica

_(a título informativo; el juego no se propone)_

- id: `clavijas`
- cat: ARCADE
- color: magenta
- cover: requeriría `cover-clavijas` nueva, habiendo seis huérfanas sin usar. Punto en contra adicional.
- score: puntos por clavija apagada, con multiplicador creciente y bonus por clavijas naranjas. **Este es el problema**, ver abajo.
- lives: bolas restantes (10 en el original). level: tablero.
- input: ←/→ o puntero para el ángulo del cañón, Espacio para soltar.

## Por qué se rechaza

1. **El score mide suerte, no habilidad.** El jugador toma **una sola decisión por bola**: el ángulo. Todo lo demás — cuántas clavijas se apagan, si la bola cae en el cubo bonus — lo decide un sistema caótico: cada rebote amplifica el error del ángulo inicial, de modo que dos tiros casi idénticos dan resultados radicalmente distintos. El leaderboard de Arcade Vault ordena por `score desc`: premiaría a quien tuvo la mejor cascada afortunada, no a quien juega mejor. Es exactamente la objeción que hundió a "dianas neón" (el score mide algo que no es habilidad), pero por caos en vez de por reflejos.
2. **Coste de física alto, idéntico al de `pinball`.** Colisión círculo-vs-círculo continua con restitución, riesgo de tunneling con la bola a alta velocidad, y bolas que se quedan atrapadas rebotando eternamente entre dos clavijas (hay que detectarlo y forzar la salida). Todo el motor caro de `pinball`, sin flippers que justifiquen haberlo escrito.
3. **Sin control continuo, no hay tensión arcade.** En `pinball` el jugador interviene durante toda la vida de la bola; en Peggle mira. Apuntar y esperar 15 segundos rompe la línea de reflejos del catálogo.
4. **Contenido no procedural.** Los tableros de Peggle son diseño a mano (la gracia son las formas de las clavijas). Es la misma objeción que rechazó `sokoban`: exige diseñar niveles uno a uno. Generarlos al azar produce tableros insípidos.

## Alternativas consideradas

- **`pinball` con mesa de rejilla** — misma familia física, pero con control continuo del jugador y un score que sí distingue habilidad. Si el usuario quiere "bola que rebota con neón", ese es el camino ya evaluado y aprobable.
- **Peggle con puntería asistida** (línea de trayectoria que predice varios rebotes) — reduce el azar, pero para predecir N rebotes hay que simular la física por adelantado cada frame: **más caro que el juego**, y además lo convierte en un puzle de cálculo sin tensión.
- **Pachinko puro** — todavía peor: ni siquiera se elige el ángulo.

## Notas para el futuro

- Lo único que cambiaría el veredicto: convertirlo en un **puzle determinista** (sin caos: rebotes en ángulos fijos sobre rejilla, trayectoria totalmente predecible) donde el score sea "clavijas apagadas por bola" y el jugador pueda razonar el tiro. Eso ya no es Peggle, es otro juego, y merecería una entrada nueva.
- Este rechazo confirma un patrón que conviene tener presente al evaluar: **candidatos donde el jugador decide una vez por intento y luego observa** (Peggle, pachinko, y en menor grado el bowling) siempre tienen problema de leaderboard. El criterio útil es "¿cuántas decisiones toma el jugador por punto ganado?".
- Se propone anotar en `restricciones.md` el veto a la familia pachinko/Peggle, con esta razón.
