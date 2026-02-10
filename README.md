# TTS Easy

MVP de una web de texto-a-voz (TTS) pensado para ser simple de usar:
pegas texto, detecta idioma + acento, eliges "lector" (voz), y te devuelve un MP3 reproducible/descargable.

Este repositorio es un **Next.js App Router** con:

- Detección de idioma local y rápida (heurística) con debounce y cancelación.
- Sugerencia de acento/variante (por ejemplo, `es-ES` vs `es-MX`) cuando hay ambigüedad.
- Selector de lector (mapea a voces de Google TTS por idioma).
- Generación de MP3 vía **Google Cloud Text-to-Speech**.
- Controles anti-abuso: **Cloudflare Turnstile** + **rate limit**.
- "Budget guard" mensual aproximado para contener costes (`MONTHLY_BUDGET_USD`).
- Integración opcional de **GA4** y **AdSense** por variables de entorno.

## Arquitectura (en 2 minutos)

Flujo principal:

1. UI (`src/app/page.tsx`) captura texto y llama a `POST /api/language/detect`.
2. Con el locale final, la UI llama a `GET /api/readers?locale=...` para cargar voces disponibles.
3. Turnstile genera un token (un solo uso). La UI lo envía en `POST /api/tts`.
4. `POST /api/tts` ejecuta, en este orden:
   - Rate limit por IP (Upstash Redis si está configurado; si no, fallback en memoria).
   - Verificación de Turnstile (obligatoria en producción).
   - Budget guard mensual (Upstash Redis si está configurado; si no, fallback en memoria).
   - Llamada a Google TTS (service account por variables de entorno) y devuelve `audio/mpeg`.

Por qué este orden:

- Primero rate limit y CAPTCHA para cortar abuso antes de llegar a Google (coste).
- El budget guard evita sorpresas si el tráfico sube o hay abuso que se cuela.

## Servicios externos y "por qué"

- **Google Cloud Text-to-Speech**: convierte texto a MP3. Se usa en backend (`src/lib/googleTts.ts`) y requiere Node.js runtime.
- **Cloudflare Turnstile**: CAPTCHA ligero para frenar bots. Tokens son **single-use** (un token no vale para dos requests). La UI remonta el widget tras cada intento para forzar un token nuevo.
- **Upstash Redis (REST)**: almacén ligero para rate limit y contadores de coste mensual. Si no está configurado, hay fallback en memoria (válido para desarrollo; no sirve para control real en producción).
- **Vercel**: hosting recomendado para Next.js, despliegue automático y dominios. Guía: `docs/deploy-vercel.md`.
- **GA4 / AdSense**: opcional; solo se activa si defines las variables `NEXT_PUBLIC_*` correspondientes.

## Variables de entorno

La lista completa (con comentarios) está en `.env.example`.

Resumen:

- Google Cloud TTS (producción):
  - `GOOGLE_CLOUD_PROJECT_ID`
  - `GOOGLE_CLOUD_CLIENT_EMAIL`
  - `GOOGLE_CLOUD_PRIVATE_KEY` (ojo con saltos de línea: en Vercel suele pegarse como `\\n`).
- Upstash (recomendado en producción):
  - `UPSTASH_REDIS_REST_URL`
  - `UPSTASH_REDIS_REST_TOKEN`
- Turnstile (obligatorio en producción si quieres protección real):
  - `TURNSTILE_SECRET_KEY` (server-only)
  - `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (client-safe)
- Control de costes:
  - `MONTHLY_BUDGET_USD` (por defecto `50`)
- Opcional:
  - `NEXT_PUBLIC_GA_ID`
  - `NEXT_PUBLIC_ADSENSE_CLIENT`
  - `NEXT_PUBLIC_ADSENSE_SLOT_TOP`, `NEXT_PUBLIC_ADSENSE_SLOT_MID`, `NEXT_PUBLIC_ADSENSE_SLOT_STICKY`

## Ejecutar en local

1. Copia el archivo de entorno:

```bash
cp .env.example .env.local
```

2. Instala dependencias:

```bash
npm install
```

3. Arranca el servidor:

```bash
npm run dev
```

4. Abre `http://localhost:3000`.

Notas:

- Si no configuras Turnstile/Upstash en local, la app funciona igualmente (hay bypass/dev fallbacks).
- Para que Google TTS funcione localmente sin service account, necesitarías credenciales por defecto
  (no recomendado). Lo normal es usar service account por variables.

## Endpoints

- `POST /api/language/detect`: heurística de idioma + candidatos de locale.
- `GET /api/readers?locale=<bcp47>`: devuelve las voces (lectores) disponibles para ese locale.
- `POST /api/tts`: genera MP3 (rate limit + turnstile + budget + Google TTS).
- `GET /api/health`: healthcheck simple.

## Errores comunes (y qué significan)

`POST /api/tts` puede devolver:

- `403 captcha_failed`: Turnstile ha fallado. El backend incluye `details` con códigos tipo `timeout-or-duplicate`.
  - `timeout-or-duplicate` suele ser token caducado o reutilizado: espera a que el widget genere uno nuevo.
- `429 rate_limited`: demasiadas peticiones por IP.
- `429 budget_exceeded`: el coste proyectado del mes superaría `MONTHLY_BUDGET_USD`.
- `500 tts_failed`: fallo al llamar a Google TTS o a su SDK.

## Documentación adicional

- `docs/architecture.md`: módulos, decisiones y flujo completo.
- `docs/deploy-vercel.md`: paso a paso para desplegar en Vercel con Google Cloud + Upstash + Turnstile.
- `docs/troubleshooting.md`: checklist de diagnóstico por error.

## Eventos (GA4)

En `src/lib/analytics.ts`:

- `language_detected`
- `locale_ambiguous_prompt_shown`
- `locale_manual_selected`
- `tts_success`
- `tts_error`
- `mp3_download`
- `ad_slot_view`
