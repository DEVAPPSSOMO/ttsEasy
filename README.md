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
- API comercial `v1` con API key, modo legado (USD) y modo prepago (EUR) con flag de rollout.
- Portal API en `api.ttseasy.com` con autenticación de usuario (magic link), dashboard y gestión de API keys.
- Integración opcional de **GA4**, display ads por proveedor (`AdSense` o `EthicalAds`) y un gate inline de video ads para la web pública.

## Arquitectura (en 2 minutos)

Flujo principal:

1. UI (`src/app/page.tsx`) captura texto y llama a `POST /api/language/detect`.
2. Con el locale final, la UI llama a `GET /api/readers?locale=...` para cargar voces disponibles.
3. Si el gate de video está activo, la UI abre un video inline, crea una sesión efímera (`POST /api/ads/session`) y canjea el resultado por un token (`POST /api/ads/complete`).
4. Turnstile genera un token (un solo uso). La UI lo envía en `POST /api/tts`.
5. `POST /api/tts` ejecuta, en este orden:
   - Validación del `adGateToken` efímero si el gate de video está activo.
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
- **Supabase (Auth + Postgres)**: login mágico del portal, cuentas y API keys productivas.
- **Resend (SMTP)**: entrega de magic links a través de Supabase Auth.
- **GA4 / Ads**: opcional; la capa pública usa `AdSense` como primario y `EthicalAds` sólo como fallback editorial EN cuando así lo configuras en `NEXT_PUBLIC_AD_PROVIDER_PRIMARY` / `NEXT_PUBLIC_AD_PROVIDER_FALLBACK`.

## Deploy canónico

El contrato soportado para producción es:

```bash
npm run deploy
```

Este comando despliega en Vercel primero `api` y después `public`, usando la
misma raíz del repositorio para ambos proyectos.

Variables de operador requeridas para ese flujo:

- `VERCEL_TOKEN`
- `VERCEL_API_PROJECT`
- `VERCEL_PUBLIC_PROJECT`

Opcional:

- `VERCEL_SCOPE` para fijar explícitamente el team/personal scope de Vercel
- `VERCEL_API_PROJECT_ID` y `VERCEL_PUBLIC_PROJECT_ID` como alias compatibles

Ejemplo:

```bash
VERCEL_TOKEN=... \
VERCEL_SCOPE=my-team \
VERCEL_API_PROJECT=tts-easy-api \
VERCEL_PUBLIC_PROJECT=tts-easy-public \
npm run deploy
```

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
- Gate inline de video ads (opcional en web pública):
  - `NEXT_PUBLIC_VIDEO_AD_GATE_ENABLED`
  - `NEXT_PUBLIC_VIDEO_AD_PROVIDER`
  - `NEXT_PUBLIC_VIDEO_AD_SCRIPT_URL` (si el provider no es `mock`)
  - `NEXT_PUBLIC_VIDEO_AD_TAG_URL`
  - `WEB_AD_GATE_SECRET`
  - Puede mantenerse activo aunque `NEXT_PUBLIC_PUBLIC_MONETIZATION_ENABLED=false`
- Control de costes:
  - `MONTHLY_BUDGET_USD` (por defecto `50`)
- Variante de app / dominios:
  - `APP_VARIANT` (`public` o `api`)
  - `NEXT_PUBLIC_SITE_URL`
  - `NEXT_PUBLIC_API_BASE_URL`
- API comercial:
  - `API_BILLING_KEYS_JSON`
  - `API_BILLING_DB_ENABLED`
  - `API_BILLING_LEGACY_FALLBACK_ENABLED`
  - `API_KEY_HASH_PEPPER`
  - `API_BILLING_DEV_KEY` (solo local/dev)
  - `API_BILLING_TRIAL_CHARS` (por defecto `500000`)
  - `API_BILLING_INVOICE_MIN_USD` (por defecto `5`)
  - `API_BILLING_DEFAULT_MONTHLY_HARD_LIMIT_CHARS` (por defecto `100000000`)
  - `API_BILLING_PREPAID_ENABLED` (activa billing v2 prepago en EUR)
  - `API_BILLING_AUTO_RECHARGE_TRIGGER_EUR` (default `2`)
  - `API_BILLING_AUTO_RECHARGE_AMOUNT_EUR` (default `10`)
