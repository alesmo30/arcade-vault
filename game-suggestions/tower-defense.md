---
tema: Tower Defense simple de un jugador
fecha: 2026-07-30
estado: rechazado
spec: —
---

# TOWER DEFENSE

## Pregunta original

¿Encaja un tower defense sencillo de un jugador — colocar torres junto a un camino, oleadas de enemigos, economía de oro — en Arcade Vault?

## Veredicto

**No encaja.** Es el candidato del lote que peor encaja con la **forma** de la plataforma, no con su tecnología. Sesión larga, ritmo de estrategia en vez de reflejos, y sobre todo: exige una **interfaz de menús dentro del canvas** (selector de torre, panel de mejora, indicador de oro) que el contrato de engine no contempla y que `GamePlayer` no puede ayudar a pintar.

## Ficha técnica

_(a título informativo; el juego no se propone)_

- id: `torres`
- cat: PUZZLE (no hay categoría de estrategia; ya es señal)
- color: green
- cover: requeriría `cover-torres` nueva.
- score: oleadas superadas × 1000 + enemigos eliminados + oro sin gastar. Es un entero razonable — este criterio **sí** lo pasa.
- lives: fugas permitidas antes de perder (20 en el género). Mapea bien.
- level: oleada actual. Mapea bien.
- input: puntero para colocar y mejorar torres.

## Por qué se rechaza

1. **UI dentro del canvas.** El engine es TypeScript sin framework y sin DOM fuera del canvas (`restricciones.md`). Un tower defense necesita, como mínimo: paleta de tipos de torre con precios, previsualización de alcance al arrastrar, panel de torre seleccionada con botones de mejora y venta, contador de oro y botón de "siguiente oleada". Todo eso habría que **dibujarlo a mano y gestionar sus hitboxes dentro del engine**: es escribir un mini toolkit de widgets en canvas. Es el coste real y está fuera de lo que la arquitectura quiere.
2. **Sesión larga.** Una partida son 15–30 minutos. El resto del catálogo se juega en 2–5. Choca con el criterio de sesión corta y con el overlay de pausa/game-over del player, pensado para partidas rápidas y reintentos.
3. **No es reflejos, es planificación.** Entre oleadas no pasa nada; durante la oleada el jugador mira. Rompe la línea del catálogo igual que el rechazo de artillería por turnos.
4. **Sin identidad arcade retro.** El género nace en el flash de 2007. Todo el catálogo son clásicos de salón recreativo reconocibles: es la misma objeción por la que se rechazó "dianas neón".
5. **Pathfinding y balanceo.** Si el camino es fijo, no hay pathfinding pero tampoco decisiones interesantes; si las torres bloquean el paso, hace falta A\* recalculado por cada colocación y detección de bloqueo total. Y el balanceo económico (curva de precios contra curva de dureza de oleadas) es diseño iterativo puro, no código: sin él, el juego es trivial o imposible.

## Alternativas consideradas

- **Tower defense sin economía** (torres fijas colocadas al inicio, sin oro ni mejoras) — elimina casi toda la UI, pero también todo el juego: queda un shooter automático que el jugador observa. Peor.
- **`missile-command`** (evaluado en paralelo, prioridad alta) — es la versión arcade y correcta de "defender algo con puntero": acción continua, sesión corta, clásico de 1980, sin menús. **Si lo que se busca es un juego de defensa con ratón, ese es el candidato, y ya está aprobado.**
- **Tower defense por oleadas con colocación contrarreloj** (10 s entre oleadas para colocar) — añade tensión, pero no arregla la UI en canvas ni la duración total.

## Notas para el futuro

- Lo único que reabriría esto: que la plataforma permitiese al engine exponer una UI React fuera del canvas (un panel lateral gestionado por `GamePlayer`). Sería un cambio del contrato `GameEngineFactory`, con impacto en los cuatro engines vivos. No compensa por un solo juego.
- Criterio reutilizable que sale de aquí: **si el juego necesita menús, no encaja**. El contrato solo entrega un canvas y cuatro números; cualquier candidato cuya jugabilidad viva en widgets (inventarios, tiendas, árboles de mejora) queda fuera por construcción. Vale la pena anotarlo en `restricciones.md`.
- El score sí era válido; el rechazo no es por el leaderboard. No confundir este caso con `conecta-4` o `sokoban`.
