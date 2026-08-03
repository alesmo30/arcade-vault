---
tema: Whac-A-Mole (topos que asoman)
fecha: 2026-07-30
estado: rechazado
spec: —
---

# WHAC-A-MOLE

## Pregunta original

Evaluar Whac-A-Mole como candidato para el catálogo de Arcade Vault.

## Veredicto

**No encaja.** Es, mecánicamente, el mismo juego que ya se rechazó como "dianas neón" el 2026-07-30 ([juegos-catalogo-2026-q3.md](./juegos-catalogo-2026-q3.md), candidato 5): aparición aleatoria + clic de reflejos, sin profundidad más allá del tiempo de reacción. Que sea un clásico reconocible corrige una de las tres objeciones de aquel rechazo, pero no las otras dos.

## Ficha técnica (si se reconsiderara)

- id: `topos`
- cat: ARCADE
- color: green
- cover: `cover-topos` (nueva — no hay huérfana que sirva; las seis libres son de otros temas)
- score: 100 por topo golpeado, ×combo por aciertos consecutivos, −50 por golpear al topo bueno/bomba
- lives / level: lives = 3 fallos permitidos; level = tanda, sube la frecuencia de aparición y baja la ventana de reacción
- input: puntero sobre 9 agujeros; alternativa teclado 1-9 o QWE/ASD/ZXC

## Encaje con el contrato de engine

Perfecto y trivial: `pause/resume` congelan temporizadores, `restart` resetea marcador y tanda, `endNow` fuerza `gameover`, `destroy` quita listeners. Ningún estado se sale de `EngineState`. El contrato no es el problema aquí.

## Coste

**Bajo.** No hay parte difícil real: temporizadores por agujero y hit-testing de rectángulos. El único trabajo con sustancia sería el arte de la portada y el _juice_ (sacudida, partículas) para que no se sienta vacío.

## Por qué se rechaza pese al coste bajo

1. **Duplicación del veredicto anterior.** El hueco de "puntero" ya se decidió cubrir como input alternativo de un engine existente, no como juego propio.
2. **Leaderboard degenerado.** El score mide latencia de ratón y tasa de refresco tanto como habilidad. Los cuatro engines vivos premian decisiones; este premia hardware.
3. **Profundidad nula.** Sin física, sin colisiones, sin planificación. Es el candidato con menos aprendizaje por partida de todos los evaluados hasta hoy.

## Alternativas consideradas

- **Variante 100% teclado** (rejilla 3×3 mapeada a QWE/ASD/ZXC): elimina la objeción del hardware de puntero y lo convierte en un juego de precisión motora tipo _rhythm_. Sigue sin aportar profundidad; es la única vía de reconsideración y aun así queda por detrás de cualquier candidato de `juegos-catalogo-2026-q3.md`.
- **Como minijuego bonus dentro de otro engine**: descartado, no hay soporte de minijuegos en la plataforma.

## Notas para el futuro

- Qué cambiaría el veredicto: que el usuario pida explícitamente un juego de sesión ultracorta (< 30 s) de coste mínimo para rellenar catálogo rápido. En ese escenario, la variante de teclado es defendible.
- Registrar en `restricciones.md` (Vetos) el patrón general, no solo este juego: **juegos de reflejo puro con objetivo estático** (dianas, topos, "pulsa cuando se ponga verde") quedan fuera por leaderboard degenerado. Ya son dos rechazos por la misma razón.
