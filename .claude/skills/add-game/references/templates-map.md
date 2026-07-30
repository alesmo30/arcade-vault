# Mapa de `references/templates/started-games/`

Todas las plantillas son JS plano sin build ni módulos: todo en global scope, cargado por `<script src>` en `index.html`. Cada una trae su propio `CLAUDE.md` — léelo siempre antes de portar, puede tener notas que estas tablas no capturan.

| Carpeta        | `game.js`                                                  | Canvas                                                                      | Forma del código                                                                                    | Controles                                                                                               | HUD                                                                              |
| -------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `02-asteroids` | 510 líneas                                                 | 800×600                                                                     | Clases ES6 (`Bullet`, `Asteroid`, `PowerUp`, `Ship`, `Particle`)                                    | `ArrowLeft/Right` rotar, `ArrowUp` propulsar, `Space` disparar/reiniciar                                | En canvas (`drawHUD`)                                                            |
| `03-tetris`    | 332 líneas                                                 | `#board` 300×600 (`COLS 10 × BLOCK 30`, `ROWS 20`) + `#next-canvas` 120×120 | Sin clases — funciones + globales `let board, current, next, score, lines, level, paused, gameOver` | `ArrowLeft/Right` mover, `ArrowDown` soft drop, `ArrowUp`/`KeyX` rotar, `Space` hard drop, `KeyP` pausa | **DOM**, no canvas: `#score`, `#lines`, `#level`, `#overlay`                     |
| `04-arkanoid`  | 268 líneas (+ `levels.js` 50 + `assets/spritesheet.js` 66) | `#game` 800×600                                                             | Objetos planos, sin clases: `paddle`, `ball`, arrays `blocks[]`/`explosions[]`                      | `ArrowLeft/Right` mover paleta + **mouse** (`click` lanza/clic en overlay, `mousemove` sigue la paleta) | En canvas, con overlays clicables (zonas de botón como constantes `PAUSE_BTN_*`) |

## Ya portado (referencia viva)

`02-asteroids` → `app/games/engines/asteroides/engine.ts`. Es el ejemplo canónico de cómo se ve un port terminado — úsalo como plantilla de estructura para cualquier motor nuevo, no solo para reasteroides.

## Trampas de porting por plantilla

### `03-tetris`

- **El HUD vive en el DOM**, no se dibuja en canvas. Portar significa mover `score`/`lines`/`level` a `EngineState` y decidir a qué corresponde `lives` (Tetris no tiene vidas — probablemente 1 vida fija que se pierde al `gameOver`, o se omite visualmente en el HUD del motor). Pregúntalo al usuario explícitamente en Fase 3.
- Segundo canvas para "next piece" (`#next-canvas`) — el motor de Arcade Vault solo recibe **un** canvas. La pieza siguiente se dibuja como una región del mismo canvas de 800×600 (ej. una esquina), no como elemento separado.
- Canvas nativo 300×600 (angosto) vs el lienzo lógico 800×600 del motor — hay que decidir el layout: centrar el tablero y usar el espacio sobrante para HUD/next-piece dentro del mismo canvas.
- `KeyP` para pausa es redundante con el control de pausa externo del `GamePlayer` (botón PAUSA) — decidir si se mantiene como atajo o se retira.

### `04-arkanoid`

- Depende de `levels.js` (array `LEVELS` con 5 niveles) y `assets/spritesheet.js` (`SPRITES`) — el orden de carga de scripts importa en el original; en el port, estos se vuelven imports normales de TS o constantes dentro del mismo archivo de motor.
- Usa **audio** (`assets/sounds/*.mp3` vía `new Audio(...)`) — sonido está fuera de scope en Arcade Vault (decisión explícita, spec 05 "Out"). Omitir en el port salvo que el usuario pida abrir ese scope explícitamente (en cuyo caso es tema para su propia sección de Decisions, no algo a asumir).
- `spritesheet-breakout.png` es un asset binario — o se copia a `public/` y se dibuja con `drawImage`, o se sustituye por dibujo procedural (rectángulos/gradientes) siguiendo el estilo vectorial de `asteroides/engine.ts`. Decisión de diseño a preguntar, no a asumir.
- Colisión es AABB (rectángulo), no circular como en Asteroides — el port debe adaptar la lógica de colisión, no reusar `dist()`.
- Overlays con zonas de clic (`PAUSE_BTN_*`) dibujadas y detectadas a mano en canvas — en Arcade Vault el overlay de pausa ya lo dibuja `game-player.tsx` fuera del canvas; el motor no necesita su propio overlay clicable de pausa (sí puede necesitar uno de "lanzar bola" si el gameplay lo pide).

### Comunes a las tres

- Estado en globales de módulo (`let ship, score, ...` a nivel de archivo) → mover a variables dentro del closure de la factory.
- `document.getElementById('canvas')` en el top del archivo → el canvas llega como parámetro de `GameEngineFactory`.
- Listeners de teclado registrados en `window`/`document` al cargar el script, nunca limpiados → deben registrarse dentro de la factory y quitarse en `destroy()`.
- Tamaño de canvas fijo duplicado en variables (`W`, `H` o similar) → mantener como constantes `const W = 800; const H = 600;` en el motor portado, ajustando el dibujo si el original era más chico.
