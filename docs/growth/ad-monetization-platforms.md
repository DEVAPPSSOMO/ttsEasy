# Comparativa de gestores de ads para publishers

## Proposito

Este documento compara plataformas de monetizacion publisher/ad serving para decidir que stack tiene mas sentido segun fase de crecimiento, tipo de inventario y tolerancia a riesgo operativo.

Queda fuera del alcance la compra de trafico (`Google Ads`, `Meta Ads`, `TikTok Ads`, `LinkedIn Ads`, `Microsoft Ads`) porque aqui no estamos comparando canales de adquisicion, sino redes, ad servers y capas de optimizacion para monetizar inventario propio.

## Como leer esta comparativa

El criterio de lectura no es "que plataforma paga mas" en abstracto. Lo que importa es:

- que problema resuelve cada plataforma
- cuanto upside real tiene sobre el inventario que ya tenemos
- cuanto deteriora UX y Core Web Vitals
- cuanto riesgo de policy, fraude o complejidad operativa introduce

Para TTS Easy, el marco correcto no es solo `eCPM`, sino `revenue per session`, impacto en `LCP`/`CLS`, riesgo de invalid traffic y capacidad de mantener una experiencia limpia en producto y en la capa editorial.

## Metodologia

Los tres ejes de scoring usados en esta guia son cualitativos:

- `Revenue potential`: capacidad de elevar ingresos por inventario y de abrir demanda mas competitiva.
- `UX / CWV risk`: probabilidad de empeorar experiencia de lectura, velocidad o estabilidad visual.
- `Policy / operational risk`: carga de aprobacion, revisiones, bloqueo por policy, invalid traffic y mantenimiento diario.

Lectura de niveles:

- `Low`: friccion o riesgo bajo.
- `Medium`: tradeoff real pero manejable.
- `High`: requiere disciplina operativa o puede romper el balance producto/monetizacion si se usa mal.

Importante:

- `Policy strictness` alto no es "malo" por si mismo; suele indicar una red mas exigente y, a la vez, mas apta para demanda premium.
- `Revenue upside` alto no implica mejor decision si viene acompanado de peor UX, mayor latencia o mayor probabilidad de serving restrictions.
- Cuando la informacion comercial no esta publicada de forma clara por el proveedor, se marca `not publicly disclosed`.

## Scorecard principal

