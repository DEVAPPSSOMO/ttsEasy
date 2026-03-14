# Evidence Checklist

Usa esta lista como data room minima antes de publicar el listing.

## Archivos recomendados

Guarda la evidencia buyer-facing en `docs/sale/evidence/` con estos prefijos:

| Evidencia | Prefijo sugerido | Formato |
| --- | --- | --- |
| Vercel Analytics 90 dias | `vercel-analytics-90d` | `png`, `pdf`, `csv`, `md` |
| Prueba de propiedad del dominio | `domain-proof` | `png`, `pdf`, `md` |
| Snapshot de costes mensuales | `monthly-costs` | `md`, `pdf`, `xlsx` |

`npm run sale:check` busca automaticamente esos prefijos y los marca como presentes o ausentes.

## Evidencia que debe existir antes de publicar

| Item | Estado esperado | Donde dejarlo |
| --- | --- | --- |
| Trafico verificable de 90 dias | Obligatorio para pedir tramo alto | `docs/sale/evidence/` |
| Propiedad del dominio | Obligatorio | `docs/sale/evidence/` |
| Costes mensuales reales de operar | Obligatorio | `docs/sale/evidence/` |
| Reporte actual de readiness | Obligatorio | `docs/sale/readiness-report.md` |
| Runbook de redeploy API | Obligatorio si el API no esta live | `docs/sale/api-redeploy-runbook.md` |
| Checklist de transferencia | Obligatorio | `docs/sale/transfer-checklist.md` |

## Datos que conviene tener a mano en la negociacion

- Visitantes unicos 30/90 dias
- Principales paginas de entrada
- % de trafico organico vs directo
- Coste mensual por proveedor:
  - Vercel
  - Google Cloud TTS
  - Upstash
  - Supabase
  - Stripe fees
- Tiempo estimado de soporte post-venta
- Que cuentas se transfieren y cuales se recrean

## Regla de honestidad comercial

- Sin analytics verificables: bajar el posicionamiento a `site + domain + codebase`.
- Sin API live: no venderlo como micro-SaaS operativo.
- Sin snapshot de costes: no defender el ask con multiples agresivos.
