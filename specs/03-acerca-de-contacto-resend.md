# SPEC 03 — Página Acerca de + formulario de contacto con Resend

> **Status:** Implemented
> **Depends on:** 02-home-games-route
> **Date:** 2026-07-27
> **Objective:** Reemplazar el stub `/acerca-de` con el contenido real portado de `references/templates/home-about/about.jsx` (misión, highlights, divider) e implementar el formulario de contacto funcional que envía el mensaje por correo real vía Resend usando una Server Action.

---

## Scope

**In:**

- Reemplazar `app/acerca-de/page.tsx` (stub actual) con contenido real: hero (kicker, título, misión), 3 highlights (HEART/BROWSER/PLANT + iconos SVG), divider animado, sección contacto (intro + tips) — todo portado 1:1 de `references/templates/home-about/about.jsx`.
- Formulario de contacto (nombre, correo, mensaje) con validación simple no-vacío + shake en error, igual que la referencia.
- Server Action que envía el mensaje por correo real vía Resend SDK (`resend` npm package), remitente `onboarding@resend.dev`, destino `alejo.dev97@gmail.com` (corregido durante implementación — ver Decisiones), asunto `Nuevo mensaje — Arcade Vault`.
- Estado de éxito: terminal simulada (`terminal-success`) igual que la referencia, mostrando nombre del remitente.
- Estado de error real: si Resend falla (key inválida, caída de servicio), la terminal muestra línea `[FAIL]` + botón para reintentar, en vez de asumir éxito siempre.
- `RESEND_API_KEY` en `.env.local` (no comiteado, ya cubierto por `.gitignore`).
- Nueva dependencia `resend` en `package.json`.
- CSS: agregar bloque ABOUT (`references/templates/home-about/styles.css:1071-1204`, hasta antes de `GAMEPAD`) a `app/globals.css`, portado 1:1.
- Reveal-on-scroll (`IntersectionObserver`) en divider y sección contacto, mismo patrón que `useReveal()` ya usado en `app/page.tsx`.

**Out (queda para otro spec si se decide):**

- Throttling / rate limiting de envíos — descartado explícitamente por el usuario.
- Dominio propio verificado en Resend — se usa remitente de pruebas `onboarding@resend.dev`.
- Persistencia de mensajes enviados (no se guarda historial en DB/archivo).
- Cambios a nav, otras rutas, u otro contenido fuera de `/acerca-de`.
- Notificaciones/confirmación por correo al usuario que envía el formulario (solo llega el mensaje al destino, no hay auto-reply).
- Captcha o verificación anti-bot.

---

## Modelo de datos

No se agregan estructuras de dominio a `app/data/` (no es contenido de juegos). Solo un tipo para el estado del formulario, vía `useActionState`:

```ts
// app/acerca-de/actions.ts
export type ContactFormState = {
  status: "idle" | "success" | "error";
  name?: string;   // nombre del remitente, para el mensaje de éxito
  error?: string;  // mensaje de error si Resend falla
};
```

- La Server Action `sendContactMessage(prevState: ContactFormState, formData: FormData): Promise<ContactFormState>` vive en `app/acerca-de/actions.ts` (`"use server"` en la cabecera del archivo).
- Sin nuevo archivo en `app/data/`: el contenido de highlights/tips es literal inline en el componente, igual criterio que spec 02 con el home.

---

## Plan de implementación

1. **Dependencia.** `npm install resend`. `RESEND_API_KEY` agregado a `.env.local` (no comiteado) con la key provista por el usuario.
2. **CSS — bloque ABOUT.** Append `references/templates/home-about/styles.css:1071-1204` (hasta antes de `GAMEPAD`) verbatim en `app/globals.css`.
3. **Server Action.** `app/acerca-de/actions.ts` (`"use server"`): `sendContactMessage(prevState, formData)` — extrae `name`/`email`/`msg` de `FormData`, valida no-vacío (si falla, retorna `{status:"error", error:"..."}` sin llamar Resend), instancia `new Resend(process.env.RESEND_API_KEY)`, llama `resend.emails.send({from:"Arcade Vault <onboarding@resend.dev>", to:"alesmo30@gmail.com", subject:"Nuevo mensaje — Arcade Vault", ...})` con el nombre/correo/mensaje en el cuerpo; retorna `{status:"success", name}` o `{status:"error", error}` si Resend lanza.
4. **Componente About.** `app/acerca-de/page.tsx` pasa a Client Component (`"use client"`) portando `about.jsx`: hero, highlights (`HighlightIcon` con los 3 SVG), divider con reveal, sección contacto. `useActionState(sendContactMessage, {status:"idle"})` reemplaza el `useState` local de envío; `useReveal()`-style effect para `.reveal` (mismo patrón de `app/page.tsx`).
5. **Formulario.** Campos nombre/correo/mensaje controlados con `useState` local para inputs (para permitir shake en validación cliente-side igual a la referencia) + `<form action={formAction}>`. Mientras `pending` (de `useActionState`), botón muestra estado deshabilitado/cargando.
6. **Estado éxito.** `status === "success"`: terminal simulada con líneas `[OK]` y línea final con nombre en mayúsculas, botón "ENVIAR OTRO MENSAJE" resetea a estado idle (recarga el formulario, limpia inputs).
7. **Estado error.** `status === "error"`: terminal simulada con líneas `[OK]` previas + línea `[FAIL] <error.error>` en rojo/magenta, botón "REINTENTAR" vuelve a mostrar el formulario con los datos ya tecleados (no se pierden).
8. **Cierre.** `npm run lint` y `npm run build` limpios.
9. **Verificación.** Playwright MCP: navegar a `/acerca-de`, confirmar hero/highlights/divider/contacto renderizan, enviar formulario válido y confirmar llegada real del correo (o al menos confirmar que Resend responde sin error 401/403 en la consola de red), probar envío vacío (shake), simular error (key inválida temporalmente) y confirmar botón reintentar funciona.