| Platform | Model | Entry barrier / eligibility | Best geos / inventory fit | Formats supported | Reporting depth | Revenue upside | UX / CWV risk | Policy strictness | Implementation complexity | Payout cadence / threshold | Best use case | Main drawback |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `Google AdSense` | Red self-serve de display/contextual de Google | `Low-Medium`. Requiere aprobacion de cuenta/sitio y cumplimiento estricto de policy. No hay minimo publico de trafico. | Inventario web generalista; mejor rendimiento en geos tier-1 y paginas con intencion clara. | Display, Auto Ads, search y productos Google asociados segun setup. | `Medium`. Earnings, `Page RPM`, `Ad session RPM`, `CTR`, estados de policy. | `Medium` | `Medium` | `High` | `Low` | Mensual. Umbral de pago `USD 100` en cuentas USD. | Baseline general para monetizar display en sites pequenos y medianos. | Menos control que un ad server real; es facil degradar UX si Auto Ads o placements se dejan sin control. |
| `Google Ad Manager` | Ad server + yield orchestration + reporting + multi-demand | `High`. Requiere operacion ad ops, inventario, line items, yield groups y disciplina de reporting. Los umbrales comerciales simples no estan publicamente definidos. | Publishers con escala, varias fuentes de demanda, direct deals, app o video. | Display, native, video, Ad Exchange, mediation y direct/programmatic. | `Very High`. `eCPM`, `CTR`, `unfilled impressions`, Active View, ad speed, sell-through, yield. | `High` | `Medium` | `High` | `High` | `Not publicly disclosed` como programa simple; depende del setup comercial. | Ruta de escala cuando hace falta controlar fill, viewability, velocidad y mezcla de demanda. | Demasiado overhead para una propiedad en fase temprana o con un solo proveedor display. |
| `EthicalAds` | Red contextual invite-only para audiencias developer | `Medium`. Developer-focused y application-based; su calculadora publica esta orientada a propiedades con `50k+` monthly pageviews. | EN editorial tecnico, docs, open source, dev tools, audiencias de NA/EU. | Un placement por pagina, anuncios text/image, modos inline o floating controlados. | `Medium`. Revenue, geos, advertisers y keywords. | `Low-Medium` en general; `Medium` si el inventario es developer/technical de calidad. | `Low` | `Medium-High` | `Low` | Mensual. Minimo `USD 50`. Revenue share publicado `70%`. | Monetizacion limpia para docs/blog EN con audiencia tecnica y sensibilidad alta a privacidad y UX. | Fit estrecho: no es una red broad-market y limita densidad de ads por diseno. |
| `Ezoic` | Capa de optimizacion/managed monetization apoyada en Google demand y testing | `Medium-High`. Review propia, aprobacion Google `MCM`, `ads.txt`, integracion completa y retirada de otros ad codes. | Content sites con suficiente volumen como para que compense el testing de layouts y yield. | Display, video, mediation, testing de layouts y optimizacion automatizada. | `High`. Earnings por fecha/dispositivo, analytics y control de terminos de pago. | `High` | `Medium-High` | `High` | `High` | `Net 30` por defecto, minimo `USD 20`; opcion `Net 60/90` con bonus. Parte de mediation puede seguir pagandose via AdSense. | Sites que quieren exprimir yield y aceptan ceder control a una capa de testing/optimizacion. | Puede tensionar CWV, densidad y experiencia editorial; requiere confianza fuerte en el sistema y buena higiene operativa. |
| `Media.net` | Plataforma contextual / SSP con capa gestionada para publishers | `Medium`. Onboarding y criterios exactos no publicados; modelo mas consultivo que self-serve puro. | Inventario editorial content-rich con intencion de busqueda o fuerte contexto semantico. | Search/contextual, display, native y video con un tag unificado segun producto. | `Medium`. El sitio oficial promete control y reporting; en Open Bidding parte del reporting vive en la interfaz del publisher, no en dashboard propio de Media.net. | `Medium-High` cuando el contenido tiene contexto e intencion comercial claros. | `Medium` | `Medium-High` | `Medium-High` | `Not publicly disclosed` | Sites con contenido evergreen y search-led que quieran demanda contextual fuera del puro stack Google. | Mucha opacidad publica en criterios comerciales y el fit depende mucho de la calidad contextual real del contenido. |

## Lectura rapida por plataforma

### `Google AdSense`

Es la opcion baseline por una razon sencilla: resuelve el problema minimo viable de monetizar inventario display sin obligarte a montar ad ops completo. Tiene reporting suficiente para un equipo pequeno y una ruta de implementacion muy directa.

Donde gana:

- barrera de entrada relativamente baja
- cobertura global
- metricas faciles de entender (`Page RPM`, `CTR`, earnings)
- buen fit para validar si una superficie editorial puede monetizar sin anadir demasiada complejidad

Donde pierde:

- control bastante limitado frente a un ad server
- riesgo de empeorar UX si se usa `Auto Ads` sin criterio
- politica muy estricta en trafico, layouts y fuentes de adquisicion

Conclusion: es la mejor primera capa para un site en validacion, siempre que se trate la monetizacion como una capa subordinada al producto y no al reves.

### `Google Ad Manager`

No es "AdSense mejorado". Es otra categoria: sirve para gestionar inventario, demanda, direct deals, viewability, fill, unfilled, ad speed y mezcla entre varias fuentes.

Donde gana:

- mayor profundidad de reporting y diagnostico
- control fino sobre inventario, line items y yield
- mejor ruta si algun dia hay mezcla de demanda, acuerdos directos o video serio

Donde pierde:

- complejidad alta para una propiedad pequena
- mas coste operativo y mas superficie para cometer errores
- el upside real no llega si todavia no hay suficiente volumen ni necesidad de orquestacion

Conclusion: es la ruta correcta de escala, no el primer paso.

### `EthicalAds`

Es una red deliberadamente estrecha: monetiza muy bien cuando el inventario encaja con audiencias developer, documentacion, open source o contenido tecnico, y bastante peor cuando el inventario es generic web.

Donde gana:

- UX y privacidad muy cuidadas
- reglas de placement claras
- reporting suficiente para entender revenue, keywords, advertisers y geos
- fit muy bueno para propiedades EN tecnicas con sensibilidad alta a brand trust

Donde pierde:

- menor upside broad-market
- exige una audiencia y una distribucion geografica mucho mas especificas
- por diseno no persigue densidad ni agresividad