- Stripe (prepago):
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `STRIPE_PUBLISHABLE_KEY`
  - `STRIPE_ACCOUNT_COUNTRY` (default recomendado `ES`)
- Supabase:
  - `SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SUPABASE_JWT_SECRET` (si tu setup lo requiere)
- Opcional:
  - `NEXT_PUBLIC_GA_ID`
  - `NEXT_PUBLIC_PUBLIC_MONETIZATION_ENABLED` para display público
  - `NEXT_PUBLIC_AD_PROVIDER_PRIMARY` (`none`, `adsense`, `ethicalads`)
  - `NEXT_PUBLIC_AD_PROVIDER_FALLBACK` (`none`, `ethicalads`)
  - `NEXT_PUBLIC_ADSENSE_CLIENT`
  - `NEXT_PUBLIC_ADSENSE_SLOT_CONTENT`
  - `NEXT_PUBLIC_ETHICALADS_PUBLISHER`

Política actual de placements display:

- `AdSense` usa placements por página (`home`, `tools`, `use-cases`, `blog`, `compare`).
- `EthicalAds` actúa como fallback automático solo en páginas EN editoriales (`blog`, `compare`) donde sea elegible.
- El gate inline de video puede seguir activo aunque el display público esté apagado.
- Los CTA públicos hacia pricing/docs/login del portal siempre resuelven a `NEXT_PUBLIC_API_BASE_URL`.

Notas operativas del checker:

- `.env.example` conserva defaults seguros para desarrollo local, con display y video apagados.
- `.env.production.public.example` refleja el contrato objetivo para producción pública: display activo (`AdSense -> EthicalAds`) y video gate activo.
- `npm run growth:check:public` exige sólo la configuración del proveedor realmente activado por flags: AdSense/EthicalAds para display y claves del video gate sólo si el gate está encendido.

## Ejecutar en local

1. Copia el archivo de entorno:

```bash
cp .env.example .env.local
```

Para levantar la variante API portal en local con un overlay dedicado:

```bash
cp .env.api.local.example .env.api.local
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

Para la variante API local:

```bash
npm run growth:check:api:local
npm run dev:api
```

Notas para la variante API local:

- `dev:api` carga `.env`, `.env.local` y `.env.api.local` en ese orden.
- El overlay fija `APP_VARIANT=api` y, por defecto, usa `http://localhost:3200`.
- Si cambias `PORT`, actualiza también `NEXT_PUBLIC_SITE_URL` y `NEXT_PUBLIC_API_BASE_URL`.
- El mismo overlay se reutiliza en `npm run build:api` y `npm run start:api`.

Para migrar claves legacy del JSON a Supabase:

```bash
API_BILLING_DB_ENABLED=true npm run billing:import-legacy-keys
```

Con el perfil local API:

```bash
npm run billing:import-legacy-keys:api-local
```

Notas:

- Si no configuras Turnstile/Upstash en local, la app funciona igualmente (hay bypass/dev fallbacks).
- Para que Google TTS funcione localmente sin service account, necesitarías credenciales por defecto
  (no recomendado). Lo normal es usar service account por variables.

## Endpoints

- `POST /api/language/detect`: heurística de idioma + candidatos de locale.
- `GET /api/readers?locale=<bcp47>`: devuelve las voces (lectores) disponibles para ese locale.
- `POST /api/ads/session`: crea una sesión efímera para el gate inline de video.
- `POST /api/ads/complete`: canjea una sesión resuelta por un `adGateToken` de un solo uso.
- `POST /api/tts`: genera MP3 (rate limit + turnstile + budget + Google TTS).
- `POST /api/v1/tts`: API comercial (Bearer API key). Soporta modo legado (USD) y prepago (EUR) según `API_BILLING_PREPAID_ENABLED`.
- `GET /api/v1/billing/summary?month=YYYY-MM`: resumen mensual (legacy o prepago).
- `POST /api/v1/billing/topups/checkout-session`: crea sesión Stripe Checkout para recargar wallet EUR.
- `POST /api/v1/payments/stripe/webhook`: webhook Stripe (firma requerida).
- `GET /api/v1/billing/wallet`: saldo wallet + estado auto-recarga.
- `GET /api/v1/billing/transactions`: movimientos de wallet.
- `GET/PATCH /api/v1/billing/auto-recharge`: consulta/configura auto-recarga.
- `GET /api/portal/me`: sesión y cuenta del dashboard.
- `GET /api/portal/wallet`: saldo wallet por sesión.
- `GET /api/portal/transactions`: transacciones wallet por sesión.
- `POST /api/portal/topups/checkout-session`: checkout Stripe para usuarios del dashboard.
- `GET/PATCH /api/portal/auto-recharge`: auto-recarga por sesión.
- `GET/POST/DELETE /api/portal/api-keys`: CRUD de API keys en dashboard.
- `POST /api/portal/auth/magic-link`: envío de magic link de acceso.
- `GET /api/health`: healthcheck simple.

