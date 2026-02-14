import Link from "next/link";

const endpointRows = [
  { method: "POST", path: "/api/v1/tts", description: "Sintetiza texto y debita wallet prepago." },
  { method: "GET", path: "/api/v1/billing/wallet", description: "Consulta saldo y auto-recarga." },
  { method: "GET", path: "/api/v1/billing/transactions", description: "Lista de movimientos wallet." },
  { method: "GET/PATCH", path: "/api/v1/billing/auto-recharge", description: "Configura auto-recarga." },
  {
    method: "POST",
    path: "/api/v1/billing/topups/checkout-session",
    description: "Crea sesión Stripe Checkout para recarga.",
  },
];

export default function ApiDocsPage(): JSX.Element {
  return (
    <section className="portal-section">
      <h1>Documentación rápida</h1>
      <p>Autenticación M2M con header `Authorization: Bearer &lt;api_key&gt;`.</p>

      <pre className="portal-code">{`curl -X POST https://api.ttseasy.com/api/v1/tts \\
  -H "Authorization: Bearer <api_key>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "text":"Hola mundo",
    "locale":"es-ES",
    "readerId":"natural",
    "speed":1
  }'`}</pre>

      <div className="portal-card">
        <table className="portal-table">
          <thead>
            <tr>
              <th>Método</th>
              <th>Endpoint</th>
              <th>Descripción</th>
            </tr>
          </thead>
          <tbody>
            {endpointRows.map((row) => (
              <tr key={`${row.method}-${row.path}`}>
                <td>{row.method}</td>
                <td>
                  <code>{row.path}</code>
                </td>
                <td>{row.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Errores relevantes</h2>
      <ul className="portal-list">
        <li>`401 invalid_api_key`</li>
        <li>`402 insufficient_balance`</li>
        <li>`429 rate_limited`</li>
        <li>`429 quota_exceeded`</li>
        <li>`500 tts_failed`</li>
      </ul>

      <p>
        Más detalle comercial en <Link href="/faq">FAQ</Link>.
      </p>
    </section>
  );
}
