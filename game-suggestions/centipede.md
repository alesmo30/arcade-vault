---
tema: Centipede como candidato del catálogo
fecha: 2026-07-30
estado: propuesto
spec: —
---

# CENTIPEDE

## Pregunta original

Evaluar Centipede (Atari, 1981) como candidato para Arcade Vault, dentro de un lote de cinco clásicos.

## Veredicto

**Encaja con condiciones.** Mecánica y puntuación encajan sin fricción, pero es el tercer SHOOTER potencial del catálogo y su coste real está en el enjambre de sistemas secundarios (araña, pulga, escorpión). Condición: **recortar el alcance al núcleo** — ciempiés + campo de setas + araña — y dejar los demás bichos fuera del primer spec.

## Ficha técnica

- id: `ciempies`
- cat: SHOOTER
- color: green
- cover: `cover-ciempies` (nueva; las seis huérfanas no encajan)
- score: 10 por segmento de cuerpo, 100 por cabeza, 1 por seta destruida, 5 por seta reparada entre oleadas, 300–900 por araña según cercanía
- lives: 3 disparadores. level: oleada; cada una añade un ciempiés más corto suelto y sube la velocidad
- input: flechas (movimiento libre en la banda inferior, ~4 filas de alto) + espacio para disparo rápido. Puntero opcional como input alternativo

## Encaje con el contrato de engine

Directo. Todo el estado relevante (score, vidas, oleada) cabe en `EngineState`. El campo de setas es una rejilla de enteros (0–4 de daño) que se conserva entre vidas y se repara entre oleadas: estado interno del engine, invisible para el contrato.

`pause/resume/destroy` triviales. `restart` debe regenerar el campo de setas con la misma distribución aleatoria inicial. `endNow` cierra en `gameover` sin ceremonia.

## Coste

**Medio-alto.** La parte difícil concreta es la **lógica de división del ciempiés**: cada segmento es un nodo de una lista enlazada que recorre la rejilla en zigzag; al recibir un impacto en mitad del cuerpo hay que partir la cadena en dos ciempiés independientes, convertir el segmento siguiente en cabeza y darle dirección propia. Sumado a eso, el descenso al chocar contra una seta (no solo contra el borde) hace que el campo de setas y el pathing estén acoplados: cada seta destruida cambia la ruta de todos los ciempiés vivos. Es fácil de romper y difícil de depurar.

El escorpión (que envenena setas y hace que un ciempiés caiga en picado) y la pulga (que suelta setas en columna) son sistemas adicionales cada uno con su propio comportamiento: por eso la condición de recorte.

## Alternativas consideradas

- **Millipede** (la secuela): más variedad de enemigos, mismo núcleo, más coste. Sin ventaja.
- **Versión sin campo de setas destructible**: bajaría el coste a medio-bajo, pero el juego deja de ser Centipede — el terreno que se degrada partida a partida _es_ la mecánica. Descartado.
- **Cat ARCADE**: hay disparo continuo hacia arriba contra enemigos; SHOOTER es lo correcto.

## Notas para el futuro

- Depende del orden del roadmap: si entran `invasores` y `misiles` antes, Centipede es el tercer o cuarto SHOOTER y el punto en contra de "repetir categoría" pesa mucho más. Su mejor momento es _en lugar de_ uno de ellos, no después de ambos.
- Frente a `invasores`: no es duplicación real (aquí el jugador se mueve en 2 ejes, los enemigos bajan por un terreno mutable y hay disparo rápido sin cadencia limitada), pero visualmente ambos son "formación que baja".
- Qué cambiaría el veredicto a "encaja" sin condiciones: que el usuario acepte dos specs o que se renuncie a escorpión/pulga de forma permanente.
- El original usaba trackball. El puntero sería el input más fiel y reutilizaría el helper de coordenadas de canvas que propone el análisis de Missile Command.
