# Plan de recuperación de AdSense y monetización para TTS Easy

## Resumen

- Inferencia principal: el rechazo por "Contenido de poco valor" encaja con el patrón actual del sitio, no con un problema técnico de AdSense. En el repo hay 6 locales, muchas URLs de captación y un fallback genérico para landings en `src/lib/landing-pages.ts`, además de comparativas muy breves en `src/lib/compare-pages.ts`. Eso se parece a contenido escalado y orientado a buscador.
- Tu mejor activo hoy no son las landings; es el producto y el blog. Los posts en inglés tienen una profundidad razonable, pero faltan señales claras de "quién", "cómo" y "por qué" en la capa pública de artículo de `src/app/[locale]/blog/[slug]/page.tsx`.
- Decisión tomada para el plan: priorizar ingresos directos primero, mantener 6 idiomas en el core del producto, y podar agresivamente el inventario indexable hasta que cada URL útil tenga valor real.

## Cambios de implementación

- Congelar nuevas solicitudes a AdSense hasta limpiar indexación y reforzar confianza editorial.
- Mantener indexables en 6 idiomas solo estas familias:
  - Home, páginas legales, `about`, herramientas reales y posts de blog que tengan revisión real.
- Sacar de índice o retirar estas familias hasta reescribirlas:
  - Cualquier use-case que caiga en `GENERIC_USE_CASE`.
  - Comparativas que no tengan benchmarking original, metodología, evidencia y conclusión útil sin CTA.
  - Versiones por idioma que sean solo traducción sin ejemplos locales ni revisión local.
- Introducir un contrato editorial mínimo para cualquier URL indexable:
  - `author`, `reviewedBy`, `reviewedAt`, `sources`, `methodology`, `aiDisclosure`, `indexable`.
  - Cada página debe resolver una intención concreta sin depender de "Try now" para aportar valor.
  - Cada comparativa debe incluir pruebas propias: criterio, tabla, límites, caso de uso recomendado y cuándo no elegir TTS Easy.
- Ajustar routing e indexación:
  - `sitemap.xml` debe incluir solo URLs aprobadas editorialmente.
  - Las rutas débiles deben salir con `noindex,follow`.
  - No mantener landings programáticas "por si acaso"; mejor menos URLs y más fuertes.
- Refuerzo de E-E-A-T:
  - Añadir byline visible y revisión en blog.
  - Expandir `About` con identidad real, experiencia del equipo, proceso editorial y contacto.
  - Si se usa IA o traducción asistida, declararlo donde sea razonablemente esperable.
- Reintroducción futura de AdSense:
  - Cuando vuelvas a solicitar revisión, limitar anuncios a contenido editorial fuerte.
  - No usar sticky mobile ni densidad alta en páginas utilitarias; la herramienta debe seguir siendo el elemento dominante.

## Monetización alternativa

- Vía principal: monetización del propio producto.
  - Empujar `free -> prepaid credits / creator pack / API pack` desde generación exitosa, descarga MP3 y share.
  - Mantener la home y las tools pages centradas en conversión a pricing/API, no en display ads.
  - Medir `tool -> pricing`, `download -> signup`, `share -> paid`.
- Vía secundaria: afiliación, pero solo en contenido con valor real.
  - Activarla únicamente en comparativas reescritas con pruebas propias.
  - Usar enlaces `rel="sponsored nofollow"`.
  - Promocionar herramientas complementarias que sí hayas probado y documentado.
- Vía opcional: patrocinio o lead gen.
  - Patrocinios discretos para newsletters o recursos de creadores.
  - Lead magnet para equipos que quieran API o volumen, con CTA desde blog técnico y páginas de pricing/docs.

## Pruebas y criterios de aceptación

- Calidad e indexación:
  - Ninguna URL indexable usa fallback genérico.
  - El sitemap contiene solo páginas curadas.
  - Cada página indexable tiene autor o revisor, fecha y valor original verificable.
- Señales de confianza:
  - Un usuario puede entender quién publica, cómo se creó el contenido y por qué debe confiar en él sin salir de la página.
- AdSense readiness:
  - Revisión manual de 20 URLs indexadas: propósito claro, navegación limpia, contenido sustancial, sin patrón doorway ni traducción masiva de baja diferenciación.
  - Reenviar a revisión solo cuando Search Console ya refleje la poda y el tráfico indexado recaiga mayoritariamente en URLs fuertes.
- Negocio:
  - El ingreso principal esperado en la siguiente fase viene de packs, créditos o API; AdSense pasa a ser complemento, no pilar.

## Suposiciones y defaults

- Mantener 6 idiomas en producto y contenido core, pero no en todo el inventario SEO.
- Podar primero y publicar menos URLs, más profundas.
- Base de política verificada a fecha 10 de marzo de 2026:
  - [AdSense Program policies](https://support.google.com/adsense/answer/48182?hl=en)
  - [Spam policies for Google Web Search](https://developers.google.com/search/docs/essentials/spam-policies?hl=en)
  - [Creating helpful, reliable, people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content?hl=en)
