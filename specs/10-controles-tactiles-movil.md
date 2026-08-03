# SPEC 10 — Controles táctiles y layout móvil de la ruta de juego

> **Status:** Aprobado
> **Depends on:** SPEC 05, SPEC 06, SPEC 07, SPEC 08, SPEC 09
> **Date:** 2026-08-02
> **Objective:** Hacer jugables los cuatro juegos en un móvil táctil, con el canvas arriba y un gamepad en pantalla abajo, sin scroll y sin tocar la mecánica de ningún motor.

---

## Scope

**In:**

- Componente nuevo `app/components/touch-pad.tsx` (client): gamepad en pantalla, D-pad + botones de acción, `pointerdown`/`pointerup`/`pointercancel` con multitouch real.
- Mapa `app/games/engines/controls.ts`: `CONTROLS: Record<string, PadLayout>` con el layout de cada juego (qué direcciones y qué botones de acción con su etiqueta). Solo lo lee `TouchPad`, nunca los motores.
- Contrato ampliado en `app/games/engines/types.ts`: `ControlAction` (`"left" | "right" | "up" | "down" | "a" | "b"`) y método opcional `setControl(action, pressed)` en `GameEngine`.
- `setControl` implementado en los cuatro motores (`asteroides`, `tetris`, `arkanoid`, `snake`), escribiendo en las mismas banderas internas que ya usa el teclado.
- `setControl` expuesto en el handle imperativo de `app/games/engines/game-canvas.tsx`.
- `app/components/game-player.tsx`: detección táctil vía `matchMedia("(pointer: coarse)")`, layout móvil (HUD de una línea, canvas, chips de skin, gamepad, fila PAUSA/FIN/SALIR) y variante landscape con gamepad flotante a los lados.
- CSS del layout móvil y del gamepad en `app/globals.css`, en la línea neón/CRT existente.
- Bloqueo táctil en la zona de juego: `touch-action: none`, `user-select: none`, sin zoom por doble-tap ni menú contextual por pulsación larga.
- Fix de los defectos de layout que impiden jugar en la ruta `/games/[id]/jugar`: HUD desbordado y CRT con overflow horizontal a 375 px.
- Meta viewport verificada en `app/layout.tsx` (`width=device-width, initial-scale=1`, sin `user-scalable=no` global).

**Out (queda para specs futuras):**

- Auditoría responsive del resto de rutas: `/`, `/games`, `/games/[id]`, `/salon-de-la-fama`, `/acerca-de`, nav. Va a un spec propio.
- Fullscreen API y `screen.orientation.lock()`. Decidido: solo portrait que se readapta.
- Vibración/haptics, sonido, gamepad físico vía Gamepad API.
- Gestos (swipe, drag, pinch) como alternativa a los botones.
- Cambios de mecánica, timing, dificultad o puntuación de cualquier motor.
- PWA, instalación, offline.
- Tests automatizados (no hay framework; verificación con Playwright MCP / claude-in-chrome emulando móvil).

---

## Data model

Sin datos persistidos nuevos: no toca `public.games`, `public.scores` ni `localStorage`. Las estructuras nuevas son de tipos en memoria.

Contrato ampliado (`app/games/engines/types.ts`):

```ts
export type ControlAction = "left" | "right" | "up" | "down" | "a" | "b";

export type GameEngine = {
  // …pause/resume/restart/endNow/destroy/setSkin ya existentes
  /** Entrada táctil. Equivale a mantener/soltar la tecla correspondiente. */
  setControl?(action: ControlAction, pressed: boolean): void;
};
```

Layout del gamepad (`app/games/engines/controls.ts`):

```ts
export type PadButton = { action: ControlAction; label: string };

export type PadLayout = {
  /** Direcciones que el D-pad muestra. Las no listadas no se dibujan. */
  dpad: ControlAction[]; // subconjunto de "left"|"right"|"up"|"down"
  buttons: PadButton[]; // 0, 1 o 2 botones de acción
};

export const CONTROLS: Record<string, PadLayout> = {
  asteroides: { dpad: ["left", "right", "up"], buttons: [{ action: "a", label: "DISPARO" }] },
  tetris: {
    dpad: ["left", "right", "down"],
    buttons: [
      { action: "a", label: "ROTAR" },
      { action: "b", label: "CAER" },
    ],
  },
  arkanoid: { dpad: ["left", "right"], buttons: [] },
  snake: { dpad: ["left", "right", "up", "down"], buttons: [] },
};
```

Traducción acción → tecla equivalente, por motor (referencia para implementar `setControl`; ninguna lógica de juego cambia):

