import Link from "next/link";
import { redirect } from "next/navigation";
import { getPortalSessionFromCookieStore } from "@/lib/portalAuth";
import { getMonthUsageSummary, getWalletBalance } from "@/lib/prepaidBilling";

interface DashboardPageProps {
  searchParams: { initial_key?: string };
}

function toEur(valueMicros: number): string {
  return `€${(valueMicros / 1_000_000).toFixed(2)}`;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps): Promise<JSX.Element> {
  const session = await getPortalSessionFromCookieStore();
  if (!session) {
    redirect("/auth/login");
  }

  const [wallet, month] = await Promise.all([
    getWalletBalance(session.account.id),
    getMonthUsageSummary(session.account.id),
  ]);

  return (
    <section className="portal-section">
      <h1>Dashboard</h1>
      <p>
        Cuenta: <code>{session.account.id}</code>
      </p>

      {searchParams.initial_key ? (
        <div className="portal-flash-secret">
          <p>API key inicial (se muestra una vez):</p>
          <code>{searchParams.initial_key}</code>
        </div>
      ) : null}

      <div className="portal-grid-3">
        <article className="portal-card">
          <h3>Saldo wallet</h3>
          <p>{toEur(wallet.balance_micros)}</p>
        </article>
        <article className="portal-card">
          <h3>Consumo del mes</h3>
          <p>{toEur(month.usage_charge_micros)}</p>
        </article>
        <article className="portal-card">
          <h3>Caracteres del mes</h3>
          <p>{month.chars.toLocaleString()}</p>
        </article>
      </div>

      <div className="portal-cta-row">
        <Link href="/dashboard/api-keys" className="portal-btn-primary">
          Gestionar API keys
        </Link>
        <Link href="/dashboard/billing" className="portal-btn-secondary">
          Billing y recargas
        </Link>
      </div>
    </section>
  );
}
