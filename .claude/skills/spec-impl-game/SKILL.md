---
name: spec-impl-game
description: Especialización de /spec-impl para specs de juego nuevo. Implementa el spec exactamente igual que /spec-impl (mismo gate de estado Aprobado, misma rama, mismos pasos con pausa) y, solo al terminar y verificar los criterios de aceptación, dispara en secuencia (nunca en paralelo) los agentes skin-designer y game-porter sobre el juego recién implementado. Úsalo en vez de /spec-impl cuando el spec corresponde a un juego nuevo del catálogo.
disable-model-invocation: true
argument-hint: <NN-spec-name>
allowed-tools: Bash(git status:*), Bash(git branch:*), Bash(git checkout:*), Bash(cat:*), Bash(ls:*)
---

# /spec-impl-game — implementador de specs de juego + auditoría de skins y táctil

Este skill **no reinventa nada**: es `/spec-impl` con un paso final añadido. Primero sigue `~/.agents/skills/spec-impl/SKILL.md` (symlinkeado en `.claude/skills/spec-impl/`) al pie de la letra — mismo gate de estado `Aprobado`/`Approved`, misma creación de rama `spec-NN-slug`, mismo resumen de spec, misma implementación paso a paso con pausa para revisar diff. **Lee ese archivo completo antes de hacer nada** — este skill solo añade la Fase 5.

## Cuándo usar esto y no `/spec-impl` directo

Solo cuando el spec `$ARGUMENTS` describe un **juego nuevo** para el catálogo (nueva carpeta en `app/games/engines/`, entrada nueva en `registry.ts`, fila nueva en `games`). Si el spec no es de juego (p. ej. specs de infraestructura, auth, estilos generales), usa `/spec-impl` normal — este skill no aporta nada ahí y el Paso 5 no aplicaría.

## Fase 1–4 — idénticas a `/spec-impl`

Ejecuta exactamente las cuatro fases de `~/.agents/skills/spec-impl/SKILL.md`:

1. Identificar el spec en `specs/` a partir de `$ARGUMENTS`.
2. Validar que el estado significa "Aprobado" (cualquier idioma) — si no, el mismo mensaje de error estándar, y parar ahí.
3. Crear/cambiar a la rama `spec-NN-slug` según `AutoCreateBranch` en `specs/.spec-config.yml`, y mostrar el resumen del spec (objetivo, alcance, plan, criterios de aceptación).
4. Implementar paso a paso, pausando tras cada paso para que el usuario revise el diff, hasta completar el plan y verificar los criterios de aceptación uno por uno.

No saltes ni comprimas estas fases. No arranques la Fase 5 si la Fase 4 no terminó — es decir, si el usuario no confirmó que los criterios de aceptación pasan.

## Fase 5 — Auditoría posterior: skins y táctil (secuencial, nunca en paralelo)

Se dispara **solo** cuando:

- Todos los pasos del plan de implementación están hechos, y
- El usuario confirmó que los criterios de aceptación pasan (o los verificaste tú mismo contra el spec y no hay pendientes).

Antes de disparar nada, identifica el `game.id` del juego recién implementado (el mismo que usaste en `registry.ts` y en la migración de esta spec) — es el argumento que le pasarás a ambos agentes.

Orden estricto, uno después del otro, **nunca en paralelo**:

1. **Primero `skin-designer`** (`.claude/agents/skin-designer.md`) con el `game.id` como argumento. Espera a que termine y entrega su informe completo (veredicto COMPLETO/PARCIAL/AUSENTE, tabla de checks, archivos tocados) antes de continuar.
2. **Después `game-porter`** (`.claude/agents/game-porter.md`) con el mismo `game.id`. Espera su informe (veredicto COMPLETO/PARCIAL/AUSENTE/YA PORTADO, tabla de checks) antes de dar la tarea por cerrada.

Razón del orden secuencial: ambos agentes tocan el mismo motor (`app/games/engines/<slug>/engine.ts`) — `skin-designer` en paletas/`draw()`, `game-porter` en `setControl`. Correrlos en paralelo arriesga que uno pise el diff del otro a mitad de escritura. No hay dependencia funcional entre ellos (pueden ir en cualquier orden relativo), pero deben ir uno a la vez.

Si cualquiera de los dos agentes responde que "no es su turno" (p. ej. el juego no tiene fila en `registry.ts` todavía — no debería pasar si la Fase 4 terminó bien), repórtalo al usuario tal cual y no fuerces una reimplementación.

## Fase 6 — Cierre

Con los dos informes en mano, entrega al usuario un resumen corto:

```
✅ Spec NN-slug implementado y verificado.

skin-designer  → <veredicto>
game-porter    → <veredicto>

Archivos tocados en total: <lista o "ver informes arriba">
```

No dupliques el contenido completo de ambos informes si ya se mostraron en el chat — basta con el veredicto de cada uno en el resumen final.
