---
name: add-game
description: Diseña el spec de un juego nuevo para Arcade Vault (motor canvas + entrada en el catálogo + leaderboard real). El argumento admite tres formas — slug/nombre de una plantilla en references/templates/started-games/, una ruta a cualquier archivo o carpeta de referencia, o una descripción en texto libre del juego — y en cualquier caso pregunta lo que falte. Escribe specs/NN-<slug>.md en Draft y para — no implementa.
disable-model-invocation: true
argument-hint: "<slug-de-plantilla | ruta-de-referencia | descripción libre del juego>"
---

# /add-game — diseña el spec de un juego nuevo

**Este skill no produce ni una línea de código, SQL, CSS o config. Cero.** No motores, no migraciones, no queries, no clases CSS reales, no llamadas MCP que muten nada. El único artefacto que sale de aquí es un archivo Markdown: `specs/NN-<slug>.md` en estado `Draft`. La implementación completa —motor, migración, CSS, registry— la hace después el usuario a mano, o `/spec-impl` cuando el spec pase a `Approved`. Si el usuario pide implementar directamente, recuérdale ese flujo y sigue solo hasta el spec.

Este skill es una especialización de `/spec` para el caso "juego nuevo" — **antes de escribir una sola sección del spec, lee `~/.agents/skills/spec/SKILL.md` completo** (es el skill genérico spec-driven del repo, symlinkeado desde `.claude/skills/spec/`) y sigue su método de preguntas/estructura/tono como base. Este archivo solo añade el conocimiento específico de Arcade Vault (los 4 puntos de integración, el contrato del motor, las plantillas) encima de ese método — no lo reemplaza.

Responde en el idioma del prompt que invoca el skill. Identificadores de código (ids, nombres de archivo, tipos) siempre en inglés.

## Por qué esto es mecánico

Specs 05 (`specs/05-asteroides-juego.md`) y 06 (`specs/06-leaderboard-y-catalogo-supabase.md`) dejaron la plataforma con una arquitectura genérica de "registry": añadir un juego toca **exactamente 4 puntos**. Todo lo demás del pipeline (catálogo, HUD, pausa, guardado de puntuación, salón de la fama) ya funciona para cualquier `game.id` sin tocarlo. Léelos si necesitas más contexto que el resumido aquí — son la fuente de verdad histórica.

Lee `references/integration-points.md` y `references/engine-contract.md` de este skill antes de escribir la sección de Implementation plan del spec — ahí están los snippets exactos y los invariantes no negociables del motor.

## Fase 1 — Contexto

1. **Lee `~/.agents/skills/spec/SKILL.md` completo (y `template.md` al lado).** Es prerequisito obligatorio, no opcional — de ahí sale el método de fases de clarificación, el criterio de "cuándo dejar de preguntar" y la forma exacta de cada sección del spec. Todo lo que sigue en este archivo asume que ya lo leíste.
2. Lee `AGENTS.md` (raíz del repo) si no lo tienes ya en contexto.
3. `ls specs/` — determina el próximo número `NN` (hoy el último es `06`, siguiente `07`).
4. Lee `specs/05-asteroides-juego.md` y `specs/06-leaderboard-y-catalogo-supabase.md` para tono, nivel de detalle y forma de las secciones — son la aplicación concreta del método de `/spec` a un juego.
5. `ls references/templates/started-games/` — inventario de plantillas disponibles.
6. `cat app/games/engines/registry.ts` y `app/data/types.ts` (o confía en `references/integration-points.md` si ya lo tienes cargado) para confirmar ids de juegos ya usados y no colisionar.

## Fase 2 — Resolver la fuente del juego

`$ARGUMENTS` puede llegar en tres formas distintas. Detecta cuál es antes de seguir — no asumas que siempre es un slug de `started-games`:

1. **Slug/nombre de juego conocido** (ej. `tetris`, `arkanoid`, `asteroides`). Busca coincidencia contra los subdirectorios de `references/templates/started-games/` (por nombre o por número, ej. "tetris" → `03-tetris`). Consulta `references/templates-map.md` de este skill para la tabla de plantillas conocidas y sus trampas de porting.
2. **Ruta explícita a un archivo o carpeta de referencia**, dentro o fuera de `started-games/` (ej. el usuario pega una ruta a un `.js`, un repo clonado en otro sitio, un `CLAUDE.md`, un `README.md`, un PDF de reglas). Trátala como la fuente aunque no esté en `references/templates/started-games/`. Lee lo que exista en esa ruta (archivo único o todo el árbol si es carpeta) con la misma profundidad que a una plantilla conocida.
3. **Texto libre describiendo el juego**, sin ruta ni nombre de plantilla (ej. "un juego de esquivar meteoritos con power-ups de escudo"). No hay nada que leer del filesystem por este concepto — el texto del argumento **es** la fuente. Úsalo como respuestas ya dadas a la Fase 3 (no repreguntes lo que el texto ya contesta) y pregunta solo lo que falte.

Reglas comunes a los tres casos:

