# Troubleshooting

Checklist práctico para diagnosticar problemas comunes en producción.

## `/api/portal/*` devuelve `404 not_found`

Causa típica:

- La app está arrancada con `APP_VARIANT=public`, así que el portal API queda apagado.

Acciones:

- En local, usa `npm run dev:api` en lugar de `npm run dev`.
- Valida el overlay con `npm run growth:check:api:local`.
- Revisa que `APP_VARIANT=api`.
- Revisa que `NEXT_PUBLIC_SITE_URL` y `NEXT_PUBLIC_API_BASE_URL` apunten al mismo host local o a `https://api.ttseasy.com`.

Notas:

- El perfil local recomendado vive en `.env.api.local` y se apoya en `.env.local` como base.
- Si defines `PORT`, ambos `NEXT_PUBLIC_*_URL` deben usar ese mismo puerto.

## `captcha_failed` (403) en `POST /api/tts`

El backend devuelve:

```json
{ "error": "captcha_failed", "details": ["..."] }
```

Casos típicos:

- `timeout-or-duplicate`
  - El token expiró o se reutilizó.
  - Solución: espera a que Turnstile genere un token nuevo y reintenta.
  - Nota: los tokens son single-use; la UI remonta el widget tras cada intento.

- `missing_secret`
  - En producción falta `TURNSTILE_SECRET_KEY`.
  - Solución: añadir variable en Vercel (Production) y redeploy.

- `missing_token`
  - La UI está llamando sin token (widget no emitió callback).
  - Solución: revisar que `NEXT_PUBLIC_TURNSTILE_SITE_KEY` está definido y que Turnstile carga.

Si el widget falla al cargar:

- Revisa que el hostname actual está permitido en el widget de Turnstile (por ejemplo `www.tudominio.com`).

## `ad_gate_required`, `ad_gate_invalid` o `adblock_detected` en `POST /api/tts`

Estos errores aparecen cuando el gate inline de video está activo en la web pública.

Casos típicos:

- `ad_gate_required`
  - La UI llamó a `/api/tts` sin el token efímero emitido por `/api/ads/complete`.
  - Solución: revisar que `NEXT_PUBLIC_VIDEO_AD_GATE_ENABLED=true`, que el flujo `session -> complete` responde `200`, y que la UI envía `adGateToken`.

- `ad_gate_invalid`
  - El token expiró, no coincide con la IP/User-Agent original o ya fue consumido.
  - Solución: repetir el flujo desde el botón "Generar y reproducir". Si ocurre de forma sistemática, revisar `WEB_AD_GATE_SECRET` y que no haya múltiples instancias con envs distintas.

- `adblock_detected`
  - El navegador marcó la sesión como bloqueada por adblock y el generador web quedó deshabilitado.
  - Solución: desactivar el adblocker para `ttseasy.com` o usar la API en `api.ttseasy.com`.

## `rate_limited` (429)

La ruta `POST /api/tts` limita requests por IP y ventana de tiempo.

Acciones:

- Espera a que pase el `retryAfterSec`.
- Si necesitas cambiar el límite, ajusta parámetros en `src/app/api/tts/route.ts`.

Notas:

- En producción, define Upstash (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`) para que el rate limit sea consistente.

## `budget_exceeded` (429)

El budget guard proyecta el coste del mes y bloquea si supera `MONTHLY_BUDGET_USD`.

Acciones:

- Sube `MONTHLY_BUDGET_USD` si es esperado.
- Reduce uso o ajusta los tiers/voices si quieres abaratar.

Notas:

- Es una estimación basada en `PRICE_PER_MILLION` (ver `src/lib/costGuard.ts`).
- Se acumula en Upstash (recomendado) o memoria (solo dev).

## `tts_failed` (500)

Errores al llamar a Google Cloud TTS.

Checklist:

- API Cloud Text-to-Speech habilitada en el proyecto.
- Variables de entorno correctas:
  - `GOOGLE_CLOUD_PROJECT_ID`
  - `GOOGLE_CLOUD_CLIENT_EMAIL`
  - `GOOGLE_CLOUD_PRIVATE_KEY`
- La key privada pegada completa y con formato correcto.
  - El código reemplaza `\\n` por saltos de línea.
- Permisos del service account (si ves errores de permisos):
  - añade roles necesarios a nivel de proyecto (ver `docs/deploy-vercel.md`).

## `invalid_api_key` (401) en `/api/v1/*`

Checklist:

- La cabecera usa `Authorization: Bearer <api_key>`.
- La key está activa en `API_BILLING_KEYS_JSON` o en Supabase `public.api_keys`.
- Si estás migrando a DB, `API_BILLING_LEGACY_FALLBACK_ENABLED=true`.
- Si usas DB-first, `API_BILLING_DB_ENABLED=true` y `SUPABASE_SERVICE_ROLE_KEY` está presente.
- Si importaste claves legacy, usa `npm run billing:import-legacy-keys:api-local` o el script equivalente con las variables cargadas.

Nota:

- Si `API_BILLING_KEYS_JSON` está presente, `dev_api_key` deja de ser válido salvo que también exista ahí.

## `insufficient_balance` (402) en `POST /api/v1/tts`

La key es válida, pero el wallet prepago no tiene saldo suficiente.

Checklist:

- Crear sesión de recarga mínima (5 EUR).
- Confirmar que el webhook de Stripe llega a `/api/v1/payments/stripe/webhook`.
- Verificar que el webhook acredita saldo una sola vez.
- Revisar `GET /api/v1/billing/wallet` para confirmar el saldo antes de reintentar TTS.

## “No suena” / audio no se reproduce

La UI recibe un blob MP3 y crea una URL temporal.

Checklist:

- Probar botón "Descargar MP3" para confirmar que el MP3 llega.
- Revisar consola del navegador (errores de autoplay / permisos).
- Revisar si el audio se genera pero no se asigna:
  - lógica en `src/app/page.tsx`.

## Turnstile no carga o aparece en bucle

Checklist:

- Revisa hostnames permitidos del widget (Turnstile).
- Revisa que el sitio no está bloqueando scripts de Cloudflare (CSP/extensiones).
- En Vercel, confirma que `NEXT_PUBLIC_TURNSTILE_SITE_KEY` está presente en Production.
