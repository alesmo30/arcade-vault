---
tema: Endless Runner estilo Chrome Dino
fecha: 2026-07-30
estado: propuesto
spec: —
---

# CORREDOR INFINITO (ENDLESS RUNNER)

## Pregunta original

¿Encaja un endless runner de scroll lateral estilo "Chrome Dino" (correr, saltar y agacharse ante obstáculos que llegan cada vez más rápido) en Arcade Vault?

## Veredicto

**Encaja** — es el candidato más barato que queda y cierra el hueco declarado de "reflejos puros de sesión ultracorta" (`huecos.md`, 2026-07-30) sin duplicar ninguna mecánica de los cuatro engines vivos. Su score es distancia, el entero más natural posible para el leaderboard.

## Ficha técnica

- id: `corredor`
- cat: ARCADE
- color: yellow
- cover: `cover-runner` (**nueva**; ninguna de las seis huérfanas — `cover-duelo`, `cover-invaders`, `cover-glot`, `cover-rana`, `cover-bricks`, `cover-rocas` — encaja temáticamente). Propuesta: horizonte con línea de suelo en amarillo y siluetas de cactus/obstáculos en scroll, sobre `cover-bg`.
- score: distancia recorrida en decímetros (`floor(distancia)`), incrementada por el tick del rAF a la velocidad actual. Opcional: ×2 durante fase de noche.
- lives: 1 (impacto = muerte; sin vidas, el HUD muestra `1`). level: escalón de velocidad, sube cada 500 puntos.
- input: Espacio / ↑ para saltar, ↓ para agacharse. Un solo botón basta si se recorta el agacharse.

## Encaje con el contrato de engine

Directo, sin fricción. `pause/resume` congelan el rAF y el acumulador de distancia; `restart` resetea distancia, velocidad y spawner; `endNow` emite `gameover` con la distancia actual; `destroy` quita los listeners de teclado. `EngineState { score, lives, level, status }` cubre el 100% del HUD: no hay ningún estado que no quepa.

## Coste

**Bajo.** No hay parte realmente difícil: física de salto = una parábola con gravedad constante, colisiones = AABB contra 2-4 obstáculos en pantalla. Lo único que exige mimo es la **curva de dificultad y el spawner**: la separación mínima entre obstáculos debe escalar con la velocidad, o a partir de cierto punto el juego se vuelve imposible por generación injusta en vez de por habilidad. Regla práctica: distancia mínima entre obstáculos = velocidad × tiempo de vuelo del salto × 1.2.

Segundo detalle barato pero visible: el suelo y el fondo deben scrollear con parallax de al menos dos capas o el juego se siente muerto.

## Alternativas consideradas

- **Runner vertical (tipo Doodle Jump)**: mismo coste, pero la cámara que sigue hacia arriba complica el scroll y el score se vuelve "altura", menos legible. Además el input táctil/inclinación no aplica aquí.
- **Runner de tres carriles (tipo Subway Surfers)**: más profundo, pero pide perspectiva pseudo-3D que choca de frente con el look plano neón/CRT del resto del catálogo.
- Se eligió el de un solo raíl por ser el que menos superficie de bug tiene y el que mejor lee en un canvas 2D plano.

## Notas para el futuro

- Objeción honesta: **no es un clásico de recreativa**. Es un easter egg de navegador de 2014, no una máquina de salón. Rompe ligeramente la línea "clásicos reconocibles" del catálogo. Si el usuario prioriza fidelidad retro, esto pierde frente a Invasores o Ranaria; si prioriza coste y variedad de sesión, gana a los dos.
- Alternativa de identidad si molesta el origen: reskin como "moto de rejilla" o "nave rasante" en clave neón — mismo engine, estética más Arcade Vault. Cambiar solo sprites y nombre, cero coste extra de motor.
- Deja el reparto en ARCADE 3 / SHOOTER 1 / PUZZLE 1 / VERSUS 0. Es el punto débil: ARCADE se dispara. Si el usuario quiere equilibrar categorías antes que coste, meter `duelo-pixel` primero.
- Lo que cambiaría el veredicto: nada técnico. Solo una decisión de línea editorial ("solo clásicos de recreativa") lo tumbaría.
