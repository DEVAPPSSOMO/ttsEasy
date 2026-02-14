import { Faq } from "@/components/Faq";
import { faqJsonLd } from "@/lib/seo/jsonLd";

const items = [
  {
    question: "¿Cuál es la recarga mínima?",
    answer: "5€ por operación. Puedes usar packs fijos o importe libre igual o superior a 5€.",
  },
  {
    question: "¿Qué significa 402 insufficient_balance?",
    answer: "El wallet no tenía saldo suficiente para cubrir el coste del request de síntesis.",
  },
  {
    question: "¿Cómo se calcula el precio por request?",
    answer:
      "Por caracteres de entrada facturables, aplicando tramos acumulados del mes: 15€/M, 12€/M y 10€/M.",
  },
  {
    question: "¿Puedo evitar doble cobro en reintentos?",
    answer: "Sí. Envía `Idempotency-Key` y el sistema evita dobles débitos para el mismo payload.",
  },
  {
    question: "¿Hay auto-recarga?",
    answer: "Sí. Es opcional y configurable desde dashboard (default 10€ al bajar de 2€).",
  },
  {
    question: "¿Cómo se protegen las API keys?",
    answer: "Se almacenan con hash SHA-256 + pepper y solo se muestran en claro al crearlas.",
  },
  {
    question: "¿Incluye IVA UE?",
    answer: "Sí. Stripe Tax se configura en modo tax inclusive para mantener operativa y fiscalidad coherentes.",
  },
];

export default function ApiFaqPage(): JSX.Element {
  return (
    <section className="portal-section">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqJsonLd(items)),
        }}
      />
      <h1>FAQ API</h1>
      <p>Preguntas frecuentes sobre precios, recargas, errores y seguridad.</p>
      <Faq title="Preguntas frecuentes" items={items} />
    </section>
  );
}
