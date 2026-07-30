# Restricciones y vetos

Reglas duraderas para evaluar candidatos. Vinculantes para `game-planner`.

## Técnicas (derivadas de la arquitectura actual)

- Canvas 2D, TypeScript sin framework. Nada de React ni DOM dentro del engine.
- Un solo jugador local. No hay multijugador ni red.
- El engine debe caber en `GameEngineFactory` + `EngineState { score, lives, level, status }` (`app/games/engines/types.ts`).
- El leaderboard guarda **un entero** por partida (`scores.score >= 0`). Juego sin puntuación numérica natural: no encaja.
- `player_name` ≤ 20 caracteres; la sesión de `/auth` es falsa, solo prellena el nombre.
- Categorías cerradas por CHECK en la tabla `games`: `ARCADE | PUZZLE | SHOOTER | VERSUS`. Añadir otra exige migración.
- Colores cerrados: `cyan | magenta | yellow | green`.
- Alta de juego = engine + entrada en `registry.ts` + migración que inserta la fila en `games`. Los tres, o el juego está roto.

## Vetos

_(ninguno registrado)_

Formato: `- **<juego/género>** — <fecha> — <razón>`
