# Step 1 - Production Setup (Env + Deploy Gate)

This implements the execution layer for Phase 1: measurement + SEO technical readiness.

## 1) Prepare per-variant env files

- Public site template: `.env.production.public.example`
- API portal template: `.env.production.api.example`
- Local API overlay template: `.env.api.local.example`

Copy each template to your secret manager and fill real values.
For local API work, copy `.env.api.local.example` to `.env.api.local` and keep
shared secrets in `.env.local` or move them into the overlay.

## 2) Load env vars into Vercel

For each project (`tts-easy-public`, `tts-easy-api`), load env vars at least for `production`.

Recommended CLI pattern (if you use Vercel CLI):

```bash
# Example for one variable
vercel env add NEXT_PUBLIC_SITE_URL production
```

## 3) Run deploy gate checks locally or CI

```bash
npm run growth:check:public
npm run growth:check:api
npm run growth:check:api:local
```

Expected behavior:
- Exit code 0: required setup is ready for deployment.
- Exit code 1: missing required vars and/or setup issues.

## 4) Deploy sequence

1. Deploy `tts-easy-api` first.
2. Validate auth + billing + `/api/v1/*` health.
3. Deploy `tts-easy-public`.
4. Validate homepage + `/api/tts` + ad slots + analytics tags.

## 5) Post-deploy verification (Phase 1)

- SEO
  - `robots.txt` and `sitemap.xml` accessible.
  - Localized/fallback indexation rules behave as expected.
- Measurement
  - GA4 receives: `landing_view`, `cta_generate_click`, `tts_success`, `mp3_download`, `share_created`, `ad_slot_view`, `article_cta_click`, `sponsored_block_view`, `smartlink_click`, `affiliate_click`.
- Social metadata
  - `og:image` resolves to `/og-image.png`.

## 6) Weekly operating artifacts

Use:
- `docs/growth/operating-dashboard.md`
- `docs/growth/analytics-taxonomy.md`
- `docs/growth/sem-playbook.md`
- `docs/growth/social-playbook.md`
