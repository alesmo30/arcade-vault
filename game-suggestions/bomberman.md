---
tema: Bomberman en modo un jugador contra enemigos
fecha: 2026-07-30
estado: propuesto
spec: —
---

# BOMBERMAN (UN JUGADOR)

## Pregunta original

¿Encaja un Bomberman de un jugador — laberinto de rejilla, poner bombas, romper bloques, eliminar enemigos y encontrar la salida — en Arcade Vault?

## Veredicto

**Encaja con condiciones, prioridad baja.** Técnicamente es de los mejores encajes del lote: rejilla discreta (sin física continua), score entero natural, `lives` y `level` mapean de fábrica, y es un clásico de 1983 perfectamente reconocible. Las condiciones son dos: **recortar los power-ups a dos o tres** y aceptar que suma **otro ARCADE** a la categoría más cargada del catálogo, detrás de varios candidatos más baratos.

## Ficha técnica

- id: `bombas`
- cat: ARCADE
- color: yellow
- cover: `cover-bombas` (**nueva**). Ninguna huérfana encaja bien. Propuesta: rejilla de bloques cyan con una bomba circular magenta al centro y una cruz de llamas yellow expandiéndose.
- score: 100 por bloque blando destruido, 200–800 por enemigo según tipo, ×2 por enemigos eliminados con la misma explosión (encadenar es donde está la habilidad), 1000 + bonus de tiempo restante por nivel completado.
- lives: 3 bombers. Muerte por tocar enemigo **o por tu propia explosión** — el detalle que define el juego.
- level: pantalla. Cada nivel cambia el patrón de bloques blandos, sube el número y la velocidad de enemigos.
- input: flechas (movimiento continuo alineado a la rejilla, con "corner sliding" para no engancharse en las esquinas) + Espacio para soltar bomba.

## Encaje con el contrato de engine

Directo y limpio. `pause/resume` congelan el rAF y los temporizadores de las bombas (**importante**: la cuenta atrás de cada bomba debe llevarse en tiempo acumulado del engine, no con `setTimeout`, o pausar no las detiene). `restart` regenera el nivel 1. `endNow` fuerza `gameover`. `destroy` quita listeners. `EngineState` cubre todo; el alcance de llama y el número de bombas simultáneas se pintan en el canvas.

## Coste

**Medio-alto.** Las partes difíciles, concretas:

1. **Explosiones en cruz con propagación y encadenado.** Cada bomba expande llamas por los cuatro ejes hasta el primer bloque duro, destruyendo un solo bloque blando por brazo. Si una llama toca otra bomba, esa detona **inmediatamente**, y la cascada puede ser recursiva. Hay que resolverla con una cola, evitando recursión infinita entre bombas que se detonan mutuamente. Es el núcleo del juego y donde se concentran los bugs.
2. **IA de enemigos sobre la rejilla.** Distintos tipos: los básicos van recto y giran al chocar, los avanzados persiguen al jugador y algunos atraviesan bloques blandos. Persecución con BFS sobre la rejilla, barata. El detalle caro es que un enemigo **no debería suicidarse** contra las llamas de forma tonta ni esquivarlas perfectamente: hay que calibrar.
3. **Movimiento alineado a rejilla con deslizamiento en esquina.** El jugador se mueve en píxeles pero colisiona en celdas; sin el ajuste de esquina el control se siente atascado, y ese "feel" es la mitad de la impresión del juego.
4. **Power-ups.** Cada uno (más alcance, más bombas, patada, detonador remoto) es una regla nueva en el motor de explosiones. **Condición del veredicto: dos o tres como máximo en v1** — alcance y número de bombas, que son los que cambian la jugabilidad sin tocar la mecánica base.

## Alternativas consideradas

- **Bomberman en modo batalla (VERSUS contra CPU)** — llenaría la categoría vacía, pero exige IA rival que **use bombas sin matarse**, que es bastante más difícil que la IA de perseguir; y VERSUS ya tiene `duelo-pixel` (barato) y `estelas` propuestos. Descartado como enfoque; el modo un jugador es más honesto.
- **`dig-dug`** (evaluado en paralelo) — también es terreno destructible en rejilla con enemigos, y también quedó en "con condiciones, prioridad baja, ARCADE cargado". **Son competidores directos por el mismo asiento**: ambos aportan "modificar el escenario", ninguno debería entrar si ya entra el otro. Bomberman gana en reconocibilidad y en claridad de score; `dig-dug` gana en singularidad de mecánica (excavar vs. inflar).
- **Sin enemigos, solo contrarreloj para limpiar bloques** — abarata mucho, pero sin la amenaza no hay tensión y el score se vuelve una tarea mecánica. Descartado.

## Notas para el futuro

- Lo que cambiaría el veredicto a prioridad alta: que el catálogo ya tenga suficientes ARCADE baratos dentro y busque profundidad. Bomberman es de los pocos candidatos con **techo de habilidad real** (encadenar explosiones, atrapar enemigos) que no cuesta lo que `pinball` o `gloton`.
- Lo que lo empeora: modo dos jugadores, inventario completo de power-ups, jefes de nivel. Todo eso debe ir en el "lo que NO entra" del spec.
- Trampa técnica a recordar: temporizadores de bomba con tiempo acumulado del engine, nunca con `setTimeout`, o `pause()` miente.
- No exige tocar CHECKs de `cat`/`color` ni ampliar `EngineState`.
