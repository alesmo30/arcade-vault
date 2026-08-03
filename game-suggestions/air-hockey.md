---
tema: Air Hockey contra CPU
fecha: 2026-07-30
estado: rechazado
spec: —
---

# AIR HOCKEY (CONTRA CPU)

## Pregunta original

¿Encaja un Air Hockey contra la CPU como juego VERSUS del catálogo?

## Veredicto

**No encaja** — es mecánicamente el mismo juego que `duelo-pixel` (Pong contra CPU, ya evaluado y prioritario): paleta controlada por el jugador, paleta IA que persigue el proyectil, marcador a N goles. Ocuparía el mismo hueco VERSUS con más coste de física y ninguna mecánica nueva. Además el rebote con paleta ya está en `arkanoid`.

## Ficha técnica

_(se documenta por si `duelo-pixel` se descarta; hoy no se propone su implementación)_

- id: `disco-neon`
- cat: VERSUS
- color: cyan
- cover: `cover-duelo` (huérfana, pero está reservada para `duelo-pixel`) → exigiría una clase nueva `cover-disco`
- score: goles anotados a la CPU × 100 + bonus por diferencia final y por tiempo restante
- lives / level: lives = goles que le quedan al jugador antes de perder (7 − goles de la CPU); level = dificultad/velocidad del disco, sube cada 2 goles
- input: puntero (arrastre 2D del mazo) o WASD; a diferencia de Pong el mazo se mueve en dos ejes dentro de su mitad

## Encaje con el contrato de engine

Directo, igual que Pong. `pause/resume` congelan el rAF; `restart` resetea marcador y saca; `endNow` cierra con `gameover`; `destroy` quita listeners de puntero. `EngineState` cubre todo.

## Coste

**Medio** (frente a **bajo** de `duelo-pixel`). La parte difícil concreta: colisión círculo-círculo con transferencia de momento entre mazo y disco. El mazo se mueve en dos ejes y arrastrado por puntero, así que su velocidad hay que derivarla del delta de posición por frame; sin _clamping_ el disco atraviesa el mazo (tunneling) o sale disparado a velocidad absurda. Pong evita todo eso con reflexión en un solo eje.

## Alternativas consideradas

- `duelo-pixel` (Pong contra CPU): cubre el mismo hueco VERSUS con menos de la mitad del código y ya está evaluado como candidato prioritario. Gana.
- Air hockey con puntero como argumento para cerrar el hueco de input de ratón: ya hay decisión previa (2026-07-30) de cubrir ese hueco como input alternativo de un engine existente, no con un juego propio.

## Notas para el futuro

- Qué cambiaría el veredicto: que el usuario descarte `duelo-pixel` (por considerar Pong demasiado visto) y quiera igualmente cerrar VERSUS con un juego de paleta. Air Hockey es entonces el sustituto natural y esta ficha se reusa tal cual.
- Si alguna vez entra Air Hockey **con** Pong ya implementado, el reparto de categorías queda con dos VERSUS que son el mismo juego: mal negocio, salvo que el segundo aporte modo de dos mazos por puntero simultáneo, que la plataforma no soporta (un jugador por sesión).
