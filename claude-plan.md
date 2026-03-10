# Plan: Superar rechazo AdSense "Contenido de poco valor"

## Contexto

Google AdSense rechaza ttseasy.com por "contenido de poco valor". Tras analizar el sitio, el problema principal es que Google lo percibe como **una herramienta con algo de contenido**, no como **un sitio de contenido con una herramienta**. El blog es bueno (8 articulos de 2,100-3,500 palabras), pero esta enterrado. La homepage muestra primero el TTS app, luego ads, luego features (~150 palabras), luego FAQ colapsado (invisible para crawlers).

### Problemas concretos detectados
1. **Homepage tool-first**: `TtsApp` es lo primero que se renderiza, el contenido editorial es minimo
2. **FAQ colapsado**: usa `<details>` sin `open` -- Google puede no indexar ese contenido
3. **Sin navegacion global**: no hay header, solo footer con legal links
4. **Sin autor en blog**: no hay campo `author` en MDX ni en la UI
5. **Paginas estaticas ultra-finas**: About ~120 palabras, Privacy ~80, Terms ~70, Cookies ~50
6. **Landing pages plantilla**: 19 paginas con estructura identica (intro->benefits->steps->FAQ)
7. **Ratio ads/contenido malo**: 4 ad slots en homepage con ~150 palabras visibles

---

## Estrategia A: Corregir el rechazo de AdSense

### A1. Reestructurar la homepage -- content-first

**Archivo**: `src/app/[locale]/page.tsx`

Cambiar el orden de renderizado:

```
ACTUAL:                          NUEVO:
TtsApp (hero)                    SiteHeader (nav global)
AdSlot top                       h1 + intro editorial (300+ palabras)
Features (~150 palabras)         Features
AdSlot content                   FeaturedBlogPosts (3 articulos)
Faq (colapsado)                  TtsApp (mas abajo)
AdSlot sticky                    Faq (visible, no colapsado)
Footer                           AdSlot content (solo 1 mid-page)
                                 AdSlot sticky (mobile)
                                 Footer
```

- Mover `TtsApp` debajo del contenido editorial
- Eliminar `AdSlot top` -- reducir de 4 a 2 ad slots en homepage
- Anadir texto introductorio al diccionario (`home.introP1`, `home.introP2`, etc.)

**Archivos a modificar**: `src/app/[locale]/page.tsx`, `src/lib/i18n/dictionaries/*.json`

### A2. Navegacion global (SiteHeader)

**Archivo nuevo**: `src/components/SiteHeader.tsx`

- Server Component con: logo/nombre, enlaces a Blog, Use Cases, Tools, Compare
- Renderizar en `src/app/[locale]/layout.tsx` para que aparezca en todas las paginas
- Transforma la percepcion de "app de una pagina" a "sitio de contenido"

**Archivos a modificar**: `src/app/[locale]/layout.tsx`, `src/app/globals.css`

### A3. FAQ visible (no colapsado)

**Archivo**: `src/components/Faq.tsx`

- Anadir atributo `open` a todos los `<details>` para que el contenido sea visible por defecto
- Alternativa: convertir a `<h3>` + `<p>` sin `<details>`
- Esto hace visibles ~500 palabras adicionales de contenido indexable

### A4. Anadir autor y "ultima actualizacion" al blog

**Archivos a modificar**:
- `src/lib/blog.ts`: anadir `author` y `lastUpdated` a interfaces `BlogPost` y `BlogPostWithContent`, parsearlos del frontmatter
- `src/app/[locale]/blog/[slug]/page.tsx`: renderizar autor y fecha de actualizacion en `.post-meta`
- `src/lib/seo/jsonLd.ts`: cambiar `articleJsonLd` para usar `@type: Person` en vez de Organization
- 48 archivos MDX en `content/blog/*/`: anadir `author: "TTS Easy Editorial Team"` y `lastUpdated: "2026-03-10"` al frontmatter

### A5. Expandir paginas estaticas

