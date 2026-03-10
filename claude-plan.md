# Plan Final: Recuperar AdSense + Monetización TTS Easy

## Contexto

AdSense rechaza ttseasy.com por "contenido de poco valor". Tras analizar ambos planes (claude-plan.md y codex-plan.md) y explorar el codebase, el diagnóstico combina:

1. **Patrón de contenido escalado**: ~174 URLs indexadas, muchas son plantillas idénticas × 6 idiomas. 48 blog posts son 8 originales × 6 traducciones IA con slugs distintos por idioma (hreflang roto).
2. **Apariencia de tool-wrapper**: Homepage muestra TtsApp primero, ~150 palabras de Features, FAQ colapsado invisible, sin header de navegación global.
3. **Ratio ads/contenido malo**: 4 ad slots (3 en page.tsx + 1 inline en TtsApp) con contenido editorial mínimo visible.
4. **Páginas ultra-finas**: Privacy ~80 palabras, Terms ~70, Cookies ~50 × 6 idiomas = 18 URLs sin valor informativo.

## Comparación de planes

| Aspecto | claude-plan.md | codex-plan.md | Veredicto |
|---------|---------------|---------------|-----------|
| Diagnóstico | Correcto pero superficial | Excelente: identifica patrón de "contenido escalado orientado a buscador" | **Codex** |
| Poda de URLs | Solo excluir del sitemap temporalmente | noindex agresivo, menos URLs más fuertes | **Codex** |
| Homepage | Detallado: SiteHeader, content-first, FeaturedPosts | No menciona cambios específicos | **Claude** |
| FAQ | Solución concreta: añadir `open` | No lo menciona | **Claude** |
| Páginas legales | Expandir a 400-600 palabras (padding) | No expandir, mantener accesibles | **Codex** |
| Blog E-E-A-T | Author + lastUpdated (correcto) | Contrato editorial completo (mejor) | **Codex** |
| Monetización | Ads primero, Carbon Ads alternativo | Producto primero (API/créditos), ads complemento | **Codex** |
| Implementabilidad | Archivos específicos, fases claras | Estratégico pero sin detalles técnicos | **Claude** |

**Veredicto**: Codex tiene la visión estratégica correcta. Claude tiene la ejecución táctica. El plan final combina ambos.

---

## Plan de Implementación

### Fase 1: Poda agresiva (~174 → ~80 URLs indexadas)

**1.1 noindex blog no-EN** (elimina ~40 URLs)
- Archivo: `src/app/[locale]/blog/[slug]/page.tsx`
- En `generateMetadata`, añadir `robots: { index: false, follow: true }` cuando `locale !== "en"`
- Motivo: los slugs difieren por idioma (EN: `complete-guide-text-to-speech` vs ES: `guia-completa-texto-a-voz`), el hreflang está roto, y son traducciones IA sin revisión

**1.2 noindex páginas legales** (elimina 18 URLs)
- Archivos: `src/app/[locale]/privacy/page.tsx`, `terms/page.tsx`, `cookies/page.tsx`
- Añadir `robots: { index: false, follow: true }` a `generateMetadata` en las tres
- Motivo: 2-3 frases cada una. Necesarias para compliance, inútiles para SEO. Expandirlas sería padding artificial

**1.3 noindex hubs no-EN** (elimina ~15 URLs)
- Archivos: `src/app/[locale]/use-cases/page.tsx`, `compare/page.tsx` (hub), `tools/page.tsx`
- Añadir `robots: { index: false, follow: true }` cuando `locale !== "en"`
- Motivo: son páginas de navegación con texto traducido mínimo

**1.4 noindex landing pages débiles** (elimina ~10-14 URLs)
- Archivo: `src/lib/landing-pages.ts` — añadir campo `indexable?: boolean` a `LandingPage`
- Marcar `indexable: false` en: `tts-for-discord`, `tts-for-presentations`, `text-to-speech-for-ebooks`, `text-to-speech-british`, `text-to-speech-australian`
- Archivo: `src/app/[locale]/use-cases/[slug]/page.tsx` — leer flag y añadir noindex
- Mantener indexadas las que tienen intención de búsqueda clara: youtube, podcasts, accessibility, students, language-learning, free-online, spanish, portuguese, french + las 3 específicas en español

**1.5 Actualizar sitemap**
- Archivo: `src/app/sitemap.ts`
- Sacar privacy/terms/cookies de `staticPages`
- Blog: solo incluir locale `en`
- Hubs: solo incluir locale `en`
- Landing pages: excluir las marcadas `indexable: false`

### Fase 2: Homepage content-first + navegación global

**2.1 SiteHeader** (componente nuevo)
- Nuevo archivo: `src/components/SiteHeader.tsx` — Server Component
- Logo/nombre + nav: Blog, Use Cases, Tools, Compare, About + LanguageSwitcher
- Modificar: `src/app/[locale]/layout.tsx` — renderizar SiteHeader en todas las páginas

**2.2 Reestructurar homepage**
- Archivo: `src/app/[locale]/page.tsx`
- Orden nuevo:
  1. SiteHeader (desde layout)
  2. h1 + intro editorial (200-300 palabras, nuevo contenido en diccionarios)
  3. TtsApp (compactIntro, **sin** `showInlineAd`)
  4. Features (expandir descripciones a 2-3 frases cada una)
  5. FeaturedPosts (3 artículos del blog)
  6. FAQ (primeros 3 items abiertos)
  7. **1 solo AdSlot** (content, al final)
  8. Footer simplificado

