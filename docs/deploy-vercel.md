# Deploy en Vercel (producción dual: web pública + portal API)

Guía para desplegar el mismo repositorio en **dos proyectos Vercel**:

1. `tts-easy-public` -> `ttseasy.com`, `www.ttseasy.com`
2. `tts-easy-api` -> `api.ttseasy.com`

## 0) Objetivo operativo

- Mantener la web pública actual separada del portal API.
- Ejecutar auth/dashboard/API portal sólo en `api.ttseasy.com`.
- Mantener endpoints M2M `/api/v1/*` para clientes integradores.

## 0.1) Contrato canónico de deploy

El comando soportado por el repositorio es:

```bash
npm run deploy
```

Este comando ejecuta dos deployments de Vercel en secuencia:

1. `tts-easy-api`
2. `tts-easy-public`

Variables requeridas para el operador o CI:

- `VERCEL_TOKEN`
- `VERCEL_API_PROJECT`
- `VERCEL_PUBLIC_PROJECT`

Variable opcional:

- `VERCEL_SCOPE`
- `VERCEL_API_PROJECT_ID` y `VERCEL_PUBLIC_PROJECT_ID` como alias compatibles

Ejemplo:

```bash
VERCEL_TOKEN=... \
VERCEL_SCOPE=my-team \
VERCEL_API_PROJECT=tts-easy-api \
VERCEL_PUBLIC_PROJECT=tts-easy-public \
npm run deploy
```

`VERCEL_API_PROJECT` y `VERCEL_PUBLIC_PROJECT` pueden ser nombre o ID del
proyecto. El script tambien acepta `VERCEL_API_PROJECT_ID` y
`VERCEL_PUBLIC_PROJECT_ID`, usa `vercel deploy --project ...` y no depende de
`.vercel/project.json`.

## 1) Crear los 2 proyectos en Vercel

### 1.1 Proyecto público

- Nombre recomendado: `tts-easy-public`
- Environment Variable clave: `APP_VARIANT=public`
- Dominios: `ttseasy.com`, `www.ttseasy.com`

### 1.2 Proyecto API portal

- Nombre recomendado: `tts-easy-api`
- Environment Variable clave: `APP_VARIANT=api`
- Dominio: `api.ttseasy.com`

### 1.3 Perfil local recomendado

- Copiar `.env.api.local.example` a `.env.api.local`
- Mantener en `.env.api.local` el overlay de:
  - `PORT`
  - `APP_VARIANT=api`
  - `NEXT_PUBLIC_SITE_URL`
  - `NEXT_PUBLIC_API_BASE_URL`
  - flags de billing API
- Completar el resto de secretos en `.env.local` o `.env.api.local`
- Validar con `npm run growth:check:api:local`
- Ejecutar con `npm run dev:api`

## 2) Variables mínimas por proyecto

## 2.1 Compartidas (ambos proyectos)

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `GOOGLE_CLOUD_PROJECT_ID`
- `GOOGLE_CLOUD_CLIENT_EMAIL`
- `GOOGLE_CLOUD_PRIVATE_KEY`

## 2.2 API portal (`tts-easy-api`) obligatorias

- `NEXT_PUBLIC_SITE_URL=https://api.ttseasy.com`
- `NEXT_PUBLIC_API_BASE_URL=https://api.ttseasy.com`
- `API_BILLING_PREPAID_ENABLED=true`
- `API_BILLING_DB_ENABLED=true`
- `API_BILLING_LEGACY_FALLBACK_ENABLED=true` (migración temporal)
- `API_KEY_HASH_PEPPER=<secreto fuerte>`
- `SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_ACCOUNT_COUNTRY=ES`

## 2.3 Público (`tts-easy-public`) recomendadas

- `NEXT_PUBLIC_SITE_URL=https://ttseasy.com`
- `NEXT_PUBLIC_API_BASE_URL=https://api.ttseasy.com`
- Analytics/Ads opcionales:
  - `NEXT_PUBLIC_GA_ID`
  - `NEXT_PUBLIC_PUBLIC_MONETIZATION_ENABLED=true|false` para display
  - `NEXT_PUBLIC_AD_PROVIDER_PRIMARY=adsense|ethicalads|none`
  - `NEXT_PUBLIC_AD_PROVIDER_FALLBACK=ethicalads|none`
  - `NEXT_PUBLIC_AD_PROVIDER` como alias legacy temporal del provider primario
  - `NEXT_PUBLIC_ADSENSE_CLIENT` + `NEXT_PUBLIC_ADSENSE_SLOT_CONTENT` si usas AdSense
  - `NEXT_PUBLIC_ETHICALADS_PUBLISHER` si usas EthicalAds
  - La capa pública intenta `AdSense` primero y cae a `EthicalAds` solo en EN editorial elegible
