---
tema: Tank Battle estilo Battle City contra CPU
fecha: 2026-07-30
estado: propuesto
spec: —
---

# TANK BATTLE (ESTILO BATTLE CITY)

## Pregunta original

¿Encaja un Battle City (tanques contra CPU, base a defender, terreno destructible) como juego VERSUS?

## Veredicto

**Encaja con condiciones.** El juego sí encaja en la plataforma, pero **no como VERSUS**: no es un duelo 1v1, es un shooter de oleadas contra tanques IA con una base que defender. Su categoría honesta es `SHOOTER`. Condiciones: (1) recategorizar, (2) aceptar coste alto, (3) entrar después de al menos un engine barato — y preferiblemente después de `invasores`, porque si no SHOOTER acumula dos juegos caros seguidos.

## Ficha técnica

- id: `tanques`
- cat: **SHOOTER** (no VERSUS)
- color: green
- cover: `cover-tanques` (**nueva**). `cover-rocas` está libre y es reciclable como base geométrica, pero su lenguaje visual es de asteroides; conviene retocarla o partir de `cover-bg` con dos siluetas de oruga y ladrillo.
- score: 100/200/300/400 por tanque enemigo según tipo + bonus por etapa completada sin perder la base + bonus por vidas restantes al final
- lives / level: lives = 3 tanques del jugador; level = etapa (mapa). La **base destruida = game over inmediato**, aunque queden vidas.
- input: flechas para mover/encarar (movimiento en 4 direcciones sobre rejilla) + Espacio para disparar

## Encaje con el contrato de engine

Encaja, con un coste declarado: `EngineState` no tiene campo para la **salud de la base**, que es la condición de derrota principal y debería verse siempre. Se pinta dentro del canvas (icono del águila con su estado), no en el HUD. Igual pasa con los power-ups temporales (pala/escudo/congelación): se representan en el canvas.

`pause/resume` congelan el rAF; `restart` recarga la etapa 1 y resetea el mapa destruido; `endNow` fuerza `gameover`; `destroy` limpia listeners. Nada de esto es problemático.

## Coste

**Alto.** Tres frentes difíciles a la vez:

1. **Terreno destructible por sub-celda.** Los muros de ladrillo de Battle City se rompen en cuartos de celda, no en celdas enteras; es lo que da su tacto. Implica una rejilla de colisión de resolución doble a la del movimiento y decidir qué cuartos elimina cada impacto según la dirección del proyectil.
2. **IA de los tanques enemigos.** Navegación por rejilla hacia la base o hacia el jugador, con disparo oportunista y sin que se atasquen en esquinas ni se apelotonen en el spawn.
3. **Datos de etapas.** Battle City es un juego de mapas; con un solo mapa se agota en dos partidas. Hay que diseñar al menos 4–5 layouts o un generador con reglas.

Comparable a `gloton` en esfuerzo; probablemente dos specs.

## Alternativas consideradas

- **Tanques 1v1 en arena, sin base ni etapas** (versión VERSUS de verdad): baja el coste a medio y sí justificaría `cat: VERSUS`, pero pierde la identidad de Battle City y se acerca a un duelo de disparo genérico. Es el plan B si lo que se quiere es cerrar VERSUS y no hacer un shooter grande.
- **Mantenerlo como VERSUS con la base**: descartado, la etiqueta engañaría al filtro del catálogo (`/games` filtra por `cat`) y el jugador que busque duelo encontrará un juego de oleadas.
- **Recortar el terreno destructible a celdas enteras**: baja el coste a medio-alto y es la simplificación recomendada si se aprueba.

## Notas para el futuro

- Qué cambiaría el veredicto a "no": que ya estén dentro `invasores` y `asteroides` funcionando y el catálogo tenga tres SHOOTER; a partir de ahí es duplicación de categoría con el engine más caro del lote.
- Qué lo abarata de golpe: celdas enteras destructibles + tres etapas + un solo tipo de tanque enemigo con dos velocidades. Con eso baja a **medio** y cabe en una spec.
- No exige tocar los CHECK de `cat`/`color` ni ampliar `EngineState`, siempre que la salud de la base viva en el canvas.
