---
tema: Missile Command como candidato del catálogo
fecha: 2026-07-30
estado: propuesto
spec: —
---

# MISSILE COMMAND

## Pregunta original

Evaluar Missile Command (Atari, 1980) como candidato para Arcade Vault, dentro de un lote de cinco clásicos.

## Veredicto

**Encaja — prioridad alta.** Es el único clásico reconocible que justifica el input de puntero, un hueco abierto del catálogo, y su estado cabe entero en `EngineState` sin forzar nada.

Matiz importante frente al historial: el 2026-07-30 se rechazó un juego de puntero ("dianas neón") por _no ser un clásico reconocible_ y por _profundidad mecánica mínima_. Missile Command no cae en ninguno de los dos casos: es un clásico canónico y su profundidad no está en la puntería sino en la anticipación (disparar donde el misil _estará_) y en la gestión de munición entre tres baterías. La decisión registrada de "el puntero se cubre mejor como input alternativo de un engine existente" se refería a inventar un juego alrededor del ratón; aquí el ratón viene con el juego.

## Ficha técnica

- id: `misiles`
- cat: SHOOTER
- color: yellow
- cover: `cover-misiles` (nueva; ninguna de las seis huérfanas encaja temáticamente)
- score: 25 por misil enemigo destruido, ×multiplicador de oleada (1×, 2×, 3×…, tope 6×); bonus de fin de oleada de 5 por cada misil sin usar y 100 por cada ciudad en pie
- lives: ciudades en pie (6 al empezar); `dead` cuando cae una ciudad, `gameover` con cero. level: número de oleada
- input: puntero para apuntar (posición del retículo) + clic o `Z`/`X`/`C` para elegir batería izquierda/centro/derecha. Fallback de teclado: flechas mueven el retículo, espacio dispara

## Encaje con el contrato de engine

Directo en los cinco métodos. `pause/resume` congelan el rAF y los temporizadores de las explosiones; `restart` repone ciudades, munición y oleada; `endNow` cierra en `gameover` con el score acumulado (incluido el bonus de la oleada en curso, decisión a fijar en el spec); `destroy` quita el listener de `pointermove` del canvas.

Un solo detalle: la munición restante por batería (30 misiles repartidos en 3×10) no tiene campo en `EngineState`. Se pinta dentro del canvas sobre cada silo, como en el original — no es motivo para ampliar el contrato.

## Coste

**Medio.** La parte difícil concreta es la **cadena de explosiones**: cada explosión es un círculo que crece y decrece con el tiempo, y debe detectar colisión contra misiles enemigos _durante toda su vida_, generando nuevas explosiones en cascada. Requiere resolver colisiones círculo-vs-segmento por frame contra una lista que cambia dentro del propio bucle. El resto (misiles como interpolación lineal origen→destino, trazado de la estela, MIRV que se dividen a media altura) es aritmética simple.

Segunda dificultad menor: el puntero necesita coordenadas relativas al canvas escalado (`getBoundingClientRect` + ratio), algo que ningún engine actual hace todavía. Vale la pena extraerlo como helper reutilizable, porque el spec de arkanoid/duelo-pixel con ratón lo necesitará igual.

## Alternativas consideradas

- **Reciclar `cover-rocas`** en vez de portada nueva: no encaja, esa clase pinta asteroides. Se acepta el coste de una portada nueva porque el resto del encaje es fuerte.
- **Versión solo-teclado** (retículo movido con flechas): más barata, pero mata la sensación del juego y desaprovecha justo el hueco que viene a cubrir. Se propone el teclado como _fallback_, no como input principal.
- **Cat ARCADE en vez de SHOOTER**: se dispara, hay proyectiles y enemigos; SHOOTER es la lectura honesta, aunque deje esa categoría con más peso.

## Notas para el futuro

- Es el candidato que mejor cierra el hueco de "ninguna mecánica basada en puntero" sin romper la línea de clásicos del catálogo.
- Qué cambiaría el veredicto: que el usuario decida que la plataforma es solo-teclado (móvil/táctil incluido). En ese caso Missile Command pierde su razón de ser aquí.
- Sin final: el juego no se gana, se aguanta. Encaja perfecto con un leaderboard de score entero.
- El helper de coordenadas de puntero sobre canvas escalado es reutilizable; conviene que lo cree este spec y no uno posterior.
- Reparto de categorías si entra: SHOOTER pasaría a 2 (o 3 si antes entra `invasores`). Tenerlo en cuenta al ordenar el roadmap.
