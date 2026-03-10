# Growth Operating Dashboard (Weekly)

## North Star
- Monthly monetization revenue (`api_topups_eur_monthly` + `display_ad_revenue_monthly`)

## Acquisition KPIs
- Non-brand organic sessions
- Search Console impressions, clicks, CTR
- Query coverage by cluster (BOFU / use-case / compare)

## Quality KPIs
- RPM (revenue per 1,000 sessions)
- Pages per session
- `scroll_depth` at 75%
- `tts_success_rate` = `tts_success / cta_generate_click`
- `mp3_download_rate` = `mp3_download / tts_success`

## Technical Guardrails
- LCP <= 2.5s
- INP < 200ms
- CLS < 0.1

## Weekly Views
1. SEO Technical
   - Indexability by template
   - Canonical/hreflang validation
   - Sitemap freshness
2. Content
   - Published URLs vs plan
   - Internal links compliance
   - Ranking movement (top 3 / top 10)
3. Monetization
   - RPM by page type (`home`, `use_case`, `tool`, `blog`, `compare`)
   - Ad slot fill and CTR by slot
   - `api_upsell_view -> api_pricing` progression from public pages
4. Distribution
   - Social post count and click-through to landing pages
   - Channel-level retention signals

## Notes
- Keep ad density in balanced mode. Never increase ad slots if CWV guardrails are broken.
