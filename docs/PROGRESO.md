# Proyecto - Progreso

## Estado General: En progreso

---

## Tareas

| Tarea | Estado | Fecha | Notas |
|---|---|---|---|
| Recuperar `api.ttseasy.com` en produccion | Completado | 2026-03-14 | Se corrigio la configuracion del proyecto `tts-easy-api` en Vercel, se reanclo el dominio API al deployment de produccion y el portal volvio a responder `200` en landing, docs, pricing, status, login y healthcheck. |
| Preparar sale kit para listing y handoff | Completado | 2026-03-14 | Se anadio `npm run sale:check`, dossier de venta para Flippa, checklist de evidencia/transferencia y runbook para el redeploy del API. |
| Reducir superficie indexable para SEO y AdSense | Completado | 2026-03-10 | Se añadieron `noindex` a blogs no-EN, legales, hubs no-EN y landings debiles; el sitemap publica solo URLs prioritarias. |
| Reordenar la home con enfoque content-first | Completado | 2026-03-10 | Se anadio header global, intro editorial, posts destacados, FAQ visible y se redujo la publicidad de la home a un solo slot. |
| Reforzar senales E-E-A-T en blog y comparativas | Completado | 2026-03-10 | Se incorporaron author/lastUpdated, JSON-LD mejorado, CTA de API y metodologia/benchmarks en paginas compare. |
| Monetizacion v2 con portal real y backup EthicalAds | Completado | 2026-03-10 | Los CTA publicos ya resuelven a `api.ttseasy.com`, el upsell post-sintesis empuja al portal prepago y los placements display quedan limitados a blog/compare con provider switchable. |
| Monetizacion v3 con video ad gate y home clean-first | Completado | 2026-03-11 | Se anadieron gate de video patrocinado, deteccion de adblock, telemetria asociada, CTA post-sintesis y un rediseño de la home centrado en generar y descargar MP3, junto con deploy canonico por script. |
| Pulido visual UI y Vercel Analytics | Completado | 2026-03-11 | Rediseño app-first del hero, botones neutrales, inputs refinados, hover states, Vercel Analytics integrado. |
| Saneamiento AdSense multilenguaje y poda editorial | Completado | 2026-03-12 | Se migro el inventario curado a MDX por locale, se apago la monetizacion publica por gate global, compare quedo en `noindex` y el sitemap paso a generarse desde metadata editorial indexable. |
| Migracion display a AdSense con fallback EthicalAds | Completado | 2026-03-12 | Se retiro el proveedor legacy, se resolvieron slots por cadena `AdSense -> EthicalAds`, se elimino el bloque post-TTS y el video gate quedo desacoplado del display. |
| Cierre operativo de monetizacion publica | Completado | 2026-03-13 | Se alineo el contrato de entorno publico, el checker paso a exigir solo providers activos por flags y el typecheck quedo estable en checkout limpio. |

---

## Log de Cambios

### 2026-03-14
- Se recupero `api.ttseasy.com` en Vercel corrigiendo el `Framework Preset` del proyecto API a `Next.js`, reasociando el dominio al deployment de produccion y desactivando `Vercel Authentication` para el portal publico.
- Se revalido el portal en produccion: `/`, `/pricing`, `/docs`, `/status`, `/auth/login` y `/api/health` responden `200`, mientras que `/api/v1/*` y `/api/portal/*` ya contestan errores funcionales (`401`) en vez de `404`.
- Se actualizo la documentacion operativa y de venta para reflejar que el bloqueo tecnico ya no es el host del API sino la evidencia comercial pendiente.
- Se anadio `scripts/sale-readiness-check.mjs` y el comando `npm run sale:check` para generar un reporte reproducible del estado publico del asset, el sitemap y la evidencia minima de buyer diligence.
- Se creo `docs/sale/` con el kit de venta: dossier de listing para Flippa, checklist de evidencia, checklist de transferencia y runbook de redeploy del API.
- Se documento el caso `api.ttseasy.com -> 404 DEPLOYMENT_NOT_FOUND` en troubleshooting para que el riesgo quede explicitado y sea corregible antes de listar como SaaS operativo.