Cada pagina necesita secciones con `<h2>` y contenido sustancial (400-600 palabras):

| Pagina | Actual | Objetivo | Secciones a anadir |
|--------|--------|----------|-------------------|
| About | ~120 palabras | 600+ | Mision, Tecnologia, Equipo, Estandares editoriales |
| Privacy | ~80 palabras | 500+ | Que recogemos, Como usamos datos, Terceros, Tus derechos |
| Terms | ~70 palabras | 400+ | Uso aceptable, Propiedad intelectual, Limitaciones |
| Cookies | ~50 palabras | 400+ | Tipos de cookies, Analytics, Publicidad, Como controlarlas |

**Archivos a modificar**: `src/lib/i18n/dictionaries/*.json` (contenido), paginas en `src/app/[locale]/about|privacy|terms|cookies/page.tsx` (estructura con `<h2>`)

### A6. Seccion "Articulos destacados" en homepage

**Archivo nuevo**: `src/components/FeaturedPosts.tsx`

- Server Component que recibe 3 posts y renderiza cards con titulo, descripcion, fecha, autor
- Se llama en `page.tsx` con `getAllPosts(locale).slice(0, 3)`

### A7. Reducir paginas finas del sitemap

**Archivo**: `src/app/sitemap.ts`

- Excluir temporalmente cookies y terms del sitemap hasta que se expandan
- Considerar excluir landing pages que aun no tengan contenido editorial diferenciado

---

## Estrategia B: Monetizacion alternativa

### B1. Carbon Ads -- mejor fit para audiencia tech/creadores
- Sin requisito minimo de trafico
- Un solo anuncio limpio por pagina (mejor percepcion que 4 slots de AdSense)
- Crear componente `CarbonAd.tsx` como reemplazo drop-in de `AdSlot`

### B2. Marketing de afiliados
- ElevenLabs, Amazon Associates (Polly), herramientas de creadores
- Integrar en las 7 paginas de comparacion y articulos como "Best TTS Tools"
- Crear `src/lib/affiliates.ts` para gestionar enlaces
- Anadir disclosure en paginas con enlaces de afiliado

### B3. Potenciar monetizacion API (ya existe Stripe)
- El portal API con billing ya funciona -- hacer la pricing mas visible
- Anadir CTA "Para desarrolladores" en homepage
- Escribir articulo "Quick Start" sobre la API

---

## Alcance confirmado
- **Estrategia A completa** (7 cambios de contenido/estructura)
- **Estrategia B completa** (Carbon Ads, afiliados, promocion API)
- **6 idiomas**: en, es, pt, fr, de, it -- todo el contenido nuevo

## Orden de implementacion

**Fase 1 -- Estructura** (afecta todas las paginas):
1. A2: SiteHeader (navegacion global)
2. A1: Reestructurar homepage (content-first)
3. A3: FAQ visible (no colapsado)
4. A6: Articulos destacados en homepage

**Fase 2 -- Contenido** (diccionarios en 6 idiomas):
5. A5: Expandir About, Privacy, Terms, Cookies (6 idiomas)
6. A4: Autor y lastUpdated en los 48 archivos MDX del blog

**Fase 3 -- Monetizacion alternativa**:
7. B1: Componente Carbon Ads + integracion
8. B2: Sistema de afiliados + enlaces en compare/blog
9. B3: CTA "Para desarrolladores" en homepage

**Fase 4 -- Limpieza**:
10. A7: Reducir sitemap (excluir paginas finas)

## Verificacion

1. `npm run build` -- asegurar que no hay errores
2. Preview local -- verificar que la homepage muestra contenido antes que la herramienta
3. Verificar que el header aparece en todas las paginas
4. Verificar que los articulos del blog muestran autor y fecha de actualizacion
5. Verificar que el FAQ es visible sin necesidad de hacer click
6. Verificar en Google Search Console que las nuevas paginas se indexan con contenido sustancial
7. Re-enviar solicitud a AdSense 2-3 dias despues del deploy
