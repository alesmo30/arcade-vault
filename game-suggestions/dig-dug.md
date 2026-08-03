---
tema: Dig Dug como candidato del catálogo
fecha: 2026-07-30
estado: propuesto
spec: —
---

# DIG DUG

## Pregunta original

Evaluar Dig Dug (Namco, 1982) como candidato para Arcade Vault, dentro de un lote de cinco clásicos.

## Veredicto

**Encaja con condiciones, prioridad baja.** Puntuación y contrato encajan sin problema, y aporta una mecánica que no existe en el catálogo (terreno destructible + ataque no letal en dos fases). Pero es el candidato con el coste más alto del lote y sumaría un ARCADE más a una categoría ya cargada. Condición: aceptar terreno en rejilla fina en vez de máscara por píxel.

## Ficha técnica

- id: `dig-dug`
- cat: ARCADE
- color: yellow
- cover: `cover-digdug` (nueva)
- score: por enemigo inflado hasta reventar, según el estrato de profundidad donde muere (Pooka 200/300/400/500, Fygar 400/600/800/1000; ×2 si el Fygar muere en horizontal); 1000/2500/4000 por aplastar 1/2/3 enemigos con una roca; bonus de verdura por ronda
- lives: 3. level: ronda; sube el número de enemigos y su velocidad de fantasma
- input: flechas para cavar (movimiento continuo en 4 direcciones) + espacio para bombear (pulsaciones repetidas)

## Encaje con el contrato de engine

Directo. El estado expuesto es score/vidas/ronda y nada más. El estado interno pesado (mapa de tierra, inflado de cada enemigo 0–4, rocas en caída) vive dentro del engine.

`pause` debe congelar los contadores de desinflado de los enemigos y la caída de rocas — si no, un enemigo inflado se desinfla "gratis" durante la pausa. `restart` regenera el mapa de túneles iniciales. `endNow` cierra en `gameover` limpiamente.

## Coste

**Alto.** Tres partes difíciles concretas:

1. **Terreno destructible con pathing coherente.** La tierra es a la vez colisión, ruta de los enemigos y elemento visual. Cada celda excavada cambia el grafo por el que se mueven Pooka y Fygar. Con máscara por píxel el render es más bonito pero el pathing se vuelve infernal; con rejilla fina (4–8 px por celda) es tratable, y por eso es la condición.
2. **Modo fantasma.** Pooka y Fygar atraviesan la tierra cuando se aburren y rematerializan en un túnel. Eso significa dos sistemas de movimiento distintos por enemigo, con transición y reglas de cuándo entrar y salir. Es el comportamiento que define el juego y no se puede recortar.
3. **La bomba.** El ataque no es un disparo instantáneo: es un arpón que se extiende, engancha, y luego infla en fases con pulsaciones repetidas, con desinflado por tiempo si el jugador para. Tres estados encadenados, más el caso del enemigo que se suelta y vuelve a por ti.

Las rocas (caen al quedar sin tierra debajo, matan lo que pillen incluido al jugador) son la única parte barata.

## Alternativas consideradas

- **Mr. Do!** — misma familia (excavar + rocas), enemigos más simples, sin mecánica de bombeo. Sería una versión más barata del mismo hueco, pero mucho menos reconocible. Vale la pena tenerlo en mente si el usuario quiere el género a bajo coste.
- **Máscara de tierra por píxel** (`ImageData` + `putImageData`): fiel visualmente, inviable para el pathing sin una estructura paralela. Descartado a favor de la rejilla fina, que se puede renderizar con bordes suavizados para que no se note el escalón.
- **cat PUZZLE**: hay planificación de túneles y de rocas, pero la ejecución es de reflejos. ARCADE.

## Notas para el futuro

- Es el único candidato del lote con **terreno destructible**, mecánica ausente del catálogo. Ese es su argumento; el coste es su problema.
- Qué cambiaría el veredicto: partir el trabajo en dos specs (terreno + movimiento primero; enemigos y bomba después), o cambiar a Mr. Do! si se quiere el hueco cubierto barato.
- Ojo al reparto de categorías: con `ranaria` y `gloton` ya propuestos, ARCADE llegaría a cinco. Dig Dug debería entrar después de que PUZZLE y VERSUS tengan compañía.
- Comparado con `gloton`, el coste es similar pero Dig Dug aporta una mecánica más original y Glotón un clásico más reconocible.