Conclusion: es una opcion fuerte para `blog`/`docs` EN tecnicos. No deberia juzgarse con el mismo prisma que una red generalista.

### `Ezoic`

Ezoic vende una promesa clara: tomar control del entorno publicitario, testear y aumentar yield. Esa promesa puede funcionar, pero el coste es aceptar mas complejidad y mas riesgo de comprometer la experiencia.

Donde gana:

- upside de yield superior a AdSense en muchas propiedades con volumen suficiente
- mas testing y mas opciones de optimizacion
- control de pagos y capas adicionales de analytics

Donde pierde:

- requiere integracion profunda y aprobaciones adicionales
- su modelo empuja a experimentar con layout/densidad, justo donde tambien se deteriora CWV
- si el site aun esta optimizando producto, anadir esta capa puede introducir demasiado ruido

Conclusion: interesante cuando ya existe una base editorial con volumen y una necesidad real de optimizacion. No antes.

### `Media.net`

Su propuesta es fuerte cuando el contenido tiene contexto semantico claro y señales de intencion de busqueda que puedan traducirse en demanda contextual mas valiosa.

Donde gana:

- buena historia contextual para contenido evergreen y search-led
- soporte de display/native/video
- modelo mas serio para publishers que quieren salir del binomio puro `AdSense`/`fallback network`

Donde pierde:

- menos transparencia publica sobre umbrales y pagos
- no es una recomendacion obvia para inventario con poco contexto comercial
- el rendimiento depende mucho del tipo de audiencia y query intent

Conclusion: es una opcion de evaluacion futura, no la decision inmediata para TTS Easy hoy.

## Metricas clave y como usarlas

La comparativa de plataformas se rompe cuando mezclamos metricas de red con metricas internas del producto. Conviene separar ambos niveles.

| Metric | Definicion operativa | Para que sirve de verdad | Mapeo recomendado en este repo |
| --- | --- | --- | --- |
| `Page RPM` | `(earnings / pageviews) * 1000` | Medir monetizacion por pagina vista. Es la metrica nativa mas comun en redes display. | No confundir con el `RPM` actual del repo. Guardarlo como metrica de proveedor. |
| `Session RPM` | `(earnings / sessions) * 1000` | Une monetizacion con calidad de trafico y profundidad de sesion. | Es el mapeo mas cercano al `RPM (revenue per 1,000 sessions)` de [docs/growth/operating-dashboard.md](/Users/saul/Desarrollo apps/TTS easy/docs/growth/operating-dashboard.md). |
| `eCPM` | `(earnings / impressions) * 1000` | Comparar eficiencia de demanda por impresiones servidas. | Usarlo para comparar proveedores y placements, no para medir negocio total. |
| `Fill rate` | `served impressions / ad requests` o equivalente inverso a `unfilled impressions` | Detectar si el problema es falta de demanda, geo pobre o policy/eligibility. | Complementar `ad_slot_view` con datos de red cuando existan. |
| `CTR` | `(clicks / impressions) * 100` | Diagnosticar engagement del placement. | No optimizar CTR sin mirar UX y quality of clicks. |
| `Viewability` | `viewable impressions / measurable impressions` | Separar placements realmente visibles de inventario "teoricamente servido". | En GAM se puede seguir con Active View; en el repo debe relacionarse con CWV y layout stability. |
| `Revenue per session` | `earnings / sessions` | Ver si una sesion mas larga o de mejor calidad realmente monetiza mejor. | Muy util para comparar monetizacion frente a activacion de `tts_success` o `mp3_download_rate`. |
| `Latency / script overhead` | Coste de JS, waterfall y bloqueo asociado a scripts publicitarios | Evitar que monetizar destruya conversion o discoverability. | Seguirlo junto a `LCP`, `INP` y errores de carga. |
| `CLS / LCP risk` | Cambio en estabilidad visual o tiempo de carga al activar ads | Detectar cuando el ingreso marginal ya no compensa el deterioro del producto. | Usar los guardrails de [docs/growth/operating-dashboard.md](/Users/saul/Desarrollo apps/TTS easy/docs/growth/operating-dashboard.md): `LCP <= 2.5s`, `INP < 200ms`, `CLS < 0.1`. |
| `Invalid traffic risk` | Riesgo de trafico filtrado, activity flags, serving restrictions o clawbacks | Reducir probabilidad de suspension, pagos retenidos o revenue revertido. | Correlacionarlo con `source_channel`, `country_tier` y picos atipicos de trafico. |
| `Payout lag` | Dias entre cierre del mes y cobro real | Importa para caja y para decidir entre nets largos o cortos. | Mantenerlo como dato financiero por proveedor. |
| `Revenue concentration` | Porcentaje del revenue que depende de un geo, placement o proveedor | Evita dependencia excesiva de una sola fuente. | Seguirlo por `locale`, `page_type` y proveedor activo. |

