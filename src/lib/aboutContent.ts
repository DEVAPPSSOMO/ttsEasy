import type { Locale } from "@/lib/i18n/config";

interface AboutSection {
  body: string;
  title: string;
}

export interface AboutContent {
  sections: AboutSection[];
  title: string;
}

const ABOUT_CONTENT: Record<Locale, AboutContent> = {
  de: {
    title: "Uber TTS Easy",
    sections: [
      {
        title: "Mission",
        body:
          "TTS Easy ist als schlanke Text-zu-Sprache-Oberflache fur alltagliche Produktionsarbeit gedacht. Das Produkt konzentriert sich auf wenige Schritte: Text einfugen, Sprache prufen, passende Stimme wahlen und eine verwendbare MP3-Datei erhalten. Diese Begrenzung ist beabsichtigt. Die Website soll reale Aufgaben schneller machen, statt mit einem breiten, aber unklaren Funktionskatalog Eindruck zu erzeugen.",
      },
      {
        title: "Eigentum und Betrieb",
        body:
          "Die offentliche Website, die redaktionellen Inhalte und die zugehorige API-Marke werden unter dem Namen TTS Easy betrieben und gepflegt. Auf dieser Seite werden keine erfundenen Lebenslaufe oder fiktiven Expertenprofile verwendet. Wenn wir keine individuelle Autorenschaft nachweisen konnen, kennzeichnen wir Inhalte als Markenredaktion und stellen stattdessen den dokumentierten Prozess, die Quellenlage und die Aktualisierungsdisziplin in den Vordergrund.",
      },
      {
        title: "Redaktioneller Prozess",
        body:
          "Indexierbare Seiten werden nur dann veroffentlicht oder weiter indexiert, wenn sie einen eigenstandigen Nutzwert haben. Dazu gehoren ein klarer Anwendungsfall, erkennbare Grenzen, konkrete Nutzungshinweise und ein nachvollziehbarer Quellenapparat. Vergleichsseiten sollen neutrale Entscheidungshilfe sein und nicht als versteckte Verkaufsseiten funktionieren. Wenn eine Seite diesen Standard nicht mehr erfullt, bleibt sie gegebenenfalls erreichbar, wird aber aus der Indexierung genommen, bis sie uberarbeitet ist.",
      },
      {
        title: "Quellen und Uberprufung",
        body:
          "Jede indexierbare redaktionelle Seite enthalt einen Autor- oder Redaktionshinweis, ein Uberprufungsdatum und verlinkte Quellen. Aussagen zu Preis, Sprachabdeckung, Produktgrenzen oder Richtlinien sollen auf primare oder klar nachvollziehbare Quellen gestutzt werden. Wir behandeln diese Seiten als Produktdokumentation plus Entscheidungshilfe, nicht als Fullmaterial fur Reichweite oder Anzeigenflachen.",
      },
      {
        title: "KI-Hinweis",
        body:
          "TTS Easy verwendet KI-Sprachsysteme fur die Audiogenerierung. Redaktionelle Inhalte konnen KI-gestutzte Entwurfe oder Ubersetzungshilfen nutzen, werden aber erst nach manueller Uberarbeitung, Faktenprufung und Quellenkontrolle indexiert. KI ersetzt hier weder Rechtsprufung noch fachliche Verantwortung. Verwendet wird sie nur, wenn sie einen nachvollziehbaren operativen Vorteil bringt.",
      },
      {
        title: "Wartung und Kontakt",
        body:
          "Die Website wird laufend gepflegt. Wenn Produktverhalten, Quellenlage oder Richtlinien sich andern, werden betroffene Seiten aktualisiert oder aus der Indexierung genommen. Support, Korrekturhinweise und operative Anfragen gehen an support@ttseasy.com. Auf kritische Korrekturen reagieren wir bevorzugt vor neuen Veroffentlichungen.",
      },
    ],
  },
  en: {
    title: "About TTS Easy",
    sections: [
      {
        title: "Mission",
        body:
          "TTS Easy is built as a focused text-to-speech workflow for everyday publishing work. The product deliberately keeps the scope narrow: paste text, verify language, choose a voice, and leave with a usable MP3. That constraint is intentional. The goal is to help creators, educators, support teams, and operators finish a real job quickly instead of navigating a wide but noisy feature surface.",
      },
      {
        title: "Ownership and operation",
        body:
          "The public website, editorial layer, and related API product are operated under the TTS Easy brand. This page does not invent biographies, credentials, or individual experts that cannot be substantiated. When a page is authored and maintained by the brand rather than a named individual, we label it as editorial work owned by TTS Easy and rely on transparent sourcing, review dates, and maintenance notes instead of inflated author claims.",
      },
      {
        title: "Editorial process",
        body:
          "Indexable pages are only kept live when they can stand on their own as decision support or product documentation. That means every page needs a clear scope, explicit limits, practical guidance, and enough depth to solve a concrete question. Comparison pages are expected to help a reader choose responsibly, not to act as disguised sales copy. If a page stops meeting that bar, we would rather keep it accessible in noindex form than continue treating it as evergreen editorial inventory.",
      },
      {
        title: "Sourcing and review",
        body:
          "Every indexable editorial page is expected to surface who reviewed it, when it was reviewed, and which sources support key claims. Pricing, language coverage, provider limitations, and policy-sensitive statements should point to primary sources whenever possible. We treat the content layer as part of product trust, not as filler around ads or growth experiments.",
      },
      {
        title: "AI disclosure",
        body:
          "TTS Easy uses AI speech systems for audio generation. Editorial work may use AI-assisted drafting or translation to speed up maintenance, but content is not considered ready for indexation until it has gone through manual review, factual checks, and source verification. AI is used here as operational leverage, not as a substitute for editorial accountability or legal judgment.",
      },
      {
        title: "Maintenance and contact",
        body:
          "The site is actively maintained. When product behavior, source material, or policy expectations change, affected pages are revised, downgraded to noindex, or removed from curated hubs until they are ready again. Support, correction requests, and operational questions can be sent to support@ttseasy.com. Critical corrections take priority over publishing new content.",
      },
    ],
  },
  es: {
    title: "Acerca de TTS Easy",
    sections: [
      {
        title: "Mision",
        body:
          "TTS Easy esta pensado como un flujo de texto a voz muy enfocado para tareas reales de publicacion. El producto mantiene el alcance a proposito: pegar texto, revisar idioma, elegir voz y salir con un MP3 util. Esa limitacion es intencional. La idea es ayudar a creadores, educadores, equipos de soporte y operadores a terminar una tarea concreta sin perder tiempo en una superficie de funciones amplia pero ruidosa.",
      },
      {
        title: "Propiedad y operacion",
        body:
          "La web publica, la capa editorial y el producto API asociado se operan bajo la marca TTS Easy. Esta pagina no inventa biografias, credenciales ni expertos individuales que no puedan sostenerse con evidencia. Cuando una pieza esta mantenida por la marca y no por una persona concreta, la tratamos como trabajo editorial de TTS Easy y priorizamos trazabilidad de fuentes, fechas de revision y mantenimiento real por encima de firmas decorativas.",
      },
      {
        title: "Proceso editorial",
        body:
          "Solo mantenemos indexables las paginas que se sostienen por si mismas como ayuda para decidir o como documentacion del producto. Eso implica alcance claro, limites explicitos, orientacion practica y suficiente profundidad para resolver una pregunta concreta. Las comparativas deben servir para elegir con criterio, no como ventas encubiertas. Si una pagina deja de cumplir ese liston, preferimos mantenerla accesible en noindex antes que seguir tratandola como inventario editorial permanente.",
      },
      {
        title: "Fuentes y revision",
        body:
          "Toda pagina editorial indexable debe mostrar quien la reviso, cuando se reviso y que fuentes respaldan sus afirmaciones clave. Precio, cobertura de idiomas, limites de proveedores o afirmaciones sensibles a politicas deben apuntar a fuentes primarias siempre que sea posible. Tratamos el contenido como una extension de la confianza del producto, no como relleno para anuncios o crecimiento.",
      },
      {
        title: "Disclosure de IA",
        body:
          "TTS Easy usa sistemas de voz con IA para generar audio. El trabajo editorial puede apoyarse en borradores o traducciones asistidas por IA para acelerar mantenimiento, pero una pieza no se considera lista para indexacion hasta pasar revision manual, comprobacion factual y verificacion de fuentes. La IA se usa como palanca operativa, no como sustituto de responsabilidad editorial o criterio legal.",
      },
      {
        title: "Mantenimiento y contacto",
        body:
          "El sitio se mantiene de forma activa. Cuando cambia el producto, cambia una fuente o cambia una expectativa de politica, las paginas afectadas se revisan, pasan a noindex o salen de los hubs curados hasta volver a estar listas. Soporte, correcciones y consultas operativas: support@ttseasy.com. Las correcciones criticas tienen prioridad sobre publicar piezas nuevas.",
      },
    ],
  },
  fr: {
    title: "A propos de TTS Easy",
    sections: [
      {
        title: "Mission",
        body:
          "TTS Easy est concu comme un flux texte-vers-parole volontairement resserre pour des taches concretes de publication. Le produit garde peu d'etapes : coller un texte, verifier la langue, choisir une voix et recuperer un MP3 exploitable. Cette contrainte est voulue. L'objectif est d'aider des createurs, formateurs, equipes support et operateurs a terminer un vrai travail sans se perdre dans une surface fonctionnelle trop large et peu lisible.",
      },
      {
        title: "Propriete et exploitation",
        body:
          "Le site public, la couche editoriale et le produit API associe sont exploites sous la marque TTS Easy. Cette page n'invente ni biographies, ni references, ni experts individuels impossibles a verifier. Quand une page est maintenue par la marque plutot que par une personne nommee, nous l'assumons comme contenu editorial TTS Easy et nous mettons l'accent sur les sources, les dates de relecture et la maintenance reelle.",
      },
      {
        title: "Processus editorial",
        body:
          "Les pages indexables sont conservees uniquement lorsqu'elles tiennent seules comme aide a la decision ou documentation produit. Cela suppose un perimetre clair, des limites explicites, des conseils pratiques et une profondeur suffisante pour resoudre une question concrete. Les comparatifs doivent aider a choisir avec discernement, pas servir de vente deguisee. Si une page ne tient plus ce niveau, nous preferons la garder accessible en noindex plutot que de la presenter comme un actif editorial durable.",
      },
      {
        title: "Sources et relecture",
        body:
          "Toute page editoriale indexable doit indiquer qui l'a relue, a quelle date et quelles sources soutiennent ses affirmations principales. Les informations de prix, de couverture linguistique, de limites produit ou de politique doivent renvoyer a des sources primaires quand c'est possible. Nous traitons ce contenu comme une composante de confiance produit, pas comme du remplissage autour de la publicite.",
      },
      {
        title: "Divulgation IA",
        body:
          "TTS Easy utilise des systemes vocaux d'IA pour la generation audio. Le travail editorial peut s'appuyer sur des brouillons ou traductions assistes par IA pour accelerer la maintenance, mais une page n'est pas consideree comme prete a l'indexation avant relecture humaine, verification factuelle et controle des sources. L'IA sert ici d'appui operationnel, pas de remplacement a la responsabilite editoriale.",
      },
      {
        title: "Maintenance et contact",
        body:
          "Le site est maintenu activement. Quand le produit change, qu'une source evolue ou qu'une attente de politique bouge, les pages concernees sont revisees, passees en noindex ou retirees des hubs cures jusqu'a remise a niveau. Support, signalement de correction et questions operationnelles : support@ttseasy.com. Les corrections critiques passent avant la publication de nouveaux contenus.",
      },
    ],
  },
  it: {
    title: "Informazioni su TTS Easy",
    sections: [
      {
        title: "Missione",
        body:
          "TTS Easy e progettato come un flusso testo-voce molto focalizzato per lavori reali di pubblicazione. Il prodotto limita volutamente i passaggi: incollare il testo, verificare la lingua, scegliere la voce e ottenere un MP3 utilizzabile. Questa scelta e intenzionale. L'obiettivo e aiutare creator, formatori, team di supporto e operatori a completare un compito concreto senza perdersi in una superficie di funzioni ampia ma rumorosa.",
      },
      {
        title: "Proprieta e gestione",
        body:
          "Il sito pubblico, il layer editoriale e il prodotto API collegato sono gestiti sotto il brand TTS Easy. Questa pagina non inventa biografie, credenziali o esperti individuali che non possano essere verificati. Quando una pagina e mantenuta dal brand e non da una persona nominata, la presentiamo come lavoro editoriale di TTS Easy e privilegiamo fonti, date di revisione e manutenzione reale rispetto a firme ornamentali.",
      },
      {
        title: "Processo editoriale",
        body:
          "Manteniamo indicizzabili solo le pagine che reggono da sole come supporto decisionale o documentazione di prodotto. Questo richiede perimetro chiaro, limiti espliciti, istruzioni pratiche e profondita sufficiente per risolvere una domanda concreta. Le comparative devono aiutare a scegliere con criterio, non funzionare come vendita mascherata. Se una pagina non raggiunge piu questo standard, preferiamo lasciarla accessibile in noindex invece di trattarla come inventario editoriale permanente.",
      },
      {
        title: "Fonti e revisione",
        body:
          "Ogni pagina editoriale indicizzabile deve indicare chi l'ha revisionata, quando e quali fonti sostengono le affermazioni principali. Prezzi, copertura linguistica, limiti dei provider o affermazioni sensibili alle policy dovrebbero rimandare a fonti primarie quando possibile. Trattiamo il contenuto come parte della fiducia del prodotto, non come riempitivo attorno alla monetizzazione.",
      },
      {
        title: "Disclosure IA",
        body:
          "TTS Easy utilizza sistemi vocali basati su IA per la generazione audio. Il lavoro editoriale puo usare bozze o traduzioni assistite dall'IA per accelerare la manutenzione, ma una pagina non e pronta per l'indicizzazione finche non passa revisione manuale, controllo dei fatti e verifica delle fonti. L'IA viene usata come leva operativa, non come sostituto della responsabilita editoriale o legale.",
      },
      {
        title: "Manutenzione e contatto",
        body:
          "Il sito viene mantenuto attivamente. Quando cambiano prodotto, fonti o aspettative di policy, le pagine coinvolte vengono aggiornate, spostate in noindex o rimosse dagli hub curati finche non tornano pronte. Supporto, richieste di correzione e questioni operative: support@ttseasy.com. Le correzioni critiche hanno priorita rispetto alla pubblicazione di nuovi contenuti.",
      },
    ],
  },
  pt: {
    title: "Sobre o TTS Easy",
    sections: [
      {
        title: "Missao",
        body:
          "O TTS Easy foi concebido como um fluxo de texto para fala bem focado em tarefas reais de publicacao. O produto limita de proposito as etapas: colar texto, validar idioma, escolher voz e sair com um MP3 utilizavel. Essa restricao e intencional. A meta e ajudar criadores, educadores, equipas de suporte e operadores a terminar um trabalho concreto sem se perder numa superficie funcional ampla e ruidosa.",
      },
      {
        title: "Propriedade e operacao",
        body:
          "O site publico, a camada editorial e o produto API relacionado sao operados sob a marca TTS Easy. Esta pagina nao inventa biografias, credenciais ou especialistas individuais que nao possam ser sustentados. Quando uma pagina e mantida pela marca e nao por uma pessoa nomeada, tratamo-la como trabalho editorial da TTS Easy e priorizamos fontes, datas de revisao e manutencao real acima de assinaturas decorativas.",
      },
      {
        title: "Processo editorial",
        body:
          "So mantemos indexaveis as paginas que se sustentam sozinhas como apoio a decisao ou documentacao do produto. Isso exige escopo claro, limites explicitos, orientacao pratica e profundidade suficiente para resolver uma pergunta concreta. Paginas comparativas devem ajudar o leitor a escolher com criterio, nao funcionar como vendas disfarçadas. Se uma pagina deixa de cumprir esse padrao, preferimos mantela acessivel em noindex a continua-la tratando como inventario editorial permanente.",
      },
      {
        title: "Fontes e revisao",
        body:
          "Toda pagina editorial indexavel deve mostrar quem a reviu, quando foi revista e que fontes sustentam as afirmacoes principais. Precos, cobertura de idiomas, limites de fornecedores ou afirmacoes sensiveis a politicas devem apontar para fontes primarias sempre que possivel. Tratamos o conteudo como parte da confianca do produto, nao como enchimento em volta de anuncios.",
      },
      {
        title: "Divulgacao de IA",
        body:
          "O TTS Easy usa sistemas de voz com IA para geracao de audio. O trabalho editorial pode recorrer a rascunhos ou traducoes assistidas por IA para acelerar manutencao, mas uma pagina nao e considerada pronta para indexacao ate passar por revisao manual, verificacao factual e confirmacao de fontes. A IA e usada como alavanca operacional, nao como substituto de responsabilidade editorial ou juridica.",
      },
      {
        title: "Manutencao e contacto",
        body:
          "O site e mantido ativamente. Quando o produto muda, uma fonte muda ou uma expectativa de politica se altera, as paginas afetadas sao revistas, movidas para noindex ou retiradas dos hubs curados ate ficarem prontas novamente. Suporte, pedidos de correcao e questoes operacionais: support@ttseasy.com. Correcções criticas têm prioridade sobre novas publicacoes.",
      },
    ],
  },
};

export function getAboutContent(locale: Locale): AboutContent {
  return ABOUT_CONTENT[locale] ?? ABOUT_CONTENT.en;
}