### 2026-03-13
- Se extrajo la logica del checker de fase 1 a una libreria reutilizable con tests especificos para la variante publica.
- Se endurecio `growth:check:public` para exigir solo las credenciales del display/video gate realmente activados por flags y se eliminaron referencias legacy fuera del runtime actual.
- Se simplifico la resolucion del provider display quitando `NEXT_PUBLIC_AD_PROVIDER_ACTIVE` del runtime y actualizando tests asociados.
- Se alinearon `README`, ejemplos de entorno y guias de Vercel con el contrato publico objetivo `AdSense -> EthicalAds` y gate inline de video.
- Se ajusto `typecheck` para no depender de artefactos previos de `.next` mediante `tsc --noEmit --incremental false`.

### 2026-03-12
- Se introdujo un loader editorial unificado para `blog`, `use-cases` y `compare`, con frontmatter obligatorio, minimos de palabras y validacion en tests.
- Se regenero el inventario curado multilenguaje en MDX, manteniendo solo las piezas indexables definidas para blog y use-cases, y dejando compare en `noindex`.
- Se desactivo la monetizacion publica mediante `NEXT_PUBLIC_PUBLIC_MONETIZATION_ENABLED`, suprimiendo slots, SmartLinks y scripts publicitarios cuando el gate esta apagado.
- Se corrigieron `alternates`, `LanguageSwitcher` y el sitemap para publicar solo locales con contenido nativo indexable.
- Se ampliaron About y los metadatos de hubs publicos para reflejar propiedad editorial, revision y localizacion real.
- Se anadio `docs/growth/ad-monetization-platforms.md` con una comparativa interna de plataformas de monetizacion publisher, metricas clave y recomendacion operativa para TTS Easy.
- Se retiro el proveedor display legacy del runtime y de la documentacion operativa, se introdujo fallback `AdSense -> EthicalAds` por slot y se desacoplo el video ad gate del flag global de display.

### 2026-03-11
- Se incorporo `VideoAdGate` con sesiones `/api/ads/*`, outcomes medidos, bypass por no-fill/timeout y manejo explicito de adblock.
- Se reforzo la monetizacion publica con smart links/slots conmutables, nuevos eventos analytics y soporte de provider en el layout y el workspace.
- Se rediseño la home para priorizar el flujo pegar texto -> generar -> descargar, con variante `home` de `TtsApp`, chips de confianza y rail lateral compacto.
- Se unifico el contrato de deploy en `npm run deploy` y se agregaron scripts auxiliares para entornos `public` y `api`.
- Se rediseño el hero de la home a layout app-first: titulo compacto centrado, TtsApp prominente y chips de confianza debajo.
- Se refinaron botones (generar negro neutro, descarga clara), inputs con focus mejorado, hover states en cards/chips y footer con mas respiro.
- Se integro `@vercel/analytics` en el layout root (solo variante publica).
- Se anadio configuracion de Claude Code (`.claude/`).

### 2026-03-10
- Se aplico la poda SEO con `noindex` condicional y sitemap reducido a URLs con mas valor.
- Se reorganizo la home con navegacion global, introduccion editorial, posts destacados y una sola insercion publicitaria.
- Se ampliaron los diccionarios y la pagina About con copy editorial mas sustancial en seis idiomas.
- Se anadieron `author` y `lastUpdated` a los posts en ingles y se reforzaron los datos estructurados.
- Se incorporaron metodologia, benchmarks y disclosure comercial en las paginas de comparativa.
- Se corrigio el funnel comercial publico para que pricing/docs del portal usen URLs absolutas del dominio API.
- Se anadio un upsell de API tras la generacion de audio y se elimino la insercion publicitaria dentro del workspace.
- Se introdujo una capa de monetizacion por proveedor con `NEXT_PUBLIC_AD_PROVIDER`, soporte EthicalAds y suppressions/medicion por placement.
