# SPEC NN — Juego <NOMBRE> (motor + catálogo + leaderboard)

> **Status:** Draft
> **Depends on:** 06-leaderboard-y-catalogo-supabase[, 05-asteroides-juego]
> **Date:** <fecha ISO>
> **Objective:** <una frase: portar/crear el motor de <NOMBRE>, registrarlo en el catálogo (`public.games`) y conectarlo al leaderboard real ya existente>

---

## Scope

**In:**

- Motor `<NOMBRE>` en `app/games/engines/<slug>/engine.ts` — <resumen de mecánica, entidades, controles>.
- Registrado en `app/games/engines/registry.ts` bajo la clave `<slug>`.
- Fila nueva `<slug>` en `public.games` vía migración (`cat`, `color`, `cover`, `sort` siguiente).
- Clase `.cover-<slug>` en `app/globals.css`.
- Diseño visual del canvas vía `/frontend-design` antes de fijar la paleta.

**Out (queda para specs futuras):**

- <lo que no se está construyendo aquí: otros juegos, sonido, táctil/WASD, etc.>
- Cambios en `game-canvas.tsx`, `game-player.tsx`, `actions.ts`, `queries.ts`, rutas de catálogo/salón de la fama — ya son genéricos, no se tocan.
- Tests automatizados (no hay framework instalado; verificación con Playwright MCP / claude-in-chrome).

---

## Data model

Sin estructuras nuevas — reusa `public.games` y `public.scores` (spec 06). Fila de catálogo:

```sql
insert into public.games (id, title, short, long, cat, cover, color, plays, sort) values
('<slug>', '<TITLE>', '<short>', '<long>', '<CAT>', 'cover-<slug>', '<color>', '0', <sort>);
```

`EngineState` mapeado a la mecánica de este juego: <qué es `score`/`lives`/`level` aquí — especialmente si el juego no tiene vidas o niveles naturales>.

---

## Implementation plan

1. **Migración de catálogo.** `supabase/migrations/<ts>_add_game_<slug>.sql` con la fila de `games`. Aplicar con `mcp__supabase__apply_migration`, verificar con `list_tables`/`execute_sql`.
2. **Portada.** `.cover-<slug>` en `app/globals.css`, siguiendo el patrón de `.cover-asteroides` (`app/globals.css:801-827`).
3. **Motor.** `app/games/engines/<slug>/engine.ts` — <port 1:1 de la plantilla / diseño desde cero>, contra el contrato de `app/games/engines/types.ts`. Ver `references/engine-contract.md` del skill `add-game`.
4. **Registro.** Entrada en `app/games/engines/registry.ts`. A partir de aquí el juego es jugable y GUARDAR PUNTUACIÓN empieza a insertar en `scores` sin más cambios.
5. **Diseño visual.** `/frontend-design` para la paleta neón; aplicar al `COLORS` del motor.
6. **Cierre.** `npm run lint` y `npm run build` limpios.
7. **Verificación.** Sesión Playwright MCP / claude-in-chrome contra los criterios de aceptación.
8. **Confirmación de datos.** `execute_sql` para comprobar la fila de `scores` insertada tras una partida real.

---

## Acceptance criteria

- [ ] `npm run lint` y `npm run build` sin errores ni warnings.
- [ ] `/games` muestra la card `<NOMBRE>` con portada propia, distinta de las demás.
- [ ] `/games/<slug>` renderiza el detalle; "JUGAR AHORA" lleva a `/games/<slug>/jugar`.
- [ ] El canvas responde a: <lista de controles concretos>.
- [ ] <condiciones de scoring concretas: qué suma puntos y cuánto>.
- [ ] El HUD (Puntuación / Vidas / Nivel) refleja el estado real del motor.
- [ ] <condición de muerte/fallo> resta vida o termina la partida según corresponda; a game over aparece el modal con la puntuación real.
- [ ] <progresión de nivel, si aplica>.
- [ ] PAUSA congela el juego (nada se mueve) y muestra el overlay EN PAUSA; REANUDAR continúa sin saltos de posición.
- [ ] FIN abre el modal con la puntuación real; JUGAR DE NUEVO reinicia al estado inicial.
- [ ] Salir de la ruta destruye el motor: sin listeners ni `requestAnimationFrame` corriendo (verificado sin errores en consola, ida y vuelta ×2).
- [ ] Las teclas capturadas no scrollean la página.
- [ ] GUARDAR PUNTUACIÓN inserta en `scores` (confirmado por SQL); la marca aparece en `/salon-de-la-fama`; `plays` incrementa en 1.
- [ ] Regresión: `/games/bloque-buster/jugar` y el resto de juegos maqueta siguen mostrando la arena actual sin cambios.
- [ ] Sin errores de hidratación en consola en `/games`, `/games/<slug>`, `/games/<slug>/jugar`, `/salon-de-la-fama`.
- [ ] A 375 px de ancho el canvas escala dentro del CRT sin desbordar horizontalmente.

---

## Decisions

<Formato "Sí/No" con la razón, siguiendo specs 05/06. Al menos cubrir:>

- **Sí:** <fuente del motor — plantilla portada 1:1 / diseño desde cero>. **No:** <alternativa descartada>. <por qué>.
- **Sí:** integración vía registry consultado por `id`. **No:** componente dedicado por ruta. <por qué, heredado del patrón general>.
- **Sí:** <cómo se mapea `EngineState` a la mecánica de este juego si no es 1:1 con Asteroides>. **No:** <alternativa>. <por qué>.
- **Sí:** clase CSS nueva `.cover-<slug>`. **No:** reusar la de otro juego. <por qué>.

---

## Risks

| Risk                                                                    | Mitigation                                                                                   |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Fuga de `requestAnimationFrame`/listeners al navegar fuera de la ruta   | `destroy()` obligatorio; criterio de aceptación explícito de ida-y-vuelta con consola limpia |
| `onState` disparado en cada frame provoca re-renders excesivos en React | `maybeEmit()` solo emite cuando cambia score/vidas/nivel/status                              |
| <riesgo específico de esta mecánica, si lo hay>                         | <mitigación>                                                                                 |

---

## Qué **no** está en este spec

- <lista, espejo de "Out" en Scope>.
- Cambios en auth, `/acerca-de`, home.
- Suite de tests automatizada y comiteada.

Cada uno de estos, si se implementa, va en su propio spec.
