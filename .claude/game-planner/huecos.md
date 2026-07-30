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

## Huecos detectados

- **VERSUS** — categoría declarada en `CATS` y sin ningún juego. Choca con la restricción de "un jugador": requeriría IA rival local (tipo Pong contra CPU).
- Sin juego de **plataformas** ni de **laberinto/persecución** (tipo Pac-Man).
- Sin juego de **reflejos puros** de sesión ultracorta (< 60 s).
- Ninguna mecánica basada en **puntero/ratón**; los cuatro engines usan teclado.

_Actualiza esta tabla cuando entre un engine nuevo._
