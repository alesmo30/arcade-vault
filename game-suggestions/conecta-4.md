---
tema: Conecta 4 contra CPU
fecha: 2026-07-30
estado: rechazado
spec: —
---

# CONECTA 4 (CONTRA CPU)

## Pregunta original

¿Encaja un Conecta 4 contra la CPU como juego VERSUS?

## Veredicto

**No encaja.** Choca de frente con la restricción dura del leaderboard: una partida de Conecta 4 termina en **ganas / pierdes / empatas**, no en un entero. Cualquier score que se invente (fichas colocadas, turnos usados, rachas) es un envoltorio artificial alrededor de un resultado binario, y el salón de la fama dejaría de medir habilidad. Además es un juego de mesa por turnos sin presión de tiempo: rompe con la línea arcade de reflejos del catálogo.

## Ficha técnica

_(documentada solo para dejar claro por qué no cuadra)_

- id: `conecta-4`
- cat: VERSUS (sería la etiqueta correcta, y es lo único que juega a su favor)
- color: yellow
- cover: exigiría clase nueva `cover-conecta` — habiendo seis huérfanas sin usar, es coste añadido sin contrapartida
- score: **no existe uno natural.** Las opciones forzadas que se consideraron:
  - victorias consecutivas contra CPU de dificultad creciente → mide constancia, y una racha se corta por un descuido, no por falta de destreza
  - 1000 − turnos usados para ganar → premia ganar rápido, pero contra un minimax decente el margen de variación es de 2–3 turnos: el leaderboard se aplana y se empata en masa
  - fichas del rival bloqueadas → contable pero incomprensible para el jugador
- lives / level: lives = n/a (no hay concepto de vida). level = dificultad del minimax; mapear "nivel" a "profundidad de búsqueda" no le dice nada al HUD.
- input: puntero sobre columna, o ←/→ + Espacio para soltar

## Encaje con el contrato de engine

Técnicamente el contrato se cumple —`pause` en un juego por turnos es trivial, `restart` limpia el tablero, `endNow` cierra la partida—, pero `EngineState` queda medio vacío: `lives` sin significado y `level` como sinónimo de dificultad elegida. Cumplir el contrato rellenándolo de campos huecos es la señal de que el juego no pertenece aquí.

## Coste

**Bajo-medio** en código (tablero 7×6, detección de 4 en línea, minimax con poda alfa-beta a 5–6 de profundidad es un algoritmo estándar y rápido), pero el coste no es el problema: el problema es el encaje. Un juego barato que ensucia el leaderboard es peor negocio que uno caro que lo enriquece.

## Alternativas consideradas

- **Modo "supervivencia": N partidas seguidas contra CPU cada vez más fuerte, score = partidas ganadas.** Es el mejor intento de rescatarlo, pero convierte una sesión corta en una sesión de 10–15 minutos por intento, contra el criterio de sesión corta de la plataforma.
- **Conecta 4 con reloj (tipo blitz), score = tiempo sobrante acumulado.** Añade presión arcade, pero es un juego distinto y el reloj no arregla que el resultado siga siendo binario.
- **Otros juegos de mesa por turnos** (damas, gato, Othello): el mismo defecto exacto. Este rechazo aplica al género completo.

## Notas para el futuro

- Este análisis vale como precedente para **todo juego de mesa por turnos contra CPU**: sin score numérico natural, no encaja. No hace falta reanalizar damas, Othello ni ajedrez.
- Qué cambiaría el veredicto: que la plataforma añada un segundo tipo de resultado en `scores` (p. ej. victorias/derrotas o un ELO) — cambio de esquema, RLS y de toda la UI del salón de la fama. Muy caro para un solo juego.
- Nota de coherencia: el hueco de VERSUS lo cierran mejor `duelo-pixel` (coste bajo) o `estelas` (Tron), que sí producen enteros de verdad.
