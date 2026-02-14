import { notFound, redirect } from "next/navigation";
import { PortalLoginForm } from "@/components/portal/PortalLoginForm";
import { isApiVariant } from "@/lib/appVariant";
import { getPortalSessionFromCookieStore } from "@/lib/portalAuth";

interface LoginPageProps {
  searchParams: { error?: string; next?: string };
}

function mapError(error: string | undefined): string | undefined {
  if (!error) return undefined;
  if (error === "invalid_or_expired_link") {
    return "El enlace ha caducado o no es válido. Solicita uno nuevo.";
  }
  if (error === "missing_token") {
    return "El enlace de acceso está incompleto. Solicita uno nuevo.";
  }
  return undefined;
}

export default async function PortalLoginPage({ searchParams }: LoginPageProps): Promise<JSX.Element> {
  if (!isApiVariant()) {
    notFound();
  }

  const session = await getPortalSessionFromCookieStore();
  if (session) {
    redirect(searchParams.next || "/dashboard");
  }

  return (
    <section className="portal-section portal-login">
      <h1>Acceso al portal API</h1>
      <p>Entra con enlace mágico por email para gestionar saldo, claves y recargas.</p>
      <PortalLoginForm initialError={mapError(searchParams.error)} />
    </section>
  );
}
