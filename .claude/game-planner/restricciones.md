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

- **Juegos cuya métrica natural es minimizar (menos movimientos, menos tiempo, menos golpes)** — 2026-07-30 — el índice `(game_id, score desc)` ordena el leaderboard de mayor a menor; un juego donde "menos es mejor" (ej. Sokoban) queda invertido salvo que se transforme la métrica, y eso deja de medir lo que el juego mide de verdad.
- **Juegos por turnos con resultado binario (gana/pierde/empata)** — 2026-07-30 — sin score numérico natural que crezca con la habilidad (ej. Conecta 4, Worms/artillería); cualquier score inventado (turnos usados, fichas colocadas) es un envoltorio artificial.
- **Juegos con score de techo cerrado y bajo** (ej. bolos: máximo 300) — 2026-07-30 — el leaderboard se satura rápido y dejan de diferenciar habilidad entre los primeros puestos.
- **Juegos que exigen menús o UI de selección dentro del canvas** (ej. Tower Defense: elegir y colocar torres) — 2026-07-30 — el contrato `GameEngineFactory` no tiene hueco para eso sin salirse del canvas de juego; además implica sesión larga, no la sesión corta que busca la plataforma.

Formato: `- **<juego/género>** — <fecha> — <razón>`
