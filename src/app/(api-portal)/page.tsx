import Link from "next/link";
import { faqJsonLd } from "@/lib/seo/jsonLd";

const highlightFaq = [
  {
    answer: "15€/M hasta 20M chars, 12€/M de 20M a 100M y 10€/M por encima de 100M.",
    question: "¿Cuál es el precio por uso?",
  },
  {
    answer: "El modelo es prepago en EUR. Si no hay saldo suficiente, la API responde 402 insufficient_balance.",
    question: "¿Qué pasa si no tengo saldo?",
  },
  {
    answer: "Sí, con trigger por defecto de 2€ y recarga de 10€, configurable desde dashboard.",
    question: "¿Hay auto-recarga?",
  },
];

export default function ApiPortalHomePage(): JSX.Element {
  return (
    <section className="portal-hero">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqJsonLd(highlightFaq)),
        }}
      />

      <p className="portal-eyebrow">api.ttseasy.com</p>
      <h1>API de Text-to-Speech con prepago en EUR y Stripe</h1>
      <p>
        Integra síntesis de voz en minutos con API key, control de saldo, recargas manuales y auto-recarga.
      </p>

      <div className="portal-cta-row">
        <Link href="/auth/login" className="portal-btn-primary">
          Crear cuenta
        </Link>
        <Link href="/docs" className="portal-btn-secondary">
          Probar API
        </Link>
        <Link href="/pricing" className="portal-btn-secondary">
          Ver precios
        </Link>
      </div>

      <div className="portal-grid-3">
        <article>
          <h3>Auth dual</h3>
          <p>Usuarios con magic link para dashboard y API keys para consumo M2M en `/api/v1/*`.</p>
        </article>
        <article>
          <h3>Prepago real</h3>
          <p>Recarga mínima de 5€ con Stripe Checkout. Cobro bloqueado si no hay saldo.</p>
        </article>
        <article>
          <h3>Operativa simple</h3>
          <p>Wallet, transacciones y auto-recarga desde dashboard sin fricción de postpago.</p>
        </article>
      </div>
    </section>
  );
}