## Errores comunes (y qué significan)

`POST /api/tts` puede devolver:

- `403 adblock_detected`: el cliente ya detectó un blocker y el generador web queda bloqueado.
- `403 ad_gate_required`: falta el token efímero del gate inline.
- `403 ad_gate_invalid`: token del gate inválido, expirado o ya consumido.
- `403 captcha_failed`: Turnstile ha fallado. El backend incluye `details` con códigos tipo `timeout-or-duplicate`.
  - `timeout-or-duplicate` suele ser token caducado o reutilizado: espera a que el widget genere uno nuevo.
- `429 rate_limited`: demasiadas peticiones por IP.
- `429 budget_exceeded`: el coste proyectado del mes superaría `MONTHLY_BUDGET_USD`.
- `500 tts_failed`: fallo al llamar a Google TTS o a su SDK.

`POST /api/v1/tts` puede devolver:

- `401 invalid_api_key`: API key ausente/incorrecta o deshabilitada.
- `402 billing_required`: solo modo legado (postpago).
- `402 insufficient_balance`: saldo prepago insuficiente (modo `billing:v2`).
- `429 rate_limited`: límite por key+IP excedido.
- `429 quota_exceeded`: límite duro mensual configurado para la cuenta.
- `500 tts_failed`: fallo al sintetizar audio.

`/api/portal/*` puede devolver:

- `401 unauthorized_session`: sesión ausente/inválida.
- `403 forbidden_account_access`: intento de operar sobre recursos de otra cuenta.
- `409 api_key_limit_reached`: límite de claves activas alcanzado.
- `500 internal_error`: error operativo no recuperable.

## Documentación adicional

- `docs/architecture.md`: módulos, decisiones y flujo completo.
- `docs/deploy-vercel.md`: paso a paso para desplegar en Vercel con Google Cloud + Upstash + Turnstile.
- `docs/supabase-schema.sql`: esquema base (accounts, api_keys, account_profile + RLS) para producción.
- `docs/troubleshooting.md`: checklist de diagnóstico por error.
- `docs/growth/operating-dashboard.md`: dashboard semanal SEO/SEM/social con KPIs y guardrails.
- `docs/growth/analytics-taxonomy.md`: eventos y parámetros estándar para medir el embudo.
- `docs/growth/sem-playbook.md`: reglas operativas y kill-rules de SEM (fase de validación).
- `docs/growth/social-playbook.md`: sistema de ejecución de contenido corto orgánico.
- `docs/growth/editorial-contract.md`: contrato mínimo para nuevas URLs indexables.
- `docs/growth/step1-production-setup.md`: guía ejecutable del paso 1 (env vars + deploy gate).

## Eventos (GA4)

En `src/lib/analytics.ts`:

- `language_detected`
- `locale_ambiguous_prompt_shown`
- `locale_manual_selected`
- `tts_success`
- `tts_error`
- `mp3_download`
- `ad_slot_view`
- `ad_slot_suppressed`
- `api_upsell_view`
- `sponsored_block_view`
- `affiliate_click`
- `video_ad_gate_started`
- `video_ad_started`
- `video_ad_skipped`
- `video_ad_completed`
- `video_ad_no_fill`
- `video_ad_blocked`
- `video_ad_timeout`
- `video_ad_token_rejected`
