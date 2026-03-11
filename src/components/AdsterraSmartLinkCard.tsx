"use client";

import { useEffect } from "react";
import {
  trackSmartLinkClick,
  trackSponsoredBlockView,
  type PageType,
} from "@/lib/analytics";
import { getActiveAdProvider, type AdPlacementId } from "@/lib/monetization";

interface SmartLinkCopy {
  kicker: string;
  title: string;
  description: string;
  cta: string;
}

interface AdsterraSmartLinkCardProps {
  className?: string;
  copy?: Partial<SmartLinkCopy>;
  locale: string;
  pageType: PageType;
  placementId: AdPlacementId;
}

const DEFAULT_COPY: Record<string, SmartLinkCopy> = {
  de: {
    kicker: "Gesponsert",
    title: "Weitere TTS-Tools entdecken",
    description: "Teste einen gesponserten Partner, wenn du weitere Voice- oder Creator-Workflows vergleichen willst.",
    cta: "Angebot ansehen",
  },
  en: {
    kicker: "Sponsored",
    title: "Explore another TTS workflow",
    description: "Check a sponsored partner if you want to compare more voice, dubbing, or creator-focused tools.",
    cta: "View sponsored offer",
  },
  es: {
    kicker: "Patrocinado",
    title: "Explora otra opcion de voz IA",
    description: "Prueba un partner patrocinado si quieres comparar mas herramientas de voz, doblaje o creacion.",
    cta: "Ver oferta patrocinada",
  },
  fr: {
    kicker: "Sponsorise",
    title: "Decouvrez une autre option TTS",
    description: "Essayez un partenaire sponsorise si vous voulez comparer d'autres outils de voix ou de creation.",
    cta: "Voir l'offre sponsorisee",
  },
  it: {
    kicker: "Sponsorizzato",
    title: "Scopri un'altra opzione TTS",
    description: "Prova un partner sponsorizzato se vuoi confrontare altri strumenti vocali o creator.",
    cta: "Vedi offerta sponsorizzata",
  },
  pt: {
    kicker: "Patrocinado",
    title: "Explore outra opcao de voz",
    description: "Teste um parceiro patrocinado se quiser comparar mais ferramentas de voz, dublagem ou criacao.",
    cta: "Ver oferta patrocinada",
  },
};

function getSmartLinkCopy(locale: string, copy?: Partial<SmartLinkCopy>): SmartLinkCopy {
  const base = DEFAULT_COPY[locale.slice(0, 2)] ?? DEFAULT_COPY.en;
  return {
    kicker: copy?.kicker ?? base.kicker,
    title: copy?.title ?? base.title,
    description: copy?.description ?? base.description,
    cta: copy?.cta ?? base.cta,
  };
}

export function AdsterraSmartLinkCard({
  className,
  copy,
  locale,
  pageType,
  placementId,
}: AdsterraSmartLinkCardProps): JSX.Element | null {
  const activeProvider = getActiveAdProvider();
  const href = process.env.NEXT_PUBLIC_ADSTERRA_SMARTLINK_URL;
  const resolvedCopy = getSmartLinkCopy(locale, copy);

  useEffect(() => {
    if (activeProvider !== "adsterra" || !href) {
      return;
    }

    trackSponsoredBlockView({ locale, pageType }, {
      placement_id: placementId,
      provider: "adsterra",
    });
  }, [activeProvider, href, locale, pageType, placementId]);

  if (activeProvider !== "adsterra" || !href) {
    return null;
  }

  return (
    <section className={`editorial-house-ad sponsored-link-card ${className ?? ""}`}>
      <p className="editorial-house-ad-kicker">{resolvedCopy.kicker}</p>
      <h2>{resolvedCopy.title}</h2>
      <p>{resolvedCopy.description}</p>
      <div className="editorial-house-ad-actions">
        <a
          className="landing-cta"
          href={href}
          onClick={() =>
            trackSmartLinkClick(
              { locale, pageType },
              { cta_destination: href, placement_id: placementId, provider: "adsterra" }
            )
          }
          rel="noopener noreferrer sponsored nofollow"
          target="_blank"
        >
          {resolvedCopy.cta}
        </a>
      </div>
    </section>
  );
}