- **Si hay plantilla o ruta de referencia (casos 1 y 2):** léela completa antes de preguntar nada — su `CLAUDE.md`/`README.md` si existe, el código fuente (`game.js` u otros `.js`, ej. `04-arkanoid` tiene `levels.js` + `assets/spritesheet.js`), y `index.html`. El spec será un **port 1:1** de esa mecánica al contrato de motor de Arcade Vault, no una reinvención.
- **Si es texto libre (caso 3) o no se encuentra la ruta/plantilla dada:** dilo explícitamente al usuario — "no encontré plantilla ni ruta para X" o "diseñando desde la descripción, sin plantilla de referencia" — y pasa a preguntas de diseño desde cero (Fase 3), sembradas con lo que el texto ya haya aportado.
- Nunca inventes una plantilla o ruta que no existe, ni mezcles mecánicas de otro juego sin que el usuario lo pida.

## Fase 3 — Preguntas (bloques de 3–5, como `/spec`)

Adapta las preguntas según si hay plantilla (para confirmar decisiones de port) o no (para diseñar desde cero). Categorías fijas:

1. **Identidad de catálogo** — `title`, `short` (texto de card), `long` (texto de detalle), `cat` (`ARCADE`/`PUZZLE`/`SHOOTER`/`VERSUS`, CHECK constraint), `color` (`cyan`/`magenta`/`yellow`/`green`, CHECK constraint — evita repetir el de un juego visualmente cercano en `/games`), `id`/slug definitivo.
2. **Mecánica y controles** — qué teclas capturar (`ArrowLeft/Right/Up/Down`, `Space`, otras), qué gesto corresponde a cada acción. Si la plantilla usa mouse (caso `04-arkanoid`), pregunta explícitamente si se traduce a teclado o si el motor soporta mouse sobre el canvas.
3. **Modelo de vidas/nivel/puntuación → `EngineState`** — `EngineState` exige `score`, `lives`, `level`, `status`. Un juego sin vidas (ej. un puzzle tipo Tetris) necesita una decisión explícita de qué significa "vidas" ahí (¿1 vida = game over al primer fallo? ¿se omite el HUD de vidas?). Igual para "nivel" en juegos sin progresión natural.
4. **Condición de fin de partida y de pausa** — qué dispara `dead`/`gameover`; confirma que pausa es puramente externa (el motor interno no necesita saber de `"paused"`, ver `references/engine-contract.md`).
5. **Portada y qué queda fuera** — estilo visual de `.cover-<slug>` (paleta, motivo gráfico), y qué se pospone explícitamente a otro spec (sonido, táctil, multiplayer real, etc. — sigue el patrón de "Out" de specs 05/06).

Para antes de preguntar más cuando puedas responder: qué archivos cambian, cuál es el primer y último paso ejecutable del plan, y cómo se verifica cada criterio de aceptación.

## Fase 4 — Construir el spec sección por sección

Usa `template-spec.md` de este skill como esqueleto. Confirma con el usuario entre secciones (Scope → Data model → Implementation plan → Acceptance criteria → Decisions → Risks), igual que hace `/spec`. No avances a la siguiente sección sin conformidad de la anterior si el usuario mostró dudas.

**Reglas duras — cero excepciones:**

- **No se escribe código.** Nada de TypeScript del motor, nada de clases, nada de funciones reales. El Implementation plan describe en prosa qué archivo se crea y qué hace — no lo redacta.
- **No se escribe SQL real ni queries.** El spec puede _mencionar_ que habrá una migración con tal fila (columnas, valores conceptuales), pero no debe contener una sentencia `INSERT`/`CREATE`/`SELECT` ejecutable de punta a punta lista para copiar-pegar. Referencia el esquema existente (`supabase/migrations/20260729180408_create_games_and_scores.sql`) por nombre, no lo reproduzcas completo.
- **No se escribe CSS real.** Describe la dirección visual (paleta, motivo gráfico, colores del catálogo) en prosa; el `.cover-<slug>` concreto lo escribe la implementación, no el spec.
- **No se toca el filesystem del proyecto** salvo el propio archivo `specs/NN-<slug>.md`. Ningún `Write`/`Edit` sobre `app/`, `supabase/migrations/`, `lib/`.
- **No se ejecuta ninguna herramienta MCP de Supabase** (`apply_migration`, `execute_sql`, ni de lectura tampoco si no hace falta) — la implementación es enteramente responsabilidad del paso posterior (`/spec-impl` o el usuario a mano), nunca de este skill.
- No proponer tocar `app/games/engines/game-canvas.tsx`, `app/components/game-player.tsx`, `app/games/actions.ts`, `app/data/queries.ts`, ni las rutas de `/games`, `/salon-de-la-fama` — son genéricas y ya sirven al juego nuevo. Si algo obliga a tocarlas, es señal de que el scope está mal planteado; coméntalo al usuario en vez de meterlo silenciosamente en el plan.
- El `Depends on` del header va `06-leaderboard-y-catalogo-supabase` (y `05-asteroides-juego` si el port se apoya en su motor como referencia de patrón).

Si en algún momento la tentación es "para ir más rápido, ya dejo escrito el `engine.ts`/la migración/el CSS junto al spec" — no. El spec entero es el único entregable de este skill.

## Fase 5 — Guardar y parar

1. Confirma el nombre de archivo `specs/NN-<slug>.md` con el usuario antes de escribir.
2. Escribe el archivo con `Status: Draft` — **nunca** `Approved`, eso lo decide el usuario a mano.
3. Cierra el turno remitiendo a `/spec-impl <NN-slug>` para cuando lo aprueben. No ofrezcas implementar ahora ni empieces a escribir motor/CSS/SQL.
