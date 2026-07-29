# SPEC 04 — Conexión con Supabase remoto

> **Status:** Implemented
> **Depends on:** 03-acerca-de-contacto-resend
> **Date:** 2026-07-29
> **Objective:** Conectar la aplicación Next.js con el proyecto Supabase remoto ya existente (paquetes `@supabase/supabase-js` + `@supabase/ssr`, clientes browser/servidor separados, variables de entorno, y una ruta healthcheck que confirme la conexión real) — sin implementar todavía auth, tablas ni persistencia de datos.

---

## Scope

**In:**

- Instalar `@supabase/supabase-js` y `@supabase/ssr`.
- Crear `lib/supabase/client.ts` — cliente browser (`"use client"`) con `createBrowserClient` de `@supabase/ssr`.
- Crear `lib/supabase/server.ts` — cliente servidor con `createServerClient` de `@supabase/ssr`, para Server Components y Route Handlers.
- `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` en `.env.local` (no comiteado, ya cubierto por `.gitignore`), valores: URL `https://izyihpadbcilwqlynmud.supabase.co` y key publishable moderna (`sb_publishable_...`), ambos ya obtenidos vía MCP (`get_project_url`, `get_publishable_keys`).
- Ruta healthcheck temporal `app/api/supabase-health/route.ts`: hace un ping real contra el proyecto (`supabase.auth.getSession()`), se usa solo para verificar la conexión durante la implementación y se elimina antes de mergear (ver Decisiones).

**Out (queda para specs futuras):**

- Auth real (login/registro/OAuth) — reemplazo de `av_user`/localStorage.
- Cualquier tabla, esquema, migración o RLS en la base de datos.
- Persistencia de scores/leaderboard.
- Realtime, Edge Functions, Storage, o cualquier otro producto Supabase.
- Cambios en `app/auth/page.tsx`, `app/auth-context.tsx`, `game-player.tsx` o `salon-de-la-fama` — siguen usando datos ficticios como hoy.

---

## Implementation plan

1. **Dependencias.** `npm install @supabase/supabase-js @supabase/ssr`.
2. **Variables de entorno.** Crear/editar `.env.local` con `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (valores del proyecto remoto, ya obtenidos vía MCP). Confirmar que `.env.local` sigue en `.gitignore`.
3. **Cliente browser — `lib/supabase/client.ts`.** `createBrowserClient(url, publishableKey)` de `@supabase/ssr`, exportado como función `createClient()`.
4. **Cliente servidor — `lib/supabase/server.ts`.** `createServerClient` de `@supabase/ssr` leyendo/escribiendo cookies vía `cookies()` de `next/headers` (async en Next 16), exportado como función `async createClient()`.
5. **Healthcheck temporal — `app/api/supabase-health/route.ts`.** Route Handler `GET` que instancia el cliente servidor, llama `supabase.auth.getSession()`, y responde `NextResponse.json({ ok: true, connected: true })` en éxito o `{ ok: false, error }` con status 500 en fallo. Se usa solo para verificar la conexión.
6. **Cierre.** `npm run build` y `npm run lint` limpios. Verificar la conexión levantando `npm run dev` y pegándole al healthcheck (`curl`) → `{ ok: true, connected: true }`. Una vez confirmado, eliminar `app/api/supabase-health/route.ts` — no queda como endpoint permanente.

---

## Acceptance criteria

- [x] `npm run build` y `npm run lint` terminan sin errores ni warnings.
- [x] `package.json` incluye `@supabase/supabase-js` y `@supabase/ssr`.
- [x] `.env.local` contiene `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, y no está trackeado por git (`git status` no lo muestra).
- [x] `lib/supabase/client.ts` y `lib/supabase/server.ts` existen y exportan sus funciones `createClient()` sin errores de tipos.
- [x] `GET /api/supabase-health` en `npm run dev` respondió `{ ok: true, connected: true }` con status 200 (verificado, luego eliminado — ver Decisiones).
- [x] Ningún archivo fuera del scope (`app/auth/*`, `game-player.tsx`, `salon-de-la-fama`, etc.) cambia.
- [x] `app/api/supabase-health/route.ts` no existe en el estado final del branch.

---

## Decisions

- **Sí:** `@supabase/ssr` con clientes separados browser/servidor. **No:** un único `supabase-js` genérico. Preparado para auth real (cookies, sesión server-side) sin reescribir la capa de conexión en la próxima spec.
- **Sí:** key publishable moderna (`sb_publishable_...`) nombrada `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. **No:** anon key legacy JWT. Sigue la convención actual del dashboard de Supabase (confirmado por captura del usuario), mejor rotación independiente.
- **Sí:** healthcheck vía `app/api/supabase-health/route.ts` llamando `auth.getSession()`. **No:** query contra una tabla (el proyecto está vacío, no hay ninguna). Verificable sin depender de schema futuro.
- **Sí:** valores de URL/key obtenidos vía MCP (`get_project_url`, `get_publishable_keys`), confirmados contra la captura del dashboard. **No:** pedirlos a mano. Evita error de tipeo, y MCP ya tenía acceso al proyecto remoto.
- **Sí:** `app/api/supabase-health/route.ts` es temporal — se usa una vez para verificar la conexión (build + `curl` en dev) y se elimina antes de mergear. **No:** dejarlo como endpoint permanente. Decisión explícita del usuario: no quería verificación manual en el navegador ni un endpoint de diagnóstico expuesto de forma indefinida; el healthcheck cumplió su propósito y no aporta valor una vez confirmada la conexión.

---

## Qué **no** está en este spec

- Auth real, OAuth, login/registro funcional.
- Tablas, migraciones, RLS.
- Persistencia de scores o leaderboard real.
- Realtime, Edge Functions, Storage.
- Tests automatizados (no hay framework instalado).
