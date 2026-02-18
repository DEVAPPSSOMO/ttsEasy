# Editorial Contract for Indexable Pages

Every new indexable URL must define:
- `search_intent`
- `primary_keyword`
- `secondary_keywords`
- `faq`
- `internal_links_required`
- `cta_variant`

## Contract Template

```yaml
search_intent: commercial | transactional | informational
primary_keyword: ""
secondary_keywords:
  - ""
  - ""
faq:
  - question: ""
    answer: ""
internal_links_required:
  - /en/use-cases/example
  - /en/tools/example
  - /en/blog/example
cta_variant: generate_now | compare_and_try
```

## Enforcement Rule
- Publish only when at least 5 internal strategic links are present.
- If content is not localized for a locale, the localized URL must stay `noindex,follow`.

Starter file: `content/blog/INDEXABLE_TEMPLATE.mdx`.