| Juego        | left        | right        | up        | down        | a         | b       |
| ------------ | ----------- | ------------ | --------- | ----------- | --------- | ------- |
| `asteroides` | `ArrowLeft` | `ArrowRight` | `ArrowUp` | —           | `Space`   | —       |
| `tetris`     | `ArrowLeft` | `ArrowRight` | —         | `ArrowDown` | `ArrowUp` | `Space` |
| `arkanoid`   | `ArrowLeft` | `ArrowRight` | —         | —           | —         | —       |
| `snake`      | `ArrowLeft` | `ArrowRight` | `ArrowUp` | `ArrowDown` | —         | —       |

`arkanoid` no tiene acción de lanzamiento: la bola sale sola desde `loadLevel()` en `app/games/engines/arkanoid/engine.ts`.

Convenciones:

- `setControl` es idempotente: dos `pressed: true` seguidos de la misma acción equivalen a uno.
- Una acción no soportada por el motor se ignora en silencio, no lanza.
- El estado de pulsación vive en el motor (las banderas que ya existen), no en React. `TouchPad` no guarda estado de juego, solo el resaltado visual del botón activo.
- Los motores conservan intactos sus listeners de teclado: táctil y teclado conviven sin exclusión.

---

## Implementation plan

1. **Contrato.** Añadir `ControlAction` y `setControl?(action, pressed)` a `app/games/engines/types.ts`. Nada más cambia; la app sigue compilando y jugándose con teclado.
2. **Mapa de layouts.** Crear `app/games/engines/controls.ts` con `PadButton`, `PadLayout` y `CONTROLS` para los cuatro juegos. Archivo aislado, aún sin consumidores.
3. **`setControl` en los motores.** Un motor por commit, en este orden: `snake`, `arkanoid`, `tetris`, `asteroides`. Cada uno traduce la acción a la bandera interna que ya escribe su `keydown`/`keyup` (en `snake`, `pressed: true` encola dirección igual que la tecla). Verificable desde consola con el handle del motor antes de que exista UI.
4. **Puente en `GameCanvas`.** Exponer `setControl` en el `useImperativeHandle` de `app/games/engines/game-canvas.tsx`, igual que `setSkin`.
5. **Componente `TouchPad`.** `app/components/touch-pad.tsx`: recibe `layout: PadLayout` y `onControl(action, pressed)`. Usa `pointerdown`/`pointerup`/`pointercancel`/`pointerleave` con `setPointerCapture`, soporta varios punteros simultáneos y marca visualmente el botón activo. Sin estado de juego.
6. **Detección táctil.** Hook `useCoarsePointer()` en `app/components/use-coarse-pointer.ts`: `useSyncExternalStore` sobre `matchMedia("(pointer: coarse)")`, snapshot de servidor `false` para no romper hidratación.
7. **Montaje del gamepad.** En `game-player.tsx`, cuando `useCoarsePointer()` y `hasEngine`, renderizar `<TouchPad>` bajo el CRT y cablear `onControl` a `engineRef.current?.setControl?.(...)`. Ya se puede jugar con el dedo, aunque el layout todavía no esté afinado.
8. **Layout móvil portrait.** CSS en `app/globals.css` (`@media (pointer: coarse)` + ancho): contenedor de la ruta a `100dvh` sin scroll, HUD comprimido a una línea de chips, canvas con ratio 4:3 y `max-height`, chips de skin, gamepad con `flex-grow`, fila PAUSA/FIN/SALIR abajo. Fix del overflow horizontal del CRT.
9. **Layout landscape.** Variante `@media (orientation: landscape) and (pointer: coarse)`: canvas centrado a altura completa, D-pad flotante a la izquierda y botones de acción a la derecha sobre los márgenes, HUD y PAUSA/FIN/SALIR en la barra superior.
10. **Bloqueo táctil.** `touch-action: none` y `user-select: none` en canvas y gamepad, `-webkit-touch-callout: none`, y verificación de la meta viewport en `app/layout.tsx`.
11. **Diseño visual.** `/frontend-design` para el gamepad (forma de teclas, neón por color del juego, estados pulsado/reposo) y aplicar el resultado al CSS del paso 8.
12. **Cierre.** `npm run lint`, `npm run build` y `npm run format` limpios.
13. **Verificación.** Sesión Playwright MCP emulando móvil (375×667 y 390×844, `hasTouch: true`) contra los criterios de aceptación, en portrait y landscape, para los cuatro juegos.

---

## Acceptance criteria

