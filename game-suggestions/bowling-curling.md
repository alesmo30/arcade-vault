---
tema: Bowling / curling mini de un jugador
fecha: 2026-07-30
estado: rechazado
spec: —
---

# BOWLING / CURLING MINI

## Pregunta original

¿Encaja un mini juego de bowling o de curling de un jugador — apuntar, medir fuerza, soltar — en Arcade Vault?

## Veredicto

**No encaja**, en ninguna de las dos variantes, aunque por razones distintas y ambas de fondo:

- **Bowling** tiene un score entero real pero **con techo cerrado en 300**, y el leaderboard de Arcade Vault ordena `score desc` sin límite: se saturaría en la franja alta con empates masivos, el mismo defecto que obligó a condicionar a `simon`, pero aquí sin arreglo posible sin dejar de ser bowling.
- **Curling** es peor: puntúa entre 1 y 8 por end, resultado prácticamente binario contra un rival. Es el problema de `conecta-4`.

A eso se suma, en ambos, el patrón identificado en [peggle.md](./peggle.md): **el jugador decide una vez por intento y luego observa**.

## Ficha técnica

_(a título informativo; el juego no se propone)_

- id: `bolos`
- cat: ARCADE
- color: cyan
- cover: requeriría `cover-bolos` nueva, habiendo seis huérfanas sin usar.
- score: bowling estándar con strikes y spares. Rango real de un jugador humano: 60–200 de un máximo de 300.
- lives: n/a. **No hay condición de fallo**: no se puede "perder" en bowling, solo puntuar poco. level: frame 1–10, mapeo forzado.
- input: ←/→ posición inicial, barra de fuerza con Espacio, segunda barra para el efecto.

## Por qué se rechaza

1. **Techo de score cerrado.** 300 es el máximo absoluto. Todo el catálogo tiene puntuación de techo abierto (asteroides, tetris, arkanoid, snake escalan sin límite), y el Salón de la Fama está construido sobre esa premisa. Un juego con rango 0–300 produce una tabla plana y llena de empates; con suficientes jugadores, la cabeza se llena de 200 idénticos y el orden lo decide quién jugó antes.
2. **No hay estado de fallo.** `lives` no aplica, `status: "dead"` no aplica. Toda partida dura exactamente 10 frames y termina igual. El player (`GamePlayer`) gira alrededor de perder vidas y reintentar: aquí no hay tensión que perder.
3. **Una decisión por tirada, y luego mirar.** Mismo defecto que Peggle. Entre "soltar la bola" y "ver los bolos caer" pasan 3 segundos de nada. Sin acción continua no hay reflejo, y el catálogo se define por reflejos.
4. **Física de bolos engañosamente cara.** Diez cilindros que colisionan entre sí y se transmiten impulso en cadena. Es colisión círculo-círculo con restitución y masa: no es `pinball`, pero tampoco es barato, y hacer que el "strike" se sienta justo (no aleatorio) requiere calibración fina. Se paga física continua para un juego sin tensión.
5. **Sin identidad de salón recreativo 2D.** El bowling arcade real es físico (bolera, o Skee-Ball). En pantalla, la referencia es 3D y en perspectiva; la versión canvas 2D cenital pierde toda la gracia visual.

## Alternativas consideradas

- **Skee-Ball / lanzamiento a dianas con rampa** — más arcade, score de techo abierto si se juega contrarreloj. Pero cae directo en el rechazo ya registrado de "dianas neón" y `whac-a-mole`: apuntar y acertar, sin profundidad.
- **Bowling contrarreloj con frames infinitos** ("¿cuántos bolos tiras en 90 segundos?") — **esto sí abriría el techo del score** y añadiría presión. Es el único enfoque que salvaría el candidato, pero deja de ser bowling: es un juego de puntería rápida, y entonces compite en desventaja con `missile-command`, que ya está aprobado y es un clásico de verdad.
- **Curling contra CPU como VERSUS** — llenaría la categoría vacía, pero suma el problema de score de `conecta-4` al de "una decisión por intento". Descartado sin dudarlo.

## Notas para el futuro

- Regla útil que se consolida aquí, junto con [peggle.md](./peggle.md): **dos filtros rápidos para descartar candidatos** — (a) ¿el score tiene techo cerrado? (b) ¿cuántas decisiones toma el jugador por punto ganado? Bowling falla los dos.
- Lo único que reabriría esto: la variante contrarreloj con frames infinitos, y solo si el catálogo se queda sin candidatos de puntería. Merecería entrada nueva, no revivir esta.
- El coste (medio-bajo) no es el motivo del rechazo; aunque fuese trivial de implementar, seguiría sin encajar.
