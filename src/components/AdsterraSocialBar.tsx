"use client";

import { useEffect } from "react";
import { trackSocialBarLoadFailed, trackSocialBarLoaded } from "@/lib/analytics";

interface AdsterraSocialBarProps {
  snippet?: string;
}

function cloneScript(source: HTMLScriptElement): HTMLScriptElement {
  const script = document.createElement("script");
  for (const attribute of Array.from(source.attributes)) {
    script.setAttribute(attribute.name, attribute.value);
  }
  if (source.textContent) {
    script.textContent = source.textContent;
  }
  return script;
}

export function AdsterraSocialBar({ snippet }: AdsterraSocialBarProps): null {
  useEffect(() => {
    const trimmedSnippet = snippet?.trim() ?? "";
    if (!trimmedSnippet) {
      trackSocialBarLoadFailed({ pageType: "other" }, { provider: "adsterra", reason: "missing_snippet" });
      return;
    }

    const container = document.createElement("div");
    container.id = "adsterra-social-bar-container";
    container.hidden = true;

    try {
      const template = document.createElement("template");
      template.innerHTML = trimmedSnippet;

      for (const node of Array.from(template.content.childNodes)) {
        if (node.nodeType === Node.TEXT_NODE && !node.textContent?.trim()) {
          continue;
        }

        if (node instanceof HTMLScriptElement) {
          container.appendChild(cloneScript(node));
          continue;
        }

        container.appendChild(node.cloneNode(true));
      }

      document.body.appendChild(container);
      trackSocialBarLoaded({ pageType: "other" }, { provider: "adsterra" });
    } catch (error) {
      container.remove();
      trackSocialBarLoadFailed(
        { pageType: "other" },
        {
          provider: "adsterra",
          reason: error instanceof Error ? error.message.slice(0, 120) : "inject_failed",
        }
      );
      return;
    }

    return () => {
      container.remove();
    };
  }, [snippet]);

  return null;
}