---

## Criterios de aceptación

- [ ] `npm run build` y `npm run lint` terminan sin errores ni warnings.
- [ ] `/acerca-de` renderiza: hero (kicker, título, misión), 3 highlights con iconos, divider animado, sección contacto (intro + tips).
- [ ] Enviar formulario con nombre/correo/mensaje válidos dispara la Server Action, llega correo real a `alesmo30@gmail.com` vía Resend.
- [ ] Enviar formulario con algún campo vacío no llama a Resend: dispara shake visual, sin transición a éxito ni error.
- [ ] Éxito real: terminal simulada muestra líneas `[OK]` y línea final con nombre en mayúsculas; botón "ENVIAR OTRO MENSAJE" limpia el formulario.
- [ ] Fallo de Resend (ej. key inválida): terminal muestra línea `[FAIL]` con el error; botón "REINTENTAR" recupera el formulario con los datos ya tecleados.
- [ ] Reveal-on-scroll (divider + sección contacto) anima al hacer scroll, sin error de hidratación en consola.
- [ ] A 375px de ancho, hero/highlights/contacto no desbordan horizontalmente.
- [ ] Verificado vía Playwright MCP: navegación a `/acerca-de`, envío válido, envío vacío, y simulación de error, confirmando estados visuales y sin errores de consola. Sesión MCP manual, sin archivo de test comiteado.

---

## Decisiones

- **Sí:** Server Action (`"use server"`) para envío. **No:** Route Handler + `fetch`. Nativo Next 16, sin JS requerido, menos código, patrón ya documentado en `node_modules/next/dist/docs`.
- **Sí:** remitente `onboarding@resend.dev`. **No:** dominio propio verificado. Usuario no tiene dominio verificado en Resend; funciona sin configuración DNS.
- **Sí:** destino fijo `alejo.dev97@gmail.com`. **No:** `alesmo30@gmail.com` (definido originalmente) ni configurable por variable de entorno separada. Corregido durante implementación: Resend en modo test (remitente `onboarding@resend.dev`, sin dominio verificado) solo permite enviar a la dirección dueña de la cuenta — confirmado con envío real fallido durante verificación Playwright MCP. Verificar un dominio propio en resend.com/domains permitiría volver a `alesmo30@gmail.com`, pero queda como paso manual futuro, fuera de este spec.
- **Sí:** estado de error real con botón reintentar. **No:** asumir éxito siempre como la referencia original. Envío real puede fallar (key inválida, Resend caído); ocultar el fallo sería engañoso.
- **Sí:** sin throttling / rate limiting. **No:** cooldown de 1min + máx 5/10min (explorado y descartado). Decisión explícita del usuario — app de prueba, no le preocupa spam por ahora.
- **Sí:** validación cliente-side simple (no-vacío + shake), igual que la referencia. **No:** validación de formato de email con regex. Usuario confirmó que la validación simple basta.
- **Sí:** bloque CSS ABOUT portado 1:1 desde la referencia. **No:** reescribir estilos desde cero. Mismo criterio que specs 01/02 — CSS de la plantilla se porta tal cual.
- **Sí:** `RESEND_API_KEY` solo en `.env.local`, nunca en código ni en el spec. **No:** hardcodear la key. Es un secreto real que el usuario compartió en el chat; se trata como tal.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| `RESEND_API_KEY` filtrada (compartida en este chat) permite a terceros enviar correo desde la cuenta | Recomendar regenerar la key en el dashboard de Resend antes o después de implementar; nunca se escribe en archivo comiteado |
| Resend en tier gratuito puede rechazar envíos por límite de volumen o dominio de prueba restringido | Estado de error captura cualquier fallo de `resend.emails.send`, usuario ve `[FAIL]` en vez de éxito falso |
| Sin throttling, un usuario puede reenviar el formulario repetidamente | Aceptado explícitamente — fuera de scope por decisión del usuario |
| `useActionState` es API relativamente nueva de React 19 — comportamiento distinto a `useState` tradicional para formularios | Seguir el patrón documentado en `node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md` (ya revisado), que cubre `useActionState` con Server Actions |
