---
tema: Recomendaciones de juegos para el catálogo (Q3 2026)
fecha: 2026-07-30
estado: propuesto
spec: —
---

# JUEGOS PARA EL CATÁLOGO — Q3 2026

## Pregunta original

El usuario no pide un juego concreto: pide recomendaciones de juegos nuevos que encajen en Arcade Vault, a partir de los huecos del catálogo.

## Estado verificado del catálogo (2026-07-30)

Un juego cuenta como existente solo con engine + registry + fila en migración. Cumplen los cuatro:

| id         | cat     | mecánica dominante         | color   | cover            | sort |
| ---------- | ------- | -------------------------- | ------- | ---------------- | ---- |
| asteroides | SHOOTER | disparo con inercia 360°   | cyan    | cover-asteroides | 8    |
| tetris     | PUZZLE  | encaje de piezas por caída | magenta | cover-tetris     | 9    |
| arkanoid   | ARCADE  | rebote con paleta          | magenta | cover-arkanoid   | 10   |
| snake      | ARCADE  | crecimiento en rejilla     | green   | cover-snake      | 11   |

Siguiente `sort` libre: **12**. Specs escritas: 01–09; siguiente número **10**.

Hallazgo relevante: `app/globals.css` **ya contiene clases cover sin usar**, sobrantes del seed original borrado por
`20260730172600_remove_placeholder_games.sql`: `cover-duelo`, `cover-invaders`, `cover-glot`, `cover-rana`, `cover-bricks`, `cover-rocas`.
Cualquier candidato que reutilice una de ellas se ahorra el paso de diseño de portada.

Contrapunto de coste: `references/templates/started-games/` solo trae fuentes de arranque para asteroids, tetris y arkanoid.
Todo candidato nuevo se escribe desde cero.

## Veredicto

Cuatro candidatos encajan; uno se rechaza. Orden recomendado: **Duelo Pixel → Invasores → Ranaria → Glotón**.

---

## Candidato 1 — DUELO PIXEL (Pong contra CPU) — encaja, prioridad alta

Cierra la única categoría vacía (`VERSUS`) y es el engine más barato de los cinco.

### Ficha técnica

- id: `duelo-pixel`
- cat: VERSUS
- color: cyan
- cover: `cover-duelo` (ya existe en `globals.css`, sin usar)
- score: puntos anotados a la CPU × 100, más bonus por rally largo. Partida a 11 puntos o hasta que la CPU llegue a 11.
- lives: puntos que le quedan al jugador antes de perder (11 − puntos de la CPU), mostrado como vidas. level: velocidad de bola / dificultad de la CPU, sube cada 3 puntos.
- input: flechas ↑/↓ o W/S; opcional puntero vertical.

### Encaje con el contrato de engine

Directo. `pause/resume` congelan el rAF; `restart` resetea marcador y saca de nuevo; `endNow` fuerza `gameover` con el score actual; `destroy` quita listeners. `EngineState` cubre todo sin forzar nada.

### Coste

**Bajo.** La parte difícil es el _tuning_ de la IA rival: una paleta que persigue la `y` de la bola con error e inercia limitados, para que sea vencible al principio y dura al final. Física trivial (AABB + reflexión con ángulo según punto de impacto, igual que arkanoid).

### Riesgo

"VERSUS" con un solo jugador humano es un ligero abuso semántico de la categoría. Es aceptable: el texto del seed original ya lo describía como "modo solitario contra la CPU".

---

## Candidato 2 — INVASORES (Space Invaders) — encaja, prioridad alta

### Ficha técnica

- id: `invasores`
- cat: SHOOTER
- color: green
- cover: `cover-invaders` (ya existe, sin usar)
- score: puntos por alienígena según fila (10/20/30) + OVNI bonus (50–300)
- lives: 3 cañones. level: oleada, cada una arranca más abajo y más rápido.
- input: ←/→ + Espacio

### Encaje con el contrato de engine

Directo. Estado enteramente representable; sin necesidades fuera de `EngineState`.

### Coste

**Bajo-medio.** La parte difícil es la _sensación_: la aceleración de la formación conforme quedan menos enemigos (el latido característico) y los búnkeres destructibles por píxel. Los búnkeres son opcionales y se pueden dejar fuera del primer spec.

### Riesgo

Segundo SHOOTER. La mecánica es claramente distinta a asteroides (raíl horizontal + formación vs. inercia 360°), así que no es duplicación real, pero deja `SHOOTER` con dos entradas y `PUZZLE` con una.

---

## Candidato 3 — RANARIA (Frogger) — encaja, prioridad media

