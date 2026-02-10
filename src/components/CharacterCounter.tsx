"use client";

import { useState } from "react";

interface CharacterCounterProps {
  ctaText: string;
  ctaHref: string;
}

export function CharacterCounter({ ctaText, ctaHref }: CharacterCounterProps): JSX.Element {
  const [text, setText] = useState("");

  const chars = text.length;
  const charsNoSpaces = text.replace(/\s/g, "").length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const sentences = text.trim() ? text.split(/[.!?]+/).filter((s) => s.trim()).length : 0;
  const paragraphs = text.trim() ? text.split(/\n\n+/).filter((p) => p.trim()).length : 0;

  return (
    <div className="tool-workspace">
      <textarea
        className="text-input"
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste or type text here..."
        value={text}
        style={{ minHeight: "200px" }}
      />
      <div className="counter-stats">
        <div className="stat"><span className="stat-value">{chars}</span><span className="stat-label">Characters</span></div>
        <div className="stat"><span className="stat-value">{charsNoSpaces}</span><span className="stat-label">No spaces</span></div>
        <div className="stat"><span className="stat-value">{words}</span><span className="stat-label">Words</span></div>
        <div className="stat"><span className="stat-value">{sentences}</span><span className="stat-label">Sentences</span></div>
        <div className="stat"><span className="stat-value">{paragraphs}</span><span className="stat-label">Paragraphs</span></div>
      </div>
      {text.trim() && (
        <a href={ctaHref} className="landing-cta" style={{ display: "inline-block", marginTop: "1.5rem", textDecoration: "none", padding: "0.8rem 2rem" }}>
          {ctaText}
        </a>
      )}
    </div>
  );
}
