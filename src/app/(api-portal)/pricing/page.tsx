import Link from "next/link";

const tiers = [
  { label: "0 - 20M chars / mes", price: "15€ / 1M" },
  { label: "20M - 100M chars / mes", price: "12€ / 1M" },
  { label: "> 100M chars / mes", price: "10€ / 1M" },
];

export default function ApiPricingPage(): JSX.Element {
  return (
    <section className="portal-section">
      <h1>Pricing API (EUR)</h1>
      <p>Modelo prepago sin cuota fija. Recarga mínima 5€ con IVA UE gestionado por Stripe Tax.</p>

      <div className="portal-card">
        <table className="portal-table">
          <thead>
            <tr>
              <th>Tramo mensual</th>
              <th>Precio</th>
            </tr>
          </thead>
          <tbody>
            {tiers.map((tier) => (
              <tr key={tier.label}>
                <td>{tier.label}</td>
                <td>{tier.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="portal-grid-3">
        <article>
          <h3>Saldo insuficiente</h3>
          <p>La API responde `402 insufficient_balance` si el wallet no cubre el request.</p>
        </article>
        <article>
          <h3>Auto-recarga opcional</h3>
          <p>Default recomendado: recargar 10€ al bajar de 2€.</p>
        </article>
        <article>
          <h3>Idempotencia</h3>
          <p>Soporte de `Idempotency-Key` para evitar doble débito en reintentos.</p>
        </article>
      </div>

      <p>
        <Link href="/auth/login">Crear cuenta</Link> y recarga saldo para empezar.
      </p>
    </section>
  );
}
