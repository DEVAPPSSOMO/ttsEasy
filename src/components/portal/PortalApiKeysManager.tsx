"use client";

import { useMemo, useState } from "react";
import { PortalApiKey, PortalApiKeyCreateResponse } from "@/lib/types";

interface PortalApiKeysManagerProps {
  initialKeys: PortalApiKey[];
  initialOneTimeKey?: string | null;
}

function formatDate(value: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

export function PortalApiKeysManager({
  initialKeys,
  initialOneTimeKey,
}: PortalApiKeysManagerProps): JSX.Element {
  const [keys, setKeys] = useState<PortalApiKey[]>(initialKeys);
  const [flashSecret, setFlashSecret] = useState<string | null>(initialOneTimeKey ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const activeCount = useMemo(() => keys.filter((key) => key.status === "active").length, [keys]);

  async function createKey(): Promise<void> {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/portal/api-keys", {
        body: "{}",
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      if (response.status === 409) {
        setError("Has alcanzado el límite de claves activas.");
        return;
      }
      if (!response.ok) {
        setError("No pudimos crear la clave.");
        return;
      }

      const payload = (await response.json()) as PortalApiKeyCreateResponse;
      setFlashSecret(payload.api_key);
      setKeys((prev) => [payload.key, ...prev]);
    } catch {
      setError("No pudimos crear la clave.");
    } finally {
      setLoading(false);
    }
  }

  async function revokeKey(keyId: string): Promise<void> {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/portal/api-keys/${encodeURIComponent(keyId)}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        setError("No pudimos revocar la clave.");
        return;
      }
      setKeys((prev) =>
        prev.map((item) =>
          item.id === keyId
            ? {
                ...item,
                revoked_at: new Date().toISOString(),
                status: "revoked",
              }
            : item
        )
      );
    } catch {
      setError("No pudimos revocar la clave.");
    } finally {
      setLoading(false);
    }
  }

  async function copySecret(secret: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(secret);
    } catch {
      setError("No pudimos copiar la clave automáticamente.");
    }
  }

  return (
    <section className="portal-card">
      <div className="portal-card-head">
        <h2>API Keys</h2>
        <button type="button" onClick={createKey} disabled={loading}>
          {loading ? "Procesando..." : "Crear nueva key"}
        </button>
      </div>
      <p>Claves activas: {activeCount}</p>

      {flashSecret ? (
        <div className="portal-flash-secret">
          <p>Guarda esta clave ahora. Solo se muestra una vez:</p>
          <code>{flashSecret}</code>
          <button type="button" onClick={() => copySecret(flashSecret)}>
            Copiar
          </button>
          <button type="button" onClick={() => setFlashSecret(null)}>
            Ocultar
          </button>
        </div>
      ) : null}

      {error ? <p className="portal-error">{error}</p> : null}

      <div className="portal-table-wrap">
        <table className="portal-table">
          <thead>
            <tr>
              <th>Prefijo</th>
              <th>Estado</th>
              <th>Rate/min</th>
              <th>Límite mensual</th>
              <th>Último uso</th>
              <th>Creada</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {keys.map((key) => (
              <tr key={key.id}>
                <td>
                  <code>{key.key_prefix}</code>
                </td>
                <td>{key.status}</td>
                <td>{key.rate_limit_per_minute}</td>
                <td>{key.monthly_hard_limit_chars ?? "-"}</td>
                <td>{formatDate(key.last_used_at)}</td>
                <td>{formatDate(key.created_at)}</td>
                <td>
                  {key.status === "active" ? (
                    <button type="button" onClick={() => revokeKey(key.id)} disabled={loading}>
                      Revocar
                    </button>
                  ) : (
                    <span>-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