- Si activas el gate inline de video:
  - `NEXT_PUBLIC_VIDEO_AD_GATE_ENABLED=true`
  - `NEXT_PUBLIC_VIDEO_AD_PROVIDER=<partner o mock>`
  - `NEXT_PUBLIC_VIDEO_AD_SCRIPT_URL=<script del adapter>` (si no usas `mock`)
  - `NEXT_PUBLIC_VIDEO_AD_TAG_URL=<tag o placement>`
  - `WEB_AD_GATE_SECRET=<secreto fuerte>`
  - Este gate puede vivir encendido aunque `NEXT_PUBLIC_PUBLIC_MONETIZATION_ENABLED=false`

## 3) Supabase (auth + DB)

1. Crear proyecto Supabase (UE recomendado para ES/UE).
2. Ejecutar el esquema de `docs/supabase-schema.sql`.
3. Configurar Auth:
   - Site URL: `https://api.ttseasy.com`
   - Redirect URLs: `https://api.ttseasy.com/auth/callback`
4. Configurar SMTP de Supabase con Resend:
   - Dominio validado (SPF + DKIM)
   - Remitente de login mágico

## 4) Stripe (prepago)

1. Cuenta de empresa (ES), modo live.
2. Stripe Tax activado (tax inclusive en checkout).
3. Métodos activos: card + wallets (Apple/Google Pay según disponibilidad).
4. Webhook endpoint:
   - URL: `https://api.ttseasy.com/api/v1/payments/stripe/webhook`
   - Eventos: `checkout.session.completed`, `charge.refunded`, `payment_intent.payment_failed`

## 5) DNS

- `ttseasy.com` y `www.ttseasy.com` -> proyecto `tts-easy-public`
- `api.ttseasy.com` -> proyecto `tts-easy-api`

Vercel emitirá automáticamente SSL cuando DNS esté correcto.

## 6) Validación post deploy

Antes del deploy API, conviene repetir el smoke local con el perfil `api`
(`npm run dev:api`) para comprobar auth, wallet, topups y `/api/v1/*`
contra los mismos secretos que luego subirás a Vercel.

### 6.1 Público

- Home y páginas locales cargan.
- `/api/tts` funciona con Turnstile.
- Los CTA públicos de API (`pricing`, `docs`, `login`) apuntan a `api.ttseasy.com` y no a rutas locales.
- Si `NEXT_PUBLIC_PUBLIC_MONETIZATION_ENABLED=true`, `AdSense` intenta cubrir los placements públicos aprobados.
- Si `NEXT_PUBLIC_AD_PROVIDER_FALLBACK=ethicalads`, solo aparece como fallback en `blog` y `compare` EN cuando `AdSense` no aplica.
- Si `NEXT_PUBLIC_VIDEO_AD_GATE_ENABLED=true`, el flujo `session -> complete -> /api/tts` funciona aunque el display público esté apagado.

### 6.2 API portal

- `/` landing API visible.
- `/auth/login` envía magic link.
- callback autentica y permite entrar a `/dashboard`.
- `/api/portal/me` responde 200 con sesión.
- `/api/v1/tts` acepta Bearer API key creada en dashboard.

### 6.3 Billing

- Recarga 5€ mínima aceptada.
- Webhook acredita wallet una sola vez (dedup).
- `402 insufficient_balance` cuando corresponde.

## 7) Rollout recomendado

1. Activar `API_BILLING_DB_ENABLED=true` sólo en `tts-easy-api`.
2. Mantener `API_BILLING_LEGACY_FALLBACK_ENABLED=true` durante migración de claves.
3. Migrar claves legacy y monitorizar `legacy_fallback_lookup_rate`.
4. Apagar fallback cuando el uso de env keys sea residual.
