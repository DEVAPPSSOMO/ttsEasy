import type { EditorialSource } from "@/lib/editorialContent";

interface EditorialMetaProps {
  author?: string;
  locale: string;
  reviewedAt?: string;
  sources: EditorialSource[];
}

const COPY = {
  de: { author: "Autor", reviewed: "Gepruft", sources: "Quellen" },
  en: { author: "Author", reviewed: "Reviewed", sources: "Sources" },
  es: { author: "Autor", reviewed: "Revisado", sources: "Fuentes" },
  fr: { author: "Auteur", reviewed: "Revu", sources: "Sources" },
  it: { author: "Autore", reviewed: "Revisionato", sources: "Fonti" },
  pt: { author: "Autor", reviewed: "Revisado", sources: "Fontes" },
} as const;

function getCopy(locale: string) {
  return COPY[locale.slice(0, 2) as keyof typeof COPY] ?? COPY.en;
}

export function EditorialMeta({
  author,
  locale,
  reviewedAt,
  sources,
}: EditorialMetaProps): JSX.Element | null {
  if (!author && !reviewedAt && sources.length === 0) {
    return null;
  }

  const copy = getCopy(locale);

  return (
    <section className="landing-steps" style={{ marginTop: "2rem" }}>
      <h2>{copy.sources}</h2>
      {author ? (
        <p>
          <strong>{copy.author}:</strong> {author}
        </p>
      ) : null}
      {reviewedAt ? (
        <p>
          <strong>{copy.reviewed}:</strong> {reviewedAt}
        </p>
      ) : null}
      {sources.length > 0 ? (
        <ul>
          {sources.map((source) => (
            <li key={`${source.title}:${source.url}`}>
              <a href={source.url} rel="noopener noreferrer" target="_blank">
                {source.title}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
