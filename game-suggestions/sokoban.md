---
tema: Sokoban (empujar cajas hasta las metas)
fecha: 2026-07-30
estado: rechazado
spec: —
---

# SOKOBAN

## Pregunta original

Evaluar Sokoban como candidato para el catálogo de Arcade Vault.

## Veredicto

**No encaja.** Choca de frente con la restricción del leaderboard: la métrica natural de Sokoban es "menos movimientos = mejor", y la plataforma ordena `scores` **descendente** (índice `(game_id, score desc)` en `20260729180408_create_games_and_scores.sql`). Además es el único candidato evaluado cuyo contenido no es procedural: exige diseñar niveles a mano, uno a uno.

## Ficha técnica (si se reconsiderara)

- id: `bodeguero`
- cat: PUZZLE
- color: yellow
- cover: `cover-bodeguero` (nueva)
- score: no existe uno natural. La única formulación viable sería `Σ por nivel resuelto de (1000 + max(0, par − movimientos) × 50)` dentro de un límite de tiempo global — es decir, inventar un sistema de puntos que Sokoban no tiene.
- lives: n/a — no hay muerte, solo bloqueo y deshacer. level: número de nivel, mapeo directo.
- input: flechas, movimiento discreto por celda.

## Encaje con el contrato de engine

Mecánicamente **impecable**: rejilla, movimiento discreto, colisión trivial (empujar si la celda siguiente está libre). `pause/resume/restart/destroy` son de una línea. Ese no es el problema.

Los dos desajustes reales con el contrato:

1. **`endNow()` no tiene semántica.** En los cuatro engines vivos significa "termina y quédate con el score que llevas". Aquí no hay score que llevar si no se ha completado un nivel, y no hay estado de fracaso: un jugador atascado no pierde, se queda ahí. `status: "dead"` nunca ocurre.
2. **`lives` queda vacío** y el HUD compartido de `GamePlayer` muestra un campo muerto.

## Coste

**Medio en código, alto en contenido.** El engine se escribe en una tarde; lo caro es lo otro: hacen falta 15-30 niveles diseñados, validados como resolubles y ordenados por dificultad, más detección de _deadlock_ (caja en esquina = nivel irresoluble) para poder ofrecer reinicio o deshacer. Ningún otro candidato del historial exige autoría de contenido: asteroides, tetris, arkanoid, snake, tuberías y ranaria generan su dificultad proceduralmente.

## Por qué se rechaza

1. **Orden del leaderboard invertido.** Arreglarlo exige o cambiar el índice/consulta por juego (contamina el modelo de datos para uno solo) o inventar puntos que desvirtúan el juego.
2. **Sesión no acotada.** Un jugador puede estar quince minutos en un nivel. La plataforma está pensada para sesiones cortas con score al final.
3. **Autoría de niveles.** Coste que no es de programación y que no se puede recortar en el spec.
4. **Sin estado de derrota**, el bucle "juega → muere → sube score" que comparten los cuatro engines vivos no aplica.

## Alternativas consideradas

- **Sokoban contrarreloj** (resolver tantos niveles como se pueda en 5 minutos): resuelve el orden del leaderboard y la sesión larga, pero no la autoría de niveles y convierte el juego en otro. Es la única vía de reconsideración.
- **Generador procedural de niveles Sokoban**: existe la técnica, pero generar puzzles buenos y resolubles es un proyecto en sí mismo. Muy por encima del coste de Glotón, que ya es el techo del catálogo.
- **Otro PUZZLE en su lugar**: Pipe Mania (ver [pipe-mania.md](./pipe-mania.md)) cubre la misma necesidad de categoría sin ninguno de estos problemas.

## Notas para el futuro

- Este análisis aporta una **regla generalizable** para `restricciones.md`: los juegos cuya métrica natural es _minimizar_ (movimientos, tiempo, intentos) no encajan mientras el leaderboard ordene `score desc`. Aplica también a laberintos cronometrados, speedruns y solitarios por movimientos.
- Qué cambiaría el veredicto: (a) que el leaderboard admita métricas ascendentes por juego, o (b) que el usuario acepte la variante contrarreloj **y** aporte o apruebe un set de niveles.
