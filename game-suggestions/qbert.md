---
tema: Q*bert como candidato del catálogo
fecha: 2026-07-30
estado: propuesto
spec: —
---

# Q*BERT

## Pregunta original

Evaluar Q*bert (Gottlieb, 1982) como candidato para Arcade Vault, dentro de un lote de cinco clásicos.

## Veredicto

**Encaja con condiciones, prioridad baja.** La puntuación y el ciclo de partida encajan bien, pero acumula tres costes a la vez (proyección isométrica, input diagonal, IA de Coily) y sería el tercer o cuarto ARCADE. Condición: aceptar input diagonal en teclado como compromiso conocido y recortar el elenco de enemigos.

## Ficha técnica

- id: `qbert`
- cat: ARCADE
- color: magenta
- cover: `cover-qbert` (nueva)
- score: 25 por cubo cambiado de color, 500 por completar el nivel + bonus por discos sin usar (50 c/u), 100 por enemigo eliminado con disco
- lives: 3. level: ronda; sube el número de colores por cubo (1 salto → 2 saltos) y la frecuencia de enemigos
- input: cuatro diagonales. Teclado: `Q`/`W`/`A`/`S` mapeadas a arriba-izq / arriba-der / abajo-izq / abajo-der, o flechas rotadas 45°. Alternativa: puntero (clic sobre el cubo destino adyacente)

## Encaje con el contrato de engine

Directo en el contrato. La pirámide son 28 cubos con un `color: number` cada uno; el estado global es score/vidas/ronda, todo dentro de `EngineState`.

Un detalle: el salto es una animación de ~200 ms durante la cual el personaje no está en ninguna casilla. `pause()` debe congelarlo a media parábola sin dejar el estado inconsistente, y las colisiones deben evaluarse al aterrizar, no durante el vuelo. Manejable, pero es la clase de detalle que hay que decidir explícitamente en el spec.

## Coste

**Alto.** Tres partes difíciles concretas:

1. **El input diagonal.** Es el problema histórico del juego: incluso el original con joystick rotado confundía a los jugadores. En teclado no hay mapeo obvio, y cualquier elección será incómoda para alguien. Es riesgo de producto, no solo técnico.
2. **La proyección isométrica.** Dibujar 28 cubos en 2D con orden de pintado correcto y traducir coordenadas de rejilla (fila, columna) a píxeles es asumible, pero es trabajo que ningún otro engine del repo ha hecho: no hay nada que copiar.
3. **Coily.** La serpiente persigue a Q*bert saltando por la pirámide con una heurística que debe respetar la topología triangular (los movimientos legales dependen de la posición en la fila). Es el enemigo que hace al juego, y el más caro.

Añadir Slick/Sam (revierten cubos), Ugg/Wrongway (suben por los laterales) y las bolas rojas multiplica el trabajo. Los discos voladores laterales son casi obligatorios porque son la única defensa contra Coily.

## Alternativas consideradas

- **Versión ortogonal (rejilla cuadrada en vez de pirámide isométrica)**: baja mucho el coste y arregla el input, pero deja de ser Q*bert y se acerca a un puzzle de pintar casillas genérico. Descartado: pierde la identidad del clásico, que es justo su único argumento fuerte.
- **cat PUZZLE**: tentador porque equilibraría categorías y hay componente de planificación de ruta, pero el juego es de reflejos y esquiva; ARCADE es la lectura honesta. No forzar la categoría para tapar un hueco.
- **Frente a `gloton` (Pac-Man)**: ambos son persecución con coste alto. Glotón cubre mejor el hueco de laberinto y es más reconocible. Si hay presupuesto para un engine caro, Glotón va primero.

## Notas para el futuro

- Qué cambiaría el veredicto a prioridad alta: que el catálogo necesite específicamente algo _visualmente_ distinto. Q*bert es el único candidato del lote que no se ve como los demás, y en una parrilla de portadas neón eso vale.
- Duda abierta sin resolver: el mapeo de teclas. Antes de escribir el spec conviene decidirlo con el usuario, porque condiciona toda la sensación del juego.
- Si entra, el `EngineState.level` debe mapear la ronda, no el "nivel" del original (que agrupa cuatro rondas). Simplificación deliberada.