**2.3 FeaturedPosts** (componente nuevo)
- Nuevo archivo: `src/components/FeaturedPosts.tsx` — Server Component
- Muestra 3 posts recientes con título, descripción, fecha
- Se alimenta de `getAllPosts("en")` (siempre EN, ya que las traducciones están noindexed)

**2.4 FAQ visible**
- Archivo: `src/components/Faq.tsx`
- Añadir prop `openCount` (default 3), renderizar `<details open>` para los primeros N items

**2.5 Reducir ads de 4 a 1**
- Archivo: `src/app/[locale]/page.tsx` — eliminar AdSlot top y sticky-mobile, quitar `showInlineAd` de TtsApp
- Mantener solo 1 AdSlot content después del contenido editorial

**2.6 Contenido editorial para diccionarios**
- Archivos: `src/lib/i18n/dictionaries/{en,es,pt,fr,de,it}.json`
- Añadir claves: `home.editorialIntro` (2-3 párrafos), `home.featuredPostsTitle`, expandir `features.items[].description`

### Fase 3: Señales E-E-A-T

**3.1 Author + lastUpdated en blog**
- Archivo: `src/lib/blog.ts` — extender interfaces `BlogPost`/`BlogPostWithContent` con `author?`, `lastUpdated?`
- Archivo: `src/app/[locale]/blog/[slug]/page.tsx` — renderizar author, lastUpdated en UI
- Archivo: `src/lib/seo/jsonLd.ts` — `articleJsonLd` con `author` como Person y `modifiedTime`
- 8 archivos MDX en `content/blog/en/` — añadir al frontmatter: `author: "TTS Easy Editorial"`, `lastUpdated: "2026-03-10"`

**3.2 Expandir About**
- Archivos: `src/lib/i18n/dictionaries/*.json` — expandir sección `about` a 400-500 palabras: misión, tecnología, proceso editorial, AI disclosure, contacto
- Archivo: `src/app/[locale]/about/page.tsx` — renderizar con `<h2>` por sección

**3.3 Compare pages: añadir evidencia**
- Archivo: `src/lib/compare-pages.ts` — añadir campos `methodology` y `benchmarks` al interface
- Archivo: `src/app/[locale]/compare/[slug]/page.tsx` — renderizar tabla de comparación con datos reales

### Fase 4: Monetización rebalanceada

**Jerarquía**: Producto (API/créditos Stripe existente) > Afiliados > AdSense (complemento)

**4.1 Surfacear producto API en el sitio principal**
- Nuevo archivo: `src/components/ApiCta.tsx` — banner "Need TTS at scale? Try the API"
- Añadir en homepage (antes del footer) y en blog posts técnicos

**4.2 Afiliados en compare pages**
- Archivo: `src/lib/compare-pages.ts` — campo `affiliateUrl?`
- Renderizar con `rel="sponsored nofollow"` y disclosure visible

**4.3 AdSense reducido**
- 1 solo slot por página, siempre después del contenido editorial
- NO reenviar solicitud a AdSense hasta que Search Console refleje la poda (2-3 semanas post-deploy)

### Fase 5 (post-deploy): Reenvío a AdSense

- Esperar a que Search Console muestre ~80 URLs indexadas (vs ~174 actuales)
- Verificar que no hay errores de rastreo en páginas noindexed
- Confirmar Core Web Vitals verdes
- Revisión manual de 20 URLs: propósito claro, navegación limpia, contenido sustancial
- Reenviar solicitud solo cuando el índice esté limpio

---

## Archivos críticos

| Archivo | Cambio |
|---------|--------|
| `src/app/[locale]/page.tsx` | Reestructurar orden, reducir ads 4→1, añadir FeaturedPosts |
| `src/app/[locale]/layout.tsx` | Añadir SiteHeader global |
| `src/app/sitemap.ts` | Podar URLs noindexed |
| `src/lib/landing-pages.ts` | Añadir campo `indexable` |
| `src/app/[locale]/blog/[slug]/page.tsx` | noindex no-EN, author/lastUpdated |
| `src/components/Faq.tsx` | FAQ visible (prop `openCount`) |
| `src/lib/blog.ts` | Extender interfaces con author/lastUpdated |
| `src/lib/compare-pages.ts` | Añadir methodology/benchmarks |
| `src/lib/i18n/dictionaries/*.json` | Contenido editorial nuevo (6 idiomas) |
| `content/blog/en/*.mdx` | Frontmatter: author, lastUpdated |
| Nuevos: `SiteHeader.tsx`, `FeaturedPosts.tsx`, `ApiCta.tsx` | 3 componentes nuevos |

## Verificación

1. `npm run build` — sin errores
2. Preview local: homepage muestra contenido antes que la herramienta
3. Header visible en todas las páginas
4. FAQ primeros 3 items abiertos
5. Blog muestra author y fecha actualización
6. Solo 1 ad visible en homepage
7. Verificar en Search Console que URLs noindexed desaparecen del índice
8. Reenviar a AdSense solo cuando índice refleje la poda
