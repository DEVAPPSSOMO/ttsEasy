"use client";

import { useMemo, useState } from "react";
import { WalletBalance, WalletTransaction } from "@/lib/types";

interface PortalBillingManagerProps {
  initialTransactions: WalletTransaction[];
  initialWallet: WalletBalance;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function formatEuros(value: number): string {
  return `€${value.toFixed(2)}`;
}

export function PortalBillingManager({
  initialTransactions,
  initialWallet,
}: PortalBillingManagerProps): JSX.Element {
  const [wallet, setWallet] = useState<WalletBalance>(initialWallet);
  const [transactions, setTransactions] = useState<WalletTransaction[]>(initialTransactions);
  const [pack, setPack] = useState<"pack_5" | "pack_10" | "pack_25" | "pack_50">("pack_10");
  const [customAmount, setCustomAmount] = useState<string>("5");
  const [useCustomAmount, setUseCustomAmount] = useState(false);
  const [savingAuto, setSavingAuto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const autoStateLabel = useMemo(() => {
    if (!wallet.auto_recharge.enabled) return "disabled";
    return wallet.auto_recharge.status;
  }, [wallet.auto_recharge.enabled, wallet.auto_recharge.status]);

  async function refreshData(): Promise<void> {
    setLoading(true);
    setError("");
    try {
      const [walletRes, txRes] = await Promise.all([
        fetch("/api/portal/wallet", { method: "GET" }),
        fetch("/api/portal/transactions?limit=20", { method: "GET" }),
      ]);

      if (!walletRes.ok || !txRes.ok) {
        setError("No pudimos refrescar la información de billing.");
        return;
      }

      const walletData = (await walletRes.json()) as WalletBalance;
      const txData = (await txRes.json()) as { transactions: WalletTransaction[] };
      setWallet(walletData);
      setTransactions(txData.transactions ?? []);
    } catch {
      setError("No pudimos refrescar la información de billing.");
    } finally {
      setLoading(false);
    }
  }

  async function startTopup(): Promise<void> {
    setLoading(true);
    setError("");
    try {
      const payload: Record<string, unknown> = {
        cancel_url: window.location.href,
        save_payment_method: true,
        success_url: window.location.href,
      };
      if (useCustomAmount) {
        payload.amount_eur = Number(customAmount);
      } else {
        payload.pack_id = pack;
      }

      const response = await fetch("/api/portal/topups/checkout-session", {
        body: JSON.stringify(payload),
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({ error: "invalid_topup" }))) as {
          error?: string;
        };
        if (body.error === "invalid_topup_amount") {
          setError("El importe mínimo de recarga es 5€.");
          return;
        }
        setError("No pudimos crear la sesión de checkout.");
        return;
      }

      const body = (await response.json()) as { checkout_url: string };
      if (!body.checkout_url) {
        setError("Stripe no devolvió URL de checkout.");
        return;
      }

      window.location.href = body.checkout_url;
    } catch {
      setError("No pudimos crear la sesión de checkout.");
    } finally {
      setLoading(false);
    }
  }

  async function saveAutoRecharge(enabled: boolean): Promise<void> {
    setSavingAuto(true);
    setError("");

    try {
      const response = await fetch("/api/portal/auto-recharge", {
        body: JSON.stringify({
          amount_eur: wallet.auto_recharge.amount_eur,
          enabled,
          trigger_eur: wallet.auto_recharge.trigger_eur,
        }),
        headers: {
          "content-type": "application/json",
        },
        method: "PATCH",
      });

      if (!response.ok) {
        setError("No pudimos actualizar la auto-recarga.");
        return;
      }

      const updated = (await response.json()) as WalletBalance["auto_recharge"];
      setWallet((prev) => ({ ...prev, auto_recharge: updated }));
    } catch {
      setError("No pudimos actualizar la auto-recarga.");
    } finally {
      setSavingAuto(false);
    }
  }

  return (
    <section className="portal-card">
      <div className="portal-card-head">
        <h2>Billing prepago</h2>
        <button type="button" onClick={refreshData} disabled={loading}>
          {loading ? "Actualizando..." : "Refrescar"}
        </button>
      </div>

      <p>
        Saldo actual: <strong>{formatEuros(wallet.balance_eur)}</strong>
      </p>
      <p>
        Auto-recarga: <strong>{autoStateLabel}</strong> (trigger {formatEuros(wallet.auto_recharge.trigger_eur)},
        recarga {formatEuros(wallet.auto_recharge.amount_eur)})
      </p>

      <div className="portal-actions-row">
        <label>
          <input
            type="checkbox"
            checked={useCustomAmount}
            onChange={(event) => setUseCustomAmount(event.target.checked)}
          />
          Importe libre
        </label>

        {useCustomAmount ? (
          <input
            type="number"
            min="5"
            step="0.01"
            value={customAmount}
            onChange={(event) => setCustomAmount(event.target.value)}
          />
        ) : (
          <select value={pack} onChange={(event) => setPack(event.target.value as typeof pack)}>
            <option value="pack_5">Pack 5€</option>
            <option value="pack_10">Pack 10€</option>
            <option value="pack_25">Pack 25€</option>
            <option value="pack_50">Pack 50€</option>
          </select>
        )}

        <button type="button" onClick={startTopup} disabled={loading}>
          Recargar saldo
        </button>
      </div>

      <div className="portal-actions-row">
        <button
          type="button"
          onClick={() => saveAutoRecharge(!wallet.auto_recharge.enabled)}
          disabled={savingAuto}
        >
          {savingAuto
            ? "Guardando..."
            : wallet.auto_recharge.enabled
              ? "Desactivar auto-recarga"
              : "Activar auto-recarga"}
        </button>
      </div>

      {error ? <p className="portal-error">{error}</p> : null}

      <h3>Últimos movimientos</h3>
      <div className="portal-table-wrap">
        <table className="portal-table">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Importe</th>
              <th>Fecha</th>
              <th>Origen</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.tx_id}>
                <td>{tx.type}</td>
                <td>{formatEuros(tx.amount_eur)}</td>
                <td>{formatDate(tx.created_at)}</td>
                <td>{tx.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
