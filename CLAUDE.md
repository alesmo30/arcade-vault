# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

All commands, architecture, spec workflow, and language rules live in AGENTS.md above — keep it as the single source of truth; don't re-duplicate here.

## Skills

Usa siempre /frontend-design para diseñar la interfaz de usuario.

## Current state

Branch `main`, specs 01–09 written and merged (`specs/01…09`). Live: landing, `/games` catalog, game detail, player, `/salon-de-la-fama`, `/acerca-de` con Resend, sesión local falsa en `/auth`. Cuatro motores en `app/games/engines/`: asteroides, tetris, arkanoid, snake. Datos y leaderboard en Supabase (migraciones en `supabase/migrations/`).

Next spec number: **10**.
