import { redirect } from "next/navigation";
import { PortalApiKeysManager } from "@/components/portal/PortalApiKeysManager";
import { getPortalSessionFromCookieStore } from "@/lib/portalAuth";
import { listPortalApiKeys } from "@/lib/portalStore";

interface ApiKeysPageProps {
  searchParams: { initial_key?: string };
}

export default async function DashboardApiKeysPage({
  searchParams,
}: ApiKeysPageProps): Promise<JSX.Element> {
  const session = await getPortalSessionFromCookieStore();
  if (!session) {
    redirect("/auth/login");
  }

  const keys = await listPortalApiKeys(session.account.id);

  return (
    <section className="portal-section">
      <h1>Gestión de API keys</h1>
      <p>Crea, rota y revoca claves para tus integraciones.</p>
      <PortalApiKeysManager initialKeys={keys} initialOneTimeKey={searchParams.initial_key ?? null} />
    </section>
  );
}
