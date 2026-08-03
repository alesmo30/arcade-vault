---
tema: Flappy Bird (clon de un botón)
fecha: 2026-07-30
estado: propuesto
spec: —
---

# FLAPPY BIRD — "ALETEO"

## Pregunta original

¿Encaja un clon de Flappy Bird en Arcade Vault?

## Veredicto

**Encaja.** Es el engine más barato que se ha evaluado hasta ahora: un botón, una física, una colisión AABB, y un score entero perfectamente natural (tuberías superadas). Su única pega es de catálogo, no técnica: sería el tercer/cuarto ARCADE.

## Ficha técnica

- id: `aleteo`
- cat: ARCADE
- color: yellow
- cover: `cover-aleteo` (nueva; ninguna de las seis huérfanas — `cover-duelo`, `cover-invaders`, `cover-glot`, `cover-rana`, `cover-bricks`, `cover-rocas` — encaja temáticamente). Silueta de ave pixel entre dos columnas verticales de neón.
- score: 1 por tubería superada. Opción: +10 por paso "perfecto" (centro del hueco) para dar techo de habilidad al leaderboard; decidir en el spec.
- lives: 1 fija (muerte instantánea, es la firma del juego). level: tramo de dificultad cada 10 tuberías — sube velocidad de scroll y estrecha el hueco hasta un mínimo duro.
- input: Espacio / ↑ / clic — un solo impulso vertical.

## Encaje con el contrato de engine

Directo, sin fricción. `pause/resume` congelan el rAF y el scroll; `restart` resetea posición, velocidad y generador de tuberías; `endNow` marca `gameover` con el score vigente; `destroy` quita el listener de teclado/puntero. `EngineState` sobra: `lives` siempre 1 y `level` es decorativo.

## Coste

**Bajo.** No hay parte difícil algorítmica; la parte difícil es de _tuning_: gravedad, impulso, ancho del hueco y separación entre tuberías. Los números originales (gravedad alta, impulso corto y seco) son lo que hace el juego adictivo en vez de frustrante; conviene dejarlos como constantes nombradas y ajustables en el spec. Segundo detalle: el hitbox del ave debe ser más pequeño que su sprite, o el juego se siente injusto.

## Alternativas consideradas

- **Helicopter / Jetpack (mantener pulsado)** — misma familia, curva más suave, pero menos reconocible.
- **Scroll horizontal con obstáculos variados (tipo Jetpack Joyride)** — más contenido, más coste, y diluye la pureza del gesto único.

## Notas para el futuro

- Riesgo real: es de 2013, no de los 80. Estéticamente se integra sin problema en la línea neón/CRT, pero rompe la coherencia "clásico de salón recreativo" del resto del catálogo. Si el usuario quiere mantener esa coherencia estricta, este es el primer candidato a caer — y esa sería una restricción duradera que anotar.
- Lo distingue del rechazo previo de "dianas neón": aquí el leaderboard mide patrón y ritmo aprendidos, no latencia de hardware.
- Es el mejor candidato para estrenar un engine si se quiere un spec corto entre dos caros.
