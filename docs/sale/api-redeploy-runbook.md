# API Redeploy Runbook

Usa este runbook cuando `api.ttseasy.com` devuelve `404 DEPLOYMENT_NOT_FOUND` o cualquier otra respuesta que impida enseñar el portal API a compradores.

## Sintoma

- `https://api.ttseasy.com/`
- `https://api.ttseasy.com/pricing`
- `https://api.ttseasy.com/docs`
- `https://api.ttseasy.com/api/health`

Si cualquiera de estas rutas falla por ausencia de deployment, el listing debe rebajarse a `site + domain + codebase` hasta corregirlo.

## Causa tipica

- El dominio `api.ttseasy.com` apunta a un deployment inexistente o a un proyecto Vercel sin deploy activo.
- El proyecto API existe pero no tiene las variables obligatorias para arrancar en modo `api`.
- El proyecto API esta con `Framework Preset = Other` o con `Output Directory` incorrecto, por lo que Vercel no sirve el build de Next.js como portal.
- El dominio esta ligado al deployment correcto, pero `Vercel Authentication` bloquea a visitantes anonimos.

## Preflight

- Verificar que existen ambos proyectos Vercel:
  - `tts-easy-public`
  - `tts-easy-api`
- En `tts-easy-api`, confirmar:
  - `Framework Preset = Next.js`
  - `Output Directory = Next.js default`
  - `api.ttseasy.com` ligado al proyecto
  - `Vercel Authentication` desactivado si el portal debe ser publico
- Confirmar variables de operador:
  - `VERCEL_TOKEN`
  - `VERCEL_API_PROJECT`
  - `VERCEL_PUBLIC_PROJECT`
- Confirmar variables minimas del proyecto API segun `docs/deploy-vercel.md`

## Redeploy canonico

```bash
VERCEL_TOKEN=... \
VERCEL_SCOPE=... \
VERCEL_API_PROJECT=tts-easy-api \
VERCEL_PUBLIC_PROJECT=tts-easy-public \
npm run deploy
```

Si solo quieres probar la variante API, usa el mismo contrato pero validando primero local:

```bash
npm run growth:check:api:local
npm run dev:api
```

## Validacion despues del redeploy

- `https://api.ttseasy.com/` responde `200`
- `https://api.ttseasy.com/pricing` responde `200`
- `https://api.ttseasy.com/docs` responde `200`
- `https://api.ttseasy.com/api/health` responde `200`
- `/auth/login` muestra el formulario
- `/dashboard` funciona con sesion valida

## Si sigue fallando

- Revisar alias de dominio dentro de Vercel
- Revisar `Framework Preset` y `Output Directory` del proyecto API
- Revisar `Deployment Protection` y quitar `Vercel Authentication` si bloquea el acceso publico
- Revisar que `APP_VARIANT=api`
- Revisar `NEXT_PUBLIC_SITE_URL=https://api.ttseasy.com`
- Revisar `NEXT_PUBLIC_API_BASE_URL=https://api.ttseasy.com`
- Revisar secretos de Supabase y Stripe
- Consultar `docs/troubleshooting.md`

## Recuperacion confirmada

Estado validado el `2026-03-14`:

- `https://api.ttseasy.com/` responde `200`
- `https://api.ttseasy.com/pricing` responde `200`
- `https://api.ttseasy.com/docs` responde `200`
- `https://api.ttseasy.com/status` responde `200`
- `https://api.ttseasy.com/auth/login` responde `200`
- `https://api.ttseasy.com/api/health` responde `200`
- Rutas API sin credenciales ya devuelven errores funcionales (`401 invalid_api_key` / `401 unauthorized_session`) en lugar de `404`
