---
tema: Worms / artillería por turnos contra CPU (VERSUS)
fecha: 2026-07-30
estado: rechazado
spec: —
---

# WORMS / ARTILLERÍA POR TURNOS

## Pregunta original

¿Encaja un juego de artillería por turnos contra la CPU, estilo Worms o Scorched Earth, como primer VERSUS del catálogo?

## Veredicto

**No encaja.** Falla en el criterio de plataforma más duro y en el segundo más duro a la vez: el resultado natural de una partida es **binario** (ganas o pierdes), no un entero, y el juego es **por turnos sin presión de tiempo**, lo contrario de la línea de reflejos del catálogo. Es el mismo doble fallo que rechazó `conecta-4`, con encima un coste de implementación alto.

## Ficha técnica

_(a título informativo; el juego no se propone)_

- id: `artilleria`
- cat: VERSUS
- color: green
- cover: requeriría `cover-artilleria` nueva.
- score: **no existe uno natural.** Ver abajo.
- lives: vida del gusano/tanque del jugador. level: ronda o mapa.
- input: ←/→ ángulo, ↑/↓ potencia, Espacio disparar.

## Por qué se rechaza

1. **Sin score numérico natural.** Restricción dura de `restricciones.md`: el leaderboard guarda un entero y ordena `desc`. Una partida de artillería termina en "gané" o "perdí". Los candidatos a score son todos envoltorios artificiales: _daño total infligido_ (se maximiza fallando adrede para alargar la partida), _turnos usados_ (menos es mejor → orden invertido, el mismo problema que hundió a `sokoban`), _vida restante_ (rango de 0 a 100, empates masivos). Ninguno mide habilidad de forma monótona.
2. **Por turnos, sin reloj.** El jugador puede pasar cinco minutos ajustando ángulo y potencia. Ni es sesión arcade corta ni hay tensión. Encaja mal con el player (`GamePlayer`), cuyo HUD y overlay de pausa están pensados para acción continua.
3. **Coste alto y concentrado en lo peor.** Terreno destructible por máscara de píxeles (o rejilla fina), balística con viento, y sobre todo la **IA de puntería**: una CPU que resuelve la parábola exacta es imbatible y una que dispara al azar es ridícula; hay que calcular el tiro perfecto y luego degradarlo con ruido calibrado por dificultad. Es tuning fino, difícil de dar por terminado.
4. **VERSUS ya está mejor cubierto.** `duelo-pixel` (coste bajo) y `estelas` (Tron, evaluado en paralelo) cierran esa categoría con juegos de acción continua y score entero. Artillería llegaría tercera, más cara y peor encajada.

## Alternativas consideradas

- **Artillería en modo "campo de tiro"** — sin rival, disparar a blancos a distancias variables con viento, contrarreloj. Eso **sí** tendría score entero (blancos derribados). Pero ya no es Worms, es un juego de puntería con temporizador, y cae en la misma objeción de "dianas neón": poca profundidad, sin identidad de clásico arcade.
- **Gorillas / Scorched Earth simplificado** (dos tanques, terreno fijo, sin inventario) — baja el coste a medio, pero **no arregla el problema del score**, que es el bloqueante real. Simplificar no salva a este candidato.
- **`estelas` (Tron)** — el VERSUS que sí aporta mecánica nueva (encerrar al rival) con acción continua y score entero. Si el objetivo es llenar VERSUS, ese es el camino.

## Notas para el futuro

- Lo único que cambiaría el veredicto: que la plataforma admitiese resultados no numéricos (columna de victorias/derrotas en `scores`, o un ranking por partidas ganadas). Eso es un cambio de esquema y de producto, no de juego — afectaría también a `conecta-4` y a cualquier juego de mesa. Si algún día se plantea, estos dos son los candidatos que se reabren.
- Patrón confirmado, ya visto en `conecta-4`: **juego por turnos con final binario = rechazo automático** en esta plataforma. Vale la pena registrarlo como veto de género en `restricciones.md`, no como rechazo caso por caso.
- El coste técnico (terreno destructible, balística) no es el motivo del rechazo y no debe citarse como tal: aunque fuese barato, seguiría sin encajar.
