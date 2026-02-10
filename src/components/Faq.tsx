"use client";

import { trackFaqInteraction } from "@/lib/analytics";

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqProps {
  title: string;
  items: FaqItem[];
}

export function Faq({ title, items }: FaqProps): JSX.Element {
  return (
    <section className="faq-section">
      <h2>{title}</h2>
      {items.map((item) => (
        <details key={item.question} onToggle={(e) => {
          if ((e.currentTarget as HTMLDetailsElement).open) {
            trackFaqInteraction(item.question);
          }
        }}>
          <summary>{item.question}</summary>
          <p>{item.answer}</p>
        </details>
      ))}
    </section>
  );
}
