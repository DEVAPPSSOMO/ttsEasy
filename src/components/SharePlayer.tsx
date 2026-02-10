"use client";

import { useEffect, useState } from "react";

interface ShareData {
  text: string;
  locale: string;
  readerId: string;
  speed: number;
}

interface SharePlayerProps {
  shareId: string;
}

export function SharePlayer({ shareId }: SharePlayerProps): JSX.Element {
  const [data, setData] = useState<ShareData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/share?id=${encodeURIComponent(shareId)}`)
      .then(async (res) => {
        if (!res.ok) {
          setError(res.status === 404 ? "This shared audio has expired." : "Unable to load shared audio.");
          return;
        }
        const json = (await res.json()) as ShareData;
        setData(json);
      })
      .catch(() => setError("Unable to load shared audio."))
      .finally(() => setLoading(false));
  }, [shareId]);

  if (loading) {
    return <p style={{ color: "var(--muted)" }}>Loading...</p>;
  }

  if (error || !data) {
    return <p style={{ color: "var(--danger)" }}>{error || "Not found."}</p>;
  }

  return (
    <div className="share-player">
      <blockquote className="share-text">{data.text}</blockquote>
      <p className="share-meta">
        {data.locale} &middot; {data.readerId} &middot; {data.speed}x
      </p>
    </div>
  );
}
