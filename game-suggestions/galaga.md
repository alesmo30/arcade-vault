---
tema: Galaga (formación con entradas en curva y picados)
fecha: 2026-07-30
estado: propuesto
spec: —
---

# GALAGA

## Pregunta original

¿Encaja Galaga en el catálogo de Arcade Vault?

## Veredicto

**Encaja con condiciones.** Técnicamente es de los candidatos más limpios que hay: score entero natural, `lives`/`level` mapean solos, input de dos teclas más disparo. La condición no es técnica sino de catálogo: **Galaga e `invasores` (Space Invaders, ya propuesto con prioridad alta en [juegos-catalogo-2026-q3.md](./juegos-catalogo-2026-q3.md)) ocupan el mismo asiento**. Entra uno de los dos, no los dos. Si entra Galaga, `invasores` sobra; si entra `invasores`, Galaga es duplicación con más coste.

## Ficha técnica

- id: `escuadron`
- cat: SHOOTER
- color: magenta (cyan lo tiene `asteroides`; green estaba reservado a `invasores`)
- cover: `cover-invaders` (**huérfana, reutilizable**) si Galaga sustituye a `invasores`. Si por lo que sea conviven, hace falta `cover-escuadron` nueva — argumento adicional para que no convivan.
- score: 50/80/150 por enemigo en formación según fila; ×2 si se destruye en pleno picado; 400–1600 por jefe capturador; bonus de la etapa de desafío (10 000 por perfecta). Va directo a `scores.score`.
- lives: 3 cazas. Sutileza: con el caza dual rescatado el jugador controla dos naves con una sola vida — se decide en el spec si eso se refleja en `lives` o solo en el canvas.
- level: etapa (stage). Cada 3 etapas, etapa de desafío sin enemigos que disparan.
- input: ←/→ + Espacio. Un solo disparo simultáneo en pantalla (limitación original que define el ritmo; conservarla).

## Encaje con el contrato de engine

Directo. `pause/resume` congelan el rAF y el reloj de las trayectorias. `restart` vuelve a etapa 1 con score 0. `endNow` fuerza `gameover`. `destroy` quita listeners. `EngineState` cubre todo salvo el estado "caza capturado" — que es información visual, se pinta en el canvas y no necesita campo.

## Coste

**Medio.** Tres partes concretas, en orden de dificultad:

1. **Trayectorias de entrada.** Los enemigos no aparecen colocados: entran en bucles y lazos siguiendo caminos predefinidos antes de asentarse en la formación. Hay que modelar rutas paramétricas (Bézier o tabla de puntos interpolados) y el enganche suave a la celda de destino. Es lo que distingue Galaga de Space Invaders, y es lo que cuesta.
2. **Picados.** Selección periódica de enemigos que abandonan la formación, describen un arco de ataque disparando y vuelven a su celda. IA sencilla, pero necesita máquina de estados por enemigo (`enFormacion | entrando | picando | volviendo | capturando`).
3. **Rayo tractor y caza dual.** El jefe captura tu nave y puedes rescatarla para disparar doble. Es la firma del juego, pero es scope aislable: **v1 puede dejarlo fuera** y sigue siendo Galaga jugable.

La formación en sí, las colisiones (AABB) y el scoring son triviales.

## Alternativas consideradas

- **`invasores` (Space Invaders)** — mismo hueco, coste bajo-medio, portada huérfana lista. Gana si la prioridad es entregar rápido; Galaga gana si la prioridad es que el SHOOTER de raíl se sienta moderno y tenga más profundidad.
- **Galaxian** (Galaga sin captura ni caza dual) — es literalmente el "v1 recortado" descrito arriba. Si se recorta el punto 3, esto es lo que queda: coste bajo-medio, y sigue aportando las entradas en curva que Space Invaders no tiene.
- **`ciempies` y `tanques`** (evaluados en paralelo) — ambos también son SHOOTER. Con `asteroides` ya dentro, la categoría se satura rápido: no deberían entrar más de dos SHOOTER nuevos en total.

## Notas para el futuro

- **La decisión clave no es "Galaga sí o no", es "Galaga o `invasores`".** Quien retome esto debe resolver esa disyuntiva antes de escribir spec alguna.
- Lo que sube a Galaga por encima de `invasores`: aporta trayectorias curvas, una mecánica de movimiento que ningún engine vivo tiene (los cuatro actuales se mueven en ejes o con inercia libre).
- Lo que lo baja: cuesta más y no tiene portada propia si conviven.
- Recorte seguro para el spec: fuera rayo tractor, fuera caza dual, fuera etapas de desafío. Con eso el coste es bajo-medio y cabe en un solo spec.
- No exige tocar CHECKs de `cat`/`color` ni ampliar `EngineState`.