## Mapeo con el dashboard y la taxonomia actuales

### 1. No mezclar `Page RPM` con el `RPM` interno del repo

El repo ya define `RPM (revenue per 1,000 sessions)` en [docs/growth/operating-dashboard.md](/Users/saul/Desarrollo apps/TTS easy/docs/growth/operating-dashboard.md). Eso es mas util para producto y growth que el `Page RPM` nativo de redes como AdSense.

Regla recomendada:

- mantener `Page RPM` como metrica de proveedor
- mantener `Session RPM` o `revenue per 1,000 sessions` como metrica operativa principal del negocio

### 2. Usar `ad_slot_view` para exposicion y `ad_slot_suppressed` para revenue perdido

La taxonomia ya incluye `ad_slot_view` y `ad_slot_suppressed` en [docs/growth/analytics-taxonomy.md](/Users/saul/Desarrollo apps/TTS easy/docs/growth/analytics-taxonomy.md). Eso permite medir dos cosas distintas:

- `ad_slot_view`: cuantas oportunidades reales de exposicion tuvo cada placement
- `ad_slot_suppressed`: cuanto inventario potencial no se sirvio por provider, locale, page type o placement ineligible

Interpretacion util:

- si baja revenue pero `ad_slot_view` se mantiene, mirar `fill rate`, geo mix o `eCPM`
- si sube `ad_slot_suppressed`, el problema probablemente no es demanda sino elegibilidad, policy o configuracion

### 3. Tratar CWV como guardrail, no como afterthought

El dashboard actual ya fija:

- `LCP <= 2.5s`
- `INP < 200ms`
- `CLS < 0.1`

Eso debe mantenerse como veto operativo. Ninguna mejora de `eCPM` justifica cruzar esos umbrales de forma sostenida en una propiedad cuyo valor depende de conversion y confianza.

### 4. Relacionar monetizacion con calidad del funnel, no solo con clicks

En TTS Easy tiene mas sentido mirar monetizacion junto a:

- `tts_success_rate`
- `mp3_download_rate`
- profundidad de sesion
- retorno a pagina o a portal API

Si una red sube revenue pero deprime `tts_success` o `mp3_download`, no esta optimizando negocio sino canibalizando el producto.

## Benchmarks premium fuera de la scorecard principal

Estas plataformas no entran en la tabla central porque compiten en otra liga: gestion mas cerrada, expectativas mas altas de trafico/calidad y mejor fit para propiedades editoriales maduras.

### `Mediavine`

Puntos clave oficiales:

- exige `USD 5,000+` de annual ad revenue para aplicar a `Mediavine Official`
- si no se llega, empuja a `Journey`, que arranca en `1K sessions`
- revisa contenido original, trafico limpio, buen standing con `AdSense/AdExchange` y reader experience
- publica dashboard amplio, reporting granular, foco en site speed y `75%` revenue share en `Official`

Lectura para TTS Easy:

- hoy es mas benchmark que decision inmediata
- sirve como referencia de como se ve una oferta premium cuando el inventario editorial ya es mas maduro y predecible

### `Raptive`

Puntos clave oficiales:

- minimo `25,000` monthly pageviews
- entre `25k` y `99,999` pageviews pide `50%` de trafico desde `US/UK/CA/NZ/AU`
- a partir de `100k` pageviews baja ese requisito a `40%`
- paga `net-45`
- publica `75%` revenue share
- usa `RPM` basado en sesiones y tambien reporta `Page RPM`

Lectura para TTS Easy:

- buen benchmark para una capa premium orientada a publishers con volumen y necesidad de soporte fuerte
- no parece fit inmediato salvo que la capa editorial EN crezca bastante mas y se convierta en un negocio relevante por si mismo

## Recomendacion para TTS Easy

### Ranking por fit actual

1. `Google AdSense`
2. `EthicalAds`
3. `Google Ad Manager`
4. `Ezoic`
5. `Media.net`

### Escenario 1: site pequeno o en validacion

Recomendacion:

