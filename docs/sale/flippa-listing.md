# Flippa Listing Draft

## Enfoque recomendado

- Vender `TTS Easy` como proyecto completo: dominio + web publica + codigo + setup de despliegue.
- Estado actual del `2026-03-14`: `api.ttseasy.com` vuelve a estar live en produccion con landing, pricing, docs, status, login y healthcheck publicos.
- Si el API vuelve a caerse antes de publicar, describirlo como `site + domain + codebase with deployable API stack`, no como SaaS plenamente operativo.
- Rango inicial defendible:
  - `EUR 4.9k - 6.9k` si no hay analytics verificables.
  - `EUR 6.9k - 9.9k` si puedes mostrar trafico verificable y crecimiento organico.
  - `EUR 9.9k - 15k` solo si el API vuelve a estar live y el listing se puede presentar como micro-SaaS operativo.

## Hechos que ya puedes defender

- Next.js App Router con dual deploy `public` + `api`.
- TTS con Google Cloud, anti-abuso con Turnstile, rate limit y budget guard.
- Billing prepago en EUR con Stripe, portal auth con Supabase y dashboard de API keys.
- Activo SEO publicado en 6 idiomas (`en`, `es`, `pt`, `fr`, `de`, `it`).
- `72` assets MDX localizados en `content/` y `78` URLs publicadas en sitemap en la ultima comprobacion.
- `143/143` tests en verde y `typecheck` limpio en la validacion local de `2026-03-14`.

## Copy listo para pegar (EN)

### Listing title

Multilingual TTS micro-SaaS and SEO content asset with Stripe billing, live domain, and deployable API

### Tagline

Text-to-speech product with a live public site, multilingual SEO footprint, buyer-ready codebase, and API monetization infrastructure.

### Summary

TTS Easy is a multilingual text-to-speech product built on Next.js and designed around two monetization paths: a public no-signup web experience and a prepaid API portal for programmatic usage.

The product includes:

- A live public website on `ttseasy.com`
- A deployable API and dashboard stack for `api.ttseasy.com`
- Google Cloud Text-to-Speech integration
- Stripe prepaid billing in EUR
- Supabase-based portal authentication and API key management
- SEO content and landing pages across 6 locales

This is a strong fit for a buyer who wants to acquire a niche AI utility with real product surface, organic content already published, and a clear monetization path, without starting from zero.

### Why this asset is attractive

- Multilingual footprint: 6 locales already wired into product UX and content.
- Content moat: 72 localized MDX content assets and 78 sitemap URLs already published.
- Technical maturity: automated tests, typed codebase, deploy script, env contracts, and troubleshooting docs already in repo.
- Monetization options: public ad monetization, lead capture through the free product, and prepaid API billing via Stripe.
- Clean transfer package: repo, domain, deployment contract, environment map, and handoff checklist are already documented.

### Tech and ops stack

- Frontend and backend: Next.js 14, React 18, TypeScript
- TTS provider: Google Cloud Text-to-Speech
- Abuse controls: Cloudflare Turnstile + rate limiting + monthly budget guard
- Billing: Stripe prepaid wallet and auto-recharge flows
- Auth and data layer: Supabase Auth + Postgres
- Hosting: Vercel dual-project deploy (`public` + `api`)

### Monetization status

- Revenue is not being represented as verified recurring revenue in this listing.
- Traffic should be disclosed using attached Vercel Analytics exports or screenshots.
- Public monetization and API monetization infrastructure are already implemented in code.

### What is included

- Domain: `ttseasy.com`
- Full repository and content
- Deploy scripts and environment contract
- Buyer handoff checklist
- Two-week asynchronous handoff for transfer and operational questions

### Buyer disclosure

- The public site is live.
- The API portal is live in production as of March 14, 2026.
- Buyer-facing traffic and cost evidence still need to be attached before claiming a stronger operating multiple.
- No verified revenue multiple is being claimed unless buyer-visible evidence is attached.

### Suggested FAQ answers

**Why are you selling?**  
Focus and capital allocation. The asset is developed enough to be valuable to a buyer who can operate and grow it further.

**How much work does the buyer need to do after acquisition?**  
Minimal for the public site. If the API deployment is down at the time of sale, the buyer needs to redeploy the API project using the documented Vercel setup.

**What growth opportunities remain?**  
Bring the API portal fully live, push deeper into long-tail SEO, expand API sales, and tighten analytics and conversion tracking.

**Is the traffic verifiable?**  
It should be presented with Vercel Analytics exports or screenshots in the data room.
