"use client";

import { trackFaqInteraction } from "@/lib/analytics";

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqProps {
  title: string;
  items: FaqItem[];
  openCount?: number;
}

export function Faq({ title, items, openCount = 3 }: FaqProps): JSX.Element {
  return (
    <section className="faq-section">
      <h2>{title}</h2>
      {items.map((item, index) => (
        <details
          key={item.question}
          onToggle={(e) => {
            if ((e.currentTarget as HTMLDetailsElement).open) {
              trackFaqInteraction(item.question);
            }
          }}
          open={index < openCount}
        >
          <summary>{item.question}</summary>
          <p>{item.answer}</p>
        </details>
      ))}
    </section>
  );
}
