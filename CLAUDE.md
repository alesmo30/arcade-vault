# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

All commands, architecture, spec workflow, and language rules live in AGENTS.md above — keep it as the single source of truth; don't re-duplicate here.

## Skills

Usa siempre /frontend-design para diseñar la interfaz de usuario.

## Agents

`game-planner` (`.claude/agents/game-planner.md`) — decide qué juego encaja en la plataforma. Úsalo antes de `/spec` cuando la pregunta sea "¿qué juego agregamos?", "¿encaja X?" o "qué falta en el catálogo". No escribe código ni specs: su salida es el insumo del spec.

Su memoria está partida en dos y no se mezcla:

- `.claude/game-planner/` — base de conocimiento que gobierna el juicio: `restricciones.md` (vetos y límites técnicos), `huecos.md` (mecánicas sin cubrir), `index.md` (índice del historial).
- `game-suggestions/` — registro histórico, un `.md` por consulta respondida (`busca-minas.md`). Inmutable: se escribe una vez; solo cambia el campo `estado` del frontmatter cuando el juego avanza.

Consulta el índice antes de reevaluar un juego — si ya está analizado, el análisis ya se pagó.

`game-jam` (`.claude/agents/game-jam.md`) — el usuario da un tema, un juego o una descripción libre, y el agente escribe **dos specs completos y rivales del mismo juego** en `specs/game-jam/<gameid>/` (`spec-a-<enfoque>.md`, `spec-b-<enfoque>.md`) más un `README.md` comparativo con recomendación y supuestos. Los dos specs difieren en un eje estructural (modelo de fracaso, progresión, fuente de score, ritmo…), nunca en cosmética. Solo escribe dentro de `specs/game-jam/`: nada de código, SQL, CSS ni llamadas MCP.

`skin-designer` (`.claude/agents/skin-designer.md`) — se ejecuta **después** de que el juego esté implementado. Recibe un game id o una descripción ("el de la serpiente"), audita si el juego deja elegir skin durante la partida y, si falta, la implementa. Skins mínimas: `clasico` (default, idéntico al look actual), `neon`, `retro`. Solo capa visual: nunca cambia mecánica, timing ni puntuación. El selector es React en el HUD, nunca dentro del canvas.

`game-porter` (`.claude/agents/game-porter.md`) — se ejecuta **después** de `/spec-impl`, para juegos **nuevos** solamente. Conecta el gamepad táctil ya existente (`app/components/touch-pad.tsx`, `app/games/engines/controls.ts`, spec 10) al motor del juego nuevo, implementando `setControl` para que reutilice la misma ruta interna que el teclado. Nunca toca `asteroides`, `tetris`, `arkanoid` ni `snake` — ya migrados — ni diseña UI de controles nueva.

Flujo de decisión: `game-planner` (¿qué juego?) → `game-jam` (¿qué versión de ese juego?) → elegir variante y copiarla a `specs/NN-slug.md` con `Status: Aprobado` → `/spec-impl` → `game-porter` (¿responde al táctil?) → `skin-designer` (¿tiene sus tres skins?). Para un solo spec sin variantes, sigue siendo `/add-game`.

## Current state

Branch `main`, specs 01–09 written and merged (`specs/01…09`). Live: landing, `/games` catalog, game detail, player, `/salon-de-la-fama`, `/acerca-de` con Resend, sesión local falsa en `/auth`. Cuatro motores en `app/games/engines/`: asteroides, tetris, arkanoid, snake. Datos y leaderboard en Supabase (migraciones en `supabase/migrations/`).

Next spec number: **10**.
