import { redirect } from "next/navigation";
import { PortalBillingManager } from "@/components/portal/PortalBillingManager";
import { getPortalSessionFromCookieStore } from "@/lib/portalAuth";
import { getWalletBalance, listWalletTransactions } from "@/lib/prepaidBilling";

export default async function DashboardBillingPage(): Promise<JSX.Element> {
  const session = await getPortalSessionFromCookieStore();
  if (!session) {
    redirect("/auth/login");
  }

  const [wallet, txPage] = await Promise.all([
    getWalletBalance(session.account.id),
    listWalletTransactions(session.account.id, { cursor: null, limit: 20 }),
  ]);

  return (
    <section className="portal-section">
      <h1>Billing y wallet</h1>
      <p>Recarga saldo, revisa movimientos y ajusta auto-recarga.</p>
      <PortalBillingManager initialWallet={wallet} initialTransactions={txPage.transactions} />
    </section>
  );
}
