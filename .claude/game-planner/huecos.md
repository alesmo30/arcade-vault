# Huecos del catálogo

Qué falta cubrir. Sirve para no proponer siempre la misma mecánica.

## Estado (2026-07-30)

Engines implementados — `app/games/engines/registry.ts`:

| id         | mecánica dominante         | categoría |
| ---------- | -------------------------- | --------- |
| asteroides | disparo con inercia, 360°  | SHOOTER   |
| tetris     | encaje de piezas por caída | PUZZLE    |
| arkanoid   | rebote con paleta          | ARCADE    |
| snake      | crecimiento en rejilla     | ARCADE    |

Reparto por categoría: ARCADE 2 / SHOOTER 1 / PUZZLE 1 / VERSUS 0. Siguiente `sort` libre: **12**.

## Huecos detectados

- **VERSUS** — categoría declarada en `CATS` y sin ningún juego. Choca con la restricción de "un jugador": requeriría IA rival local (tipo Pong contra CPU). Candidato evaluado y viable: `duelo-pixel`, coste bajo.
- Sin juego de **plataformas** ni de **laberinto/persecución** (tipo Pac-Man). Candidato evaluado: `gloton`, coste alto (IA de fantasmas + laberinto).
- Sin juego de **reflejos puros** de sesión ultracorta (< 60 s). Candidato evaluado: `ranaria` (Frogger), coste medio.
- Ninguna mecánica basada en **puntero/ratón**; los cuatro engines usan teclado. **Decisión 2026-07-30:** se cubre mejor como input alternativo de un engine existente que como juego propio.

## Portadas huérfanas (activo reutilizable)

`app/globals.css` conserva clases `cover-*` del seed borrado en `20260730172600_remove_placeholder_games.sql`. Antes de diseñar una portada nueva, comprobar aquí:

`cover-duelo` · `cover-invaders` · `cover-glot` · `cover-rana` · `cover-bricks` · `cover-rocas`

(`cover-bricks` y `cover-rocas` pertenecían a clones de arkanoid y asteroides: la clase es reciclable, el juego no. `cover-invaders` tiene dos pretendientes — `invasores` y `galaga` — son mutuamente excluyentes, solo uno se la queda.)

Portadas nuevas propuestas en el lote de 25 (aún no existen en CSS, hay que crearlas si el juego avanza): `cover-burbujas` (bubble-shooter), `cover-qix` (qix), `cover-bombas` (bomberman).

## Lote de 25 candidatos (2026-07-30)

Evaluación masiva para explorar el catálogo completo. Detalle y ficha técnica de cada uno en su archivo de `game-suggestions/`; listado y vetos ya reflejados en `index.md` y `restricciones.md`.

**Propuestos (16):** duelo-pixel, invasores, ranaria, gloton, bubble-shooter, galaga, qix, bomberman, 2048, centipede, corredor-infinito, dig-dug, flappy-bird, match-3-gemas, missile-command, pinball, pipe-mania, qbert, simon, tank-battle, tron-motos-luz.

**Rechazados (9):** dianas neón, peggle, worms-artilleria, tower-defense, bowling-curling, air-hockey, conecta-4, sokoban, whac-a-mole.

**Duplicados internos a resolver antes de spec** (mismo hueco, elegir uno):

- VERSUS barato: `duelo-pixel` (Pong) vs `tron-motos-luz` — ambos viables, `duelo-pixel` es más barato y va primero.
- SHOOTER de formación: `invasores` vs `galaga` — comparten `cover-invaders`, mismo asiento de catálogo.
- ARCADE de escenario destructible en rejilla: `dig-dug` vs `bomberman` — ambos coste alto, prioridad baja, elegir uno.
- PUZZLE de segunda entrada: `2048`, `match-3-gemas`, `pipe-mania`, `bubble-shooter`, `simon` compiten entre sí por el mismo hueco (PUZZLE hoy solo tiene tetris); no hay presupuesto de catálogo para los cinco.

_Actualiza estas tablas cuando entre un engine nuevo._