Cubre el hueco de "reflejos de sesión corta" sin ser un juego de disparos ni de rejilla-crecimiento.

### Ficha técnica

- id: `ranaria`
- cat: ARCADE
- color: green
- cover: `cover-rana` (ya existe, sin usar)
- score: 10 por carril avanzado + 50 por nenúfar alcanzado + bonus por tiempo restante
- lives: 3 ranas. level: fila de nenúfares completada; sube velocidad y densidad de tráfico.
- input: flechas (movimiento discreto por carril)

### Encaje con el contrato de engine

Directo. El temporizador por intento se pausa con `pause()` sin complicaciones.

### Coste

**Medio.** La parte difícil es el acarreo: la rana montada en un tronco debe moverse con él y morir al salir de pantalla — es la fuente clásica de bugs de colisión de este género. El resto es tráfico en carriles, trivial.

### Riesgo

Tercer ARCADE. Aporta mecánica nueva (cruce con temporizador), pero desequilibra el reparto por categoría.

---

## Candidato 4 — GLOTÓN (Pac-Man) — encaja con condiciones, prioridad baja

Es el hueco más grande del catálogo (laberinto/persecución) y también el engine más caro.

### Ficha técnica

- id: `gloton`
- cat: ARCADE
- color: yellow
- cover: `cover-glot` (ya existe, sin usar)
- score: 10 por punto, 50 por píldora, 200/400/800/1600 por fantasma encadenado
- lives: 3. level: laberinto limpiado.
- input: flechas con _buffering_ de giro

### Encaje con el contrato de engine

Encaja, pero `EngineState` se queda corto para el HUD: el modo _frightened_ (píldora activa y su cuenta atrás) no tiene campo. Se puede pintar dentro del canvas en lugar de exponerlo — decisión a tomar en el spec, no un bloqueante.

### Coste

**Alto.** Tres partes difíciles a la vez: (1) IA de los cuatro fantasmas con personalidades distintas y ciclos scatter/chase, (2) datos del laberinto y navegación por celdas con túnel lateral, (3) _feel_ del giro anticipado. Es el único candidato que probablemente necesite dos specs.

### Recomendación

Dejarlo para cuando entren primero uno o dos engines baratos. Alto valor, mal momento.

---

## Candidato 5 — Juego de reflejos con puntero (tipo "dianas neón") — rechazado

Cubriría dos huecos de golpe (input de puntero, sesión < 60 s), pero se rechaza:

- Sin identidad arcade retro: no es un clásico reconocible, rompe con la línea del catálogo.
- Requiere clase `cover-*` nueva mientras hay seis sin usar.
- Profundidad mecánica mínima: el leaderboard se convierte en una medición de reflejos y hardware (tasa de refresco, latencia del ratón) más que de habilidad.

El hueco de puntero se cubre mejor como **input alternativo** en un engine existente (la paleta de arkanoid o de duelo-pixel con ratón) que como juego propio.

## Alternativas consideradas y descartadas antes de la ficha

- **Breakout / "Bloque Buster"** (`cover-bricks` libre): duplica exactamente arkanoid. Descartado.
- **"Rocas"** (`cover-rocas` libre): duplica asteroides bajo otro nombre. Descartado; la clase cover se puede reciclar para otro juego de disparo.
- **Plataformas** (tipo Donkey Kong): hueco real, pero exige física de salto, tilemap y diseño de niveles — coste mayor que Glotón y con menos identidad de "clásico de una pantalla".
- **Segundo PUZZLE** (Columns / 2048): equilibraría categorías, pero 2048 no es canvas-natural y Columns se solapa fuerte con tetris.

## Notas para el futuro

- Las seis clases `cover-*` huérfanas son un activo: se identificaron mirando `globals.css` contra las filas vivas de `games`. Si entra un juego nuevo, comprobar primero si ya tiene portada.
- Reparto por categoría tras cada alta: hoy ARCADE 2 / SHOOTER 1 / PUZZLE 1 / VERSUS 0. Vale la pena no dejar que ARCADE se dispare.
- Lo que cambiaría el veredicto de Glotón: que el usuario acepte partir el trabajo en dos specs, o que se relaje la fidelidad de la IA de fantasmas (cuatro perseguidores con ruido, sin scatter/chase real) — con eso baja a coste medio.
- Duda abierta en Duelo Pixel: si `score` deben ser los puntos anotados o los rallies sobrevividos. Los rallies dan una curva de leaderboard más rica; los puntos son más legibles. Decidir en el spec.
- Ningún candidato exige tocar los CHECK de `cat` ni de `color`, ni ampliar `EngineState`.
