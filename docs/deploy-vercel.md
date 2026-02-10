# Deploy en Vercel (producción)

Checklist y pasos recomendados para desplegar TTS Easy en Vercel con:

- Google Cloud Text-to-Speech
- Cloudflare Turnstile
- Upstash Redis (rate limit + budget)
- Dominio propio

## 0) Preparación

- Repositorio en GitHub conectado a Vercel.
- Variables de entorno listas (ver `.env.example`).

## 1) Crear el proyecto en Vercel

1. Importa el repo (Framework: Next.js).
2. Asegúrate de desplegar desde `main` (o tu rama de producción).
3. En "Environment Variables", define todas las variables necesarias en **Production** y, si quieres previews funcionales, también en **Preview**.

Nota importante:

- Cuando cambias variables en Vercel, normalmente necesitas un **redeploy** para que apliquen.

## 2) Configurar Google Cloud Text-to-Speech

### 2.1 Crear proyecto y habilitar API

1. Crea/selecciona un proyecto en Google Cloud.
2. Habilita la API **Cloud Text-to-Speech**.

### 2.2 Crear service account y key

1. Crea un **Service Account** para el backend.
2. Otórgale permisos para usar la API.
   - Si no sabes cuáles son mínimos: empieza por permisos tipo *Service Usage Consumer*.
   - Si recibes errores de permisos, añade el rol específico de Text-to-Speech (por ejemplo `roles/texttospeech.user`).
3. Genera una key JSON del service account.

### 2.3 Variables en Vercel

En Vercel (Production):

- `GOOGLE_CLOUD_PROJECT_ID`: el ID del proyecto.
- `GOOGLE_CLOUD_CLIENT_EMAIL`: email del service account.
- `GOOGLE_CLOUD_PRIVATE_KEY`: private key del JSON.

Notas:

- Pega el private key completo, incluyendo `-----BEGIN PRIVATE KEY-----`.
- Si la key se pega con `\\n`, el backend la convierte a saltos de línea reales (`src/lib/googleTts.ts`).

## 3) Configurar Upstash (Redis REST)

Crear base de datos en Upstash y copiar:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

Por qué es importante:

- Sin Upstash, el rate limit y el budget guard funcionan "en memoria" y no son consistentes en producción.

## 4) Configurar Cloudflare Turnstile

1. Crea un widget de Turnstile.
2. Añade los hostnames:
   - el dominio final (por ejemplo `www.tudominio.com`)
   - y, si lo usas, el raíz (`tudominio.com`)
   - y, mientras pruebes, tu `*.vercel.app` de producción
3. Copia:
   - `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (pública, va al cliente)
   - `TURNSTILE_SECRET_KEY` (privada, solo backend)

Notas:

- Tokens de Turnstile son **single-use**.
- Si ves `captcha_failed` con `timeout-or-duplicate`, normalmente es token expirado o reutilizado.

## 5) Conectar dominio

En Vercel:

1. Project Settings -> Domains.
2. "Add Existing" y añade:
   - `tudominio.com`
   - `www.tudominio.com`
3. Decide si quieres redirigir raíz -> www (recomendado) o al revés.

DNS:

- Si tu dominio está en Vercel (comprado en Vercel), Vercel gestiona DNS directamente.
- Si tu dominio está fuera, Vercel te indicará registros A/CNAME/ALIAS a crear en tu registrador.

SSL:

- Vercel genera certificado automáticamente cuando DNS está correcto.

## 6) Validación post-deploy

Checklist:

1. `GET /api/health` responde `200`.
2. En la UI:
   - la detección funciona,
   - el selector de lectores carga,
   - el botón "Generar y reproducir" se habilita tras Turnstile,
   - y se obtiene audio.
3. Repite 2-3 veces seguidas:
   - no debe aparecer `captcha_failed` por token duplicado.

## 7) Operación y mantenimiento

- Rotación de credenciales:
  - Si rotas la key del service account, actualiza las variables en Vercel y redeploy.
- Budget:
  - Ajusta `MONTHLY_BUDGET_USD` según tu tolerancia de gasto.
- Turnstile:
  - Si cambias de dominio o añades subdominios, actualiza hostnames permitidos.

