# Sale Readiness Report

- Generated at: 2026-03-14T08:35:52.996Z
- Public base URL: https://www.ttseasy.com
- API base URL: https://api.ttseasy.com
- Recommended listing mode: WARN - Ready to position as site + domain + codebase
- Recommendation note: Do not market it as a fully live SaaS until API health and buyer evidence are complete.

## Endpoint checks

| Target | Status | HTTP | Final URL | Notes |
| --- | --- | --- | --- | --- |
| Public landing | PASS | 200 | https://www.ttseasy.com/en | Free Text to Speech Online | TTS Easy |
| Public sitemap | PASS | 200 | https://www.ttseasy.com/sitemap.xml | 78 URLs detected in sitemap. |
| API landing | PASS | 200 | https://api.ttseasy.com/ | Landing should confirm the API variant is live. |
| API pricing | PASS | 200 | https://api.ttseasy.com/pricing | Pricing page is a key buyer proof point. |
| API docs | PASS | 200 | https://api.ttseasy.com/docs | API docs should resolve for buyer validation. |
| API health | PASS | 200 | https://api.ttseasy.com/api/health | Health endpoint should answer 200. |

## Evidence checks

Drop buyer-facing proof files into `docs/sale/evidence` using the prefixes documented in `docs/sale/evidence/README.md`.

| Evidence | Status | Path |
| --- | --- | --- |
| Vercel Analytics export or screenshots (90 days) | WARN | Missing |
| Domain ownership proof | WARN | Missing |
| Monthly operating cost snapshot | WARN | Missing |

## Content and product surface

- Total MDX assets detected in `content/`: 72
- Indexable MDX assets detected: 36
- URLs detected in sitemap: 78

### Content by section

| Section | Files |
| --- | --- |
| blog | 48 |
| compare | 6 |
| use-cases | 18 |

### Content by section and locale

| Bucket | Files |
| --- | --- |
| blog/de | 8 |
| blog/en | 8 |
| blog/es | 8 |
| blog/fr | 8 |
| blog/it | 8 |
| blog/pt | 8 |
| compare/de | 1 |
| compare/en | 1 |
| compare/es | 1 |
| compare/fr | 1 |
| compare/it | 1 |
| compare/pt | 1 |
| use-cases/de | 3 |
| use-cases/en | 3 |
| use-cases/es | 3 |
| use-cases/fr | 3 |
| use-cases/it | 3 |
| use-cases/pt | 3 |

## Sitemap sample

- https://ttseasy.com/en
- https://ttseasy.com/es
- https://ttseasy.com/pt
- https://ttseasy.com/fr
- https://ttseasy.com/de
- https://ttseasy.com/it
- https://ttseasy.com/en/about
- https://ttseasy.com/es/about
- https://ttseasy.com/pt/about
- https://ttseasy.com/fr/about

## Known issues to disclose

- No API availability issues detected.

## Next actions before listing

1. Export 90-day analytics evidence into `docs/sale/evidence`.
2. Add domain ownership proof and a monthly cost snapshot into `docs/sale/evidence`.
3. If any API checks fail, follow `docs/sale/api-redeploy-runbook.md` and rerun `npm run sale:check`.
4. Update the listing copy in `docs/sale/flippa-listing.md` with current traffic numbers and the final ask price band.
