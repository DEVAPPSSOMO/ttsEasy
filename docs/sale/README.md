# Sale Kit

Este directorio agrupa el material para sacar `TTS Easy` al mercado sin improvisar el listing ni el handoff.

## Orden recomendado

1. Ejecuta `npm run sale:check` para regenerar `docs/sale/readiness-report.md`.
2. Sube las pruebas de trafico, dominio y costes a `docs/sale/evidence/`.
3. Ajusta el ask price y pega el copy listo de `docs/sale/flippa-listing.md`.
4. Revisa `docs/sale/transfer-checklist.md` antes de negociar el alcance final.

## Marketplace recomendado

- Flippa primero: mejor encaje para un asset con web publica live, codigo vendible y trafico sin revenue verificado.
- Acquire.com despues: solo cuando `api.ttseasy.com` vuelva a estar live y puedas sincronizar metricas verificables.
- Sedo en paralelo solo para `domain-only`.
- Empire Flippers fuera por ahora: el activo no cumple el umbral minimo de beneficios recurrentes exigido por su marketplace.

## Regla de posicionamiento

- Si la web publica responde `200`, pero el API falla o faltan pruebas verificables, vender como `site + domain + codebase`.
- Si la web publica, el API y la evidencia de buyer diligence estan completas, vender como `micro-SaaS TTS`.

## Documentos incluidos

- `flippa-listing.md`: copy base para el listing publico.
- `transfer-checklist.md`: checklist de cierre y handoff.
- `evidence-checklist.md`: data room minima antes de publicar.
- `api-redeploy-runbook.md`: runbook corto para corregir el `404 DEPLOYMENT_NOT_FOUND` del API.
- `readiness-report.md`: snapshot generado automaticamente por `npm run sale:check`.
