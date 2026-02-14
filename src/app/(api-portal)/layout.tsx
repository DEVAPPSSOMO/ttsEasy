import Link from "next/link";
import { notFound } from "next/navigation";
import { isApiVariant } from "@/lib/appVariant";
import { getPortalSessionFromCookieStore } from "@/lib/portalAuth";

export default async function ApiPortalLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<JSX.Element> {
  if (!isApiVariant()) {
    notFound();
  }

  const session = await getPortalSessionFromCookieStore();

  return (
    <div className="portal-shell">
      <header className="portal-header">
        <Link href="/" className="portal-logo">
          TTS Easy API
        </Link>
        <nav className="portal-nav">
          <Link href="/pricing">Pricing</Link>
          <Link href="/docs">Docs</Link>
          <Link href="/faq">FAQ</Link>
          <Link href="/status">Status</Link>
          {session ? <Link href="/dashboard">Dashboard</Link> : <Link href="/auth/login">Crear cuenta</Link>}
          {session ? <Link href="/auth/logout">Salir</Link> : null}
        </nav>
      </header>
      <main className="portal-main">{children}</main>
      <footer className="portal-footer">
        <nav>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/cookies">Cookies</Link>
        </nav>
      </footer>
    </div>
  );
}
