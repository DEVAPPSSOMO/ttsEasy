import { isApiVariant } from "@/lib/appVariant";
import { isSupabaseConfigured, isSupabaseServiceConfigured } from "@/lib/supabase/server";

function statusBadge(ok: boolean): string {
  return ok ? "ok" : "missing";
}

export default function ApiStatusPage(): JSX.Element {
  const upstashOk = Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
  const stripeOk = Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);

  const rows = [
    { name: "App variant", value: isApiVariant() ? "api" : "public", ok: isApiVariant() },
    { name: "Supabase auth", value: statusBadge(isSupabaseConfigured()), ok: isSupabaseConfigured() },
    {
      name: "Supabase service role",
      value: statusBadge(isSupabaseServiceConfigured()),
      ok: isSupabaseServiceConfigured(),
    },
    { name: "Upstash Redis", value: statusBadge(upstashOk), ok: upstashOk },
    { name: "Stripe", value: statusBadge(stripeOk), ok: stripeOk },
  ];

  return (
    <section className="portal-section">
      <h1>Status</h1>
      <p>Comprobación rápida de dependencias para operación API.</p>
      <div className="portal-card">
        <table className="portal-table">
          <thead>
            <tr>
              <th>Componente</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.name}>
                <td>{row.name}</td>
                <td>
                  <span className={row.ok ? "portal-pill-ok" : "portal-pill-warn"}>{row.value}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