- `AdSense` como baseline general
- `EthicalAds` solo en superficies EN claramente tecnicas si el inventario cualifica
- evitar `Google Ad Manager` y `Ezoic` demasiado pronto

Razon:

- la prioridad todavia no es exprimir yield sino validar surfaces, proteger UX y no contaminar el funnel principal

### Escenario 2: inventario editorial EN creciendo

Recomendacion:

- `EthicalAds` pasa a ser la opcion mas interesante en `blog`/`docs` EN de perfil tecnico
- `AdSense` sigue siendo el baseline para superficies mas amplias o no tan nicho
- no mezclar redes en una misma URL; comparar por cohortes, no por intuicion

Razon:

- TTS Easy tiene una narrativa tecnica y de producto donde privacidad, legibilidad y credibilidad pesan mucho

### Escenario 3: volumen suficiente para orquestacion avanzada

Recomendacion:

- evaluar `Google Ad Manager` como siguiente escalon real
- considerar `Ezoic` o `Media.net` solo si hay una hipotesis concreta de yield incremental y una forma clara de medir el coste en UX/CWV

Razon:

- el valor de un ad server no aparece por magia; aparece cuando hay varias fuentes de demanda, necesidad de viewability/fill diagnostics o acuerdos mas complejos

## Decision final

Para TTS Easy, la conclusion correcta hoy es:

- `AdSense` debe seguir siendo la referencia general para inventario display estandar.
- `EthicalAds` es la mejor opcion especializada para inventory EN editorial de perfil tecnico y clean UX.
- `Google Ad Manager` es una ruta de escala, no una primera decision.
- `Ezoic` y `Media.net` son opciones de evaluacion futura si el volumen y el tipo de trafico justifican mas complejidad.
- `Mediavine` y `Raptive` sirven como benchmark premium, no como siguiente paso inmediato.

En otras palabras: primero baseline limpio y medible (`AdSense`), despues especializacion por fit (`EthicalAds` en EN tecnico), y solo mas tarde orquestacion avanzada (`Google Ad Manager`) cuando el negocio editorial y el volumen lo hagan racional.

## Fuentes primarias y oficiales

### Google

- [Google AdSense metrics](https://support.google.com/adsense/answer/2735899?hl=en)
- [Google AdSense RPM definition](https://support.google.com/adsense/answer/190515?hl=en)
- [Google AdSense payment thresholds](https://support.google.com/adsense/answer/1709871?hl=en)
- [Google AdSense programme policies](https://support.google.com/adsense/answer/48182)
- [Google Ad Manager report metrics](https://support.google.com/admanager/table/7568664?hl=en)
- [Google Ad Manager report types](https://support.google.com/admanager/answer/10117711?hl=en)
- [How mediation works in Google Ad Manager](https://support.google.com/admanager/answer/7391294?hl=en)
- [Google publisher solutions overview](https://www.google.com/ads/publisher/solutions.html)

### EthicalAds

- [EthicalAds publishers page](https://www.ethicalads.io/publishers/)
- [EthicalAds publisher guide](https://www.ethicalads.io/publisher-guide/)
- [EthicalAds publisher FAQ](https://www.ethicalads.io/publishers/faq/)
- [EthicalAds publisher policy](https://www.ethicalads.io/publisher-policy/)
- [EthicalAds publisher calculator](https://www.ethicalads.io/publishers/calculator/)

### Ezoic

- [Ezoic monetization requirements](https://support.ezoic.com/kb/article/ezoic-site-requirements-for-monetization)
- [Ezoic payments](https://support.ezoic.com/kb/article/ezoic-payments?lang=en_US)
- [Ezoic net 30/60/90 payment terms](https://support.ezoic.com/kb/article/net-306090-payment-terms?id=net-306090-payment-terms&lang=en-US)

### Media.net

- [Media.net publisher program](https://www.media.net/ads/publisher-program/)
- [Media.net publishers](https://www.media.net/publishers)
- [Media.net Open Bidding help center](https://openbidding.media.net/help-center)

### Premium benchmarks

- [Mediavine requirements](https://www.mediavine.com/mediavine-requirements/)
- [Mediavine Official](https://help.mediavine.com/mediavine-official)
- [Raptive eligibility](https://help.raptive.com/hc/en-us/articles/360032840891-Who-is-eligible-for-Raptive)
- [Getting started with Raptive](https://help.raptive.com/hc/en-us/articles/360035078152-Getting-Started-with-Raptive)
