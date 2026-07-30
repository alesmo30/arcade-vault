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

## Current state

Branch `main`, specs 01–09 written and merged (`specs/01…09`). Live: landing, `/games` catalog, game detail, player, `/salon-de-la-fama`, `/acerca-de` con Resend, sesión local falsa en `/auth`. Cuatro motores en `app/games/engines/`: asteroides, tetris, arkanoid, snake. Datos y leaderboard en Supabase (migraciones en `supabase/migrations/`).

Next spec number: **10**.