- [ ] `npm run lint`, `npm run build` y `npm run format:check` sin errores ni warnings.
- [ ] En un viewport táctil (375×667, `hasTouch: true`), `/games/asteroides/jugar` muestra: HUD de una línea, canvas, chips de skin, gamepad y fila PAUSA/FIN/SALIR, todo visible sin scroll vertical ni horizontal.
- [ ] Lo mismo se cumple en `/games/tetris/jugar`, `/games/arkanoid/jugar` y `/games/snake/jugar`.
- [ ] En escritorio (`pointer: fine`) el gamepad no se renderiza y el layout actual no cambia.
- [ ] El gamepad de cada juego muestra exactamente su layout: `asteroides` ←/→/▲ + DISPARO; `tetris` ←/→/▼ + ROTAR + CAER; `arkanoid` ←/→ sin botón de acción; `snake` ←/→/▲/▼ sin botón de acción.
- [ ] Mantener pulsado ◀ en `arkanoid` mueve la pala de forma continua mientras el dedo siga apoyado, y se detiene al soltar.
- [ ] En `asteroides`, dos dedos simultáneos (◀ y DISPARO) giran y disparan a la vez.
- [ ] En `asteroides`, arrastrar el dedo fuera del botón pulsado lo suelta (sin quedarse la nave girando sola).
- [ ] En `snake`, un toque en ▲ cambia la dirección en el siguiente tick, con el mismo bloqueo de giro de 180° que el teclado.
- [ ] En `tetris`, ROTAR gira la pieza y CAER hace hard drop.
- [ ] El teclado sigue funcionando en los cuatro juegos, sin regresiones respecto a specs 05/07/08/09.
- [ ] La puntuación, las vidas y el nivel obtenidos con controles táctiles son idénticos a los del teclado en las mismas jugadas: `setControl` no altera velocidad, dificultad ni puntuación.
- [ ] Arrastrar el dedo sobre el canvas o el gamepad no scrollea la página.
- [ ] Doble-tap sobre canvas o gamepad no hace zoom; pulsación larga no abre el menú contextual ni selecciona texto.
- [ ] PAUSA, FIN, SALIR y los tres chips de skin son pulsables en móvil, con área táctil de al menos 44×44 px.
- [ ] Cambiar de skin desde móvil repinta el canvas sin reiniciar la partida ni perder la puntuación.
- [ ] El modal de FIN DEL JUEGO es usable en 375 px: el input de nombre y GUARDAR PUNTUACIÓN caben sin desbordar, y guardar inserta la fila en `scores`.
- [ ] Al girar a landscape, el layout se readapta: canvas a altura completa, D-pad a la izquierda, botones de acción a la derecha, HUD y PAUSA/FIN/SALIR arriba, sin scroll.
- [ ] Girar el dispositivo durante la partida no reinicia el motor ni pierde la puntuación.
- [ ] Salir de la ruta destruye el motor y no deja listeners de puntero activos: ida y vuelta ×2 con consola limpia.
- [ ] Sin errores de hidratación en consola en `/games/[id]/jugar` (la detección táctil usa snapshot de servidor `false`).

---

## Decisions

