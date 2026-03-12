import Link from "next/link";

interface LocalizationNoticeProps {
  canonicalHref: string;
  locale: string;
}

const COPY = {
  de: {
    body: "Diese URL bleibt erreichbar, aber fur diese Sprache gibt es derzeit keine vollstandige redaktionelle Version.",
    cta: "Zur kanonischen Version",
    title: "Lokalisierung ausstehend",
  },
  en: {
    body: "This URL stays available, but it does not currently have a complete editorial version in this language.",
    cta: "Open canonical version",
    title: "Localization pending",
  },
  es: {
    body: "Esta URL sigue disponible, pero todavia no tiene una version editorial completa en este idioma.",
    cta: "Abrir version canonica",
    title: "Localizacion pendiente",
  },
  fr: {
    body: "Cette URL reste disponible, mais elle ne dispose pas encore d'une version editoriale complete dans cette langue.",
    cta: "Ouvrir la version canonique",
    title: "Localisation en attente",
  },
  it: {
    body: "Questa URL resta disponibile, ma non ha ancora una versione editoriale completa in questa lingua.",
    cta: "Apri la versione canonica",
    title: "Localizzazione in sospeso",
  },
  pt: {
    body: "Esta URL continua disponivel, mas ainda nao tem uma versao editorial completa neste idioma.",
    cta: "Abrir versao canonica",
    title: "Localizacao pendente",
  },
} as const;

function getCopy(locale: string) {
  return COPY[locale.slice(0, 2) as keyof typeof COPY] ?? COPY.en;
}

export function LocalizationNotice({ canonicalHref, locale }: LocalizationNoticeProps): JSX.Element {
  const copy = getCopy(locale);

  return (
    <section className="landing-steps" style={{ marginTop: "1.5rem" }}>
      <h2>{copy.title}</h2>
      <p>{copy.body}</p>
      <Link className="landing-cta" href={canonicalHref}>
        {copy.cta}
      </Link>
    </section>
  );
}
