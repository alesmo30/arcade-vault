---
tema: Pinball (flipper)
fecha: 2026-07-30
estado: propuesto
spec: —
---

# PINBALL / FLIPPER

## Pregunta original

¿Encaja un pinball de una mesa (flippers, bumpers, rampas, bola que cae) en Arcade Vault?

## Veredicto

**Encaja con condiciones** — la puntuación de pinball es el mejor score de leaderboard de todo el catálogo (entero grande, de rango amplio, con techo abierto) y la estética de mesa neón es un regalo para el tema CRT. Pero el motor de física es el más caro de cuanto se ha evaluado hasta hoy, incluido Glotón. Solo entra si se acepta una **mesa fija y simple**, congelada en el spec.

## Ficha técnica

- id: `pinball`
- cat: ARCADE
- color: magenta
- cover: `cover-pinball` (**nueva**). Ninguna huérfana sirve. Propuesta: dos flippers en V magenta abajo, tres círculos-bumper arriba y una bola con estela.
- score: acumulado por evento — bumper 100, target derribado 500, rampa completada 1 000, combo/multiplicador ×2–×5 mientras dure la bola. Va directo a `scores.score`.
- lives: 3 bolas (el "ball 1/3" clásico mapea perfecto sobre `lives`). level: multiplicador activo, o número de bola en juego. **Decidir en el spec**: multiplicador es más informativo, número de bola es redundante con `lives`.
- input: ←/→ para flipper izquierdo/derecho, ↓ mantenido para cargar el lanzador, Espacio para el "nudge" (empujón con penalización de tilt). El nudge es opcional en v1.

## Encaje con el contrato de engine

Encaja, con un matiz. `pause/resume` congelan el integrador de física (cuidado: al reanudar hay que resetear el acumulador de `deltaTime` o la bola da un salto de teletransporte). `restart` recoloca bola 1 y resetea el score y los targets. `endNow` fuerza `gameover` con el acumulado. `destroy` quita listeners.

`EngineState` se queda corto en un punto: el **multiplicador activo** y los targets pendientes no tienen campo propio. Se resuelve pintándolos dentro del canvas (que es además donde el pinball los pinta de verdad, en el backglass) o reutilizando `level` como multiplicador. No es bloqueante.

## Coste

**Alto.** La parte difícil, concreta, es la física continua:

1. **Tunneling.** La bola de pinball es el objeto más rápido de cualquier juego del catálogo. Con colisión discreta atraviesa paredes finas entre frames. Exige colisión por barrido (swept circle-vs-segment) o sub-stepping del integrador — decisión que hay que tomar en el spec, no improvisar.
2. **Flippers rotatorios.** No son cuerpos estáticos: transfieren momento angular a la bola. Un flipper mal modelado o no golpea, o dispara la bola a velocidad absurda. Es el punto donde se juega todo el "feel" del juego.
3. **Geometría de la mesa.** Toda la mesa se modela como una lista de segmentos y arcos con coeficiente de restitución propio. Diseñar una mesa que sea _jugable_ (que la bola no se atasque, que haya rutas repetibles) es diseño de nivel real, no solo código.

Sin librería de física (y no hay ninguna en el proyecto, ni debe haberla: el contrato pide TS sin dependencias), esto es de largo el engine más grande. Estimación honesta: **dos specs**, uno para el motor de bola+flippers y otro para la mesa y el scoring.

## Alternativas consideradas

- **Pachinko / peggle**: misma familia física pero sin flippers ni control real del jugador; el score sería casi azar y el leaderboard mediría suerte. Descartado.
- **Breakout con física libre** (`cover-bricks` huérfana): reduce el problema a colisión círculo-AABB, pero eso ya es arkanoid. Descartado por duplicación.
- **Pinball con mesa de rejilla** (todo alineado a ejes, sin rampas curvas): baja el coste a medio y mata el tunneling contra diagonales. Pierde bastante encanto, pero es el plan B real si el usuario quiere pinball ya.

## Notas para el futuro

- Lo que cambiaría el veredicto a "encaja, prioridad alta": aceptar la **mesa de rejilla / geometría solo de segmentos rectos y círculos**, sin rampas ni bolas múltiples. Con eso el coste cae a medio y cabe en un spec.
- Lo que lo empeora: multibola, mesas desbloqueables, misiones encadenadas. Todo eso es scope creep clásico del género; debe ir explícitamente en "lo que NO entra" del spec.
- Aporte de catálogo: mecánica genuinamente nueva (física continua con restitución), y el único juego donde el score puede llegar a seis cifras — le da variedad al Salón de la Fama, hoy dominado por rangos parecidos.
- Recomendación de orden: después de al menos un engine barato. Alto valor, alto riesgo, mal primer plato.
