# Troubleshooting

Checklist práctico para diagnosticar problemas comunes en producción.

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

