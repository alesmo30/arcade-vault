---
tema: Simon (memoria de secuencias)
fecha: 2026-07-30
estado: propuesto
spec: —
---

# SIMON — SECUENCIA

## Pregunta original

Evaluar Simon (el juego de memoria de secuencias de colores y sonidos, MB 1978) como candidato para el catálogo.

## Veredicto

**Encaja con condiciones.** Es un clásico reconocible, de coste muy bajo, cubre el hueco de sesión ultracorta y suma a `PUZZLE` (hoy con un solo juego). La condición es el score: la ronda alcanzada, tal cual, produce un leaderboard con rango minúsculo y empates masivos.

## Ficha técnica

- id: `secuencia`
- cat: PUZZLE
- color: yellow
- cover: `cover-secuencia` (nueva — cuatro cuadrantes neón encendiéndose; ninguna huérfana encaja)
- score: **no** la ronda pelada. `score = Σ(ronda × 100) + bonus de velocidad por pulsación`, donde el bonus decae con el tiempo de respuesta. Así dos jugadores que llegan a la ronda 14 no empatan y el número crece de forma legible.
- lives: 1 por defecto (un error termina la partida); alternativa de 3 vidas si se quiere curva más suave. level: la ronda actual, que es también la longitud de la secuencia.
- input: teclado — flechas ↑/←/↓/→ mapeadas a los cuatro pads (o Q/W/A/S). El puntero queda como input alternativo, coherente con la decisión de 2026-07-30 sobre el hueco de puntero.

## Encaje con el contrato de engine

Directo, con un matiz de máquina de estados. El engine alterna dos fases —_reproduciendo secuencia_ y _esperando al jugador_— y `pause()` debe congelar la reproducción sin perder el índice: al hacer `resume()`, lo correcto es **repetir la secuencia desde el principio**, no reanudar a mitad, o se regala información. Decisión para el spec.

`restart` vacía la secuencia y arranca en ronda 1. `endNow` marca `gameover` con el score acumulado. `destroy` quita listeners y cancela el temporizador de reproducción. `EngineState` cubre todo (`level` = ronda).

## Coste

**Bajo.** La parte difícil no es la lógica (una lista de 0-3 y un índice) sino el _feel_: los tiempos de encendido/apagado y su aceleración por ronda son todo el juego. Si el ritmo está mal calibrado, se percibe como roto. Segundo punto: el audio. Simon sin los cuatro tonos pierde la mitad de su identidad, y hoy **ningún engine del repo emite sonido** — introducirlo implica decidir política de audio (WebAudio, mute por defecto, permiso del navegador) para toda la plataforma. Eso es lo que puede empujar el spec de bajo a medio.

## Alternativas consideradas

- **Score = ronda alcanzada.** Rechazado: rango típico 5-20, empates constantes, y duplica exactamente el campo `level` del HUD.
- **Categoría ARCADE.** Rechazado: ARCADE ya tiene 2 de 4 juegos y esto es memoria pura, no acción. `PUZZLE` es el encaje correcto y equilibra el reparto.
- **Modo "Simon dice" con secuencia infinita generada.** Es lo mismo con otro nombre; sin ganancia.

## Notas para el futuro

- **Este es el primer candidato que exige audio.** Si entra, arrastra una decisión de plataforma que afecta a los cuatro engines existentes. Conviene resolverla en su spec y dejarla escrita.
- Qué cambiaría el veredicto a "no encaja": que el usuario decida que el audio no entra en la plataforma. Simon mudo es jugable pero desangelado; aun así seguiría siendo el engine más barato pendiente junto a `duelo-pixel`.
- Reparto por categoría si entra: ARCADE 2 / SHOOTER 1 / PUZZLE 2 / VERSUS 0.