- **Sí:** botones de gamepad en DOM sobre el canvas, canvas arriba y controles abajo (maqueta aportada por el usuario). **No:** gestos (swipe/drag/tap) sobre el canvas. Asteroides necesita girar, empujar y disparar a la vez; los gestos no cubren pulsaciones simultáneas sostenidas y obligarían a un patrón distinto por juego.
- **Sí:** entrada al motor por el contrato (`setControl(action, pressed)` en `types.ts`), llamada desde React. **No:** listeners `touchstart`/`pointerdown` dentro de cada motor. Los motores se mantienen framework-free y sin DOM fuera del canvas, como fija AGENTS.md.
- **Sí:** `setControl` opcional (`?`) igual que `setSkin`, implementado en los cuatro motores. **No:** obligatorio en el tipo. Un motor futuro puede nacer sin táctil sin romper la compilación.
- **Sí:** seis acciones fijas (`left`/`right`/`up`/`down`/`a`/`b`). **No:** acciones semánticas por juego (`shoot`, `rotate`, `hardDrop`). Un vocabulario cerrado mantiene `TouchPad` genérico; la semántica vive en la etiqueta del botón y en la traducción interna del motor.
- **Sí:** `setControl` escribe en las mismas banderas internas que ya usa el teclado. **No:** sintetizar `KeyboardEvent` y despacharlos en `window`. Los eventos sintéticos son frágiles, no llevan `isTrusted` y acoplarían el táctil al `code` de tecla.
- **Sí:** mapa de layouts centralizado en `app/games/engines/controls.ts`. **No:** un layout por carpeta de motor. El layout es UI, no mecánica; el motor no debe saber que existe un gamepad.
- **Sí:** rotar en Tetris va al botón `A`, no a ▲ del D-pad. **No:** duplicar rotar en D-pad y en botón. Una acción, un sitio.
- **Sí:** `arkanoid` sin botón de acción. **No:** botón LANZAR. La bola se lanza sola desde `loadLevel()`; no existe tecla de lanzamiento en el motor y añadirla sería cambiar mecánica.
- **Sí:** gamepad visible solo con `matchMedia("(pointer: coarse)")`. **No:** por ancho de viewport. Una ventana de escritorio estrecha tiene teclado; un móvil apaisado ancho no lo tiene.
- **Sí:** `useSyncExternalStore` con snapshot de servidor `false` para la detección táctil. **No:** `useEffect` + `useState`. Mismo patrón que `auth-context.tsx` y que el selector de skin, y evita hidratación divergente.
- **Sí:** eventos `pointer*` con `setPointerCapture` y multitouch. **No:** `touchstart`/`touchend` ni `onClick`. `pointer*` unifica dedo, lápiz y ratón, y `click` no distingue mantener pulsado de tocar.
- **Sí:** solo portrait, con readaptación a landscape. **No:** Fullscreen API ni `screen.orientation.lock()`. El lock no está disponible en iOS Safari y el fullscreen añade un estado más que gestionar en pausa y salida.
- **Sí:** teclado y táctil conviven, sin desactivar uno al usar el otro. **No:** modo exclusivo. Un tablet con teclado externo puede usar ambos.
- **Sí:** este spec se limita a la ruta de juego. **No:** auditoría responsive del resto del sitio. Seis rutas en un spec haría inverificable el criterio de aceptación; va en un spec propio.
- **Sí:** área táctil mínima de 44×44 px en todo control. **No:** reutilizar los tamaños de botón de escritorio. Es el mínimo de las guías de accesibilidad táctil.

---

## Risks

| Risk                                                                                       | Mitigation                                                                                                                                |
| ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Dedo arrastrado fuera del botón deja la acción "pegada" (nave girando sola)                | `setPointerCapture` + `pointerup`/`pointercancel`/`pointerleave` sueltan la acción; criterio de aceptación explícito                      |
| Barra de direcciones de Chrome/Safari móvil come altura y reaparece el scroll              | Alturas en `dvh`, nunca `vh`; canvas con `max-height` y gamepad con `flex-grow`, no medidas fijas                                         |
| Hidratación divergente porque el servidor no sabe si el puntero es táctil                  | `useSyncExternalStore` con snapshot de servidor `false`: el servidor nunca pinta gamepad, el cliente lo añade tras hidratar               |
| Girar el dispositivo remonta `GameCanvas` y reinicia la partida                            | La orientación solo cambia CSS; ningún `key` ni dependencia de efecto depende de ella. Criterio de aceptación explícito                   |
| `touch-action: none` en el contenedor equivocado bloquea el scroll de toda la página       | Se aplica solo al canvas y al gamepad, nunca al `body` ni al layout raíz                                                                  |
| Canvas 4:3 encogido a 375 px deja objetos ilegibles (bloques de Arkanoid, celdas de Snake) | Verificación visual por juego en 375×667 dentro del paso 13; el canvas escala, no se recorta, así que la jugabilidad no cambia            |
| `setControl` tocando banderas internas altera timing o dificultad                          | Escribe exactamente las mismas variables que el teclado, sin ruta nueva en el loop; criterio de aceptación compara puntuación con teclado |
| Listeners de puntero sobreviven a la salida de la ruta                                     | `TouchPad` los registra vía React sobre sus propios elementos; se desmontan con el componente. Verificado con ida y vuelta ×2             |

---

## Qué **no** está en este spec

- Responsive del resto del sitio: `/`, `/games`, `/games/[id]`, `/salon-de-la-fama`, `/acerca-de`, nav.
- Fullscreen API y bloqueo de orientación.
- Gestos (swipe, drag, pinch) como control de juego.
- Vibración/haptics, sonido, Gamepad API para mandos físicos.
- Cambios de mecánica, timing, dificultad o puntuación de cualquier motor.
- PWA, instalación, modo offline.
- Suite de tests automatizada y comiteada.

Cada uno de estos, si se implementa, va en su propio spec.
