"use client";

import { FormEvent, useState } from "react";

interface PortalLoginFormProps {
  initialError?: string;
}

export function PortalLoginForm({ initialError }: PortalLoginFormProps): JSX.Element {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(initialError ?? "");

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSent(false);

    try {
      const response = await fetch("/api/portal/auth/magic-link", {
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      });

      if (!response.ok) {
        setError("No pudimos enviar el enlace. Revisa el email e inténtalo otra vez.");
        return;
      }

      setSent(true);
    } catch {
      setError("No pudimos enviar el enlace. Revisa el email e inténtalo otra vez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="portal-form" onSubmit={onSubmit}>
      <label htmlFor="portal-email">Email</label>
      <input
        id="portal-email"
        type="email"
        autoComplete="email"
        placeholder="tu@email.com"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? "Enviando..." : "Enviar enlace mágico"}
      </button>
      {sent ? <p className="portal-success">Te hemos enviado un enlace de acceso.</p> : null}
      {error ? <p className="portal-error">{error}</p> : null}
    </form>
  );
}
