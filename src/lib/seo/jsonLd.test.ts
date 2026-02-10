import { describe, expect, it } from "vitest";
import {
  webApplicationJsonLd,
  faqJsonLd,
  breadcrumbJsonLd,
  articleJsonLd,
} from "./jsonLd";

describe("JSON-LD helpers", () => {
  describe("webApplicationJsonLd", () => {
    it("returns valid WebApplication schema", () => {
      const result = webApplicationJsonLd("en");

      expect(result["@context"]).toBe("https://schema.org");
      expect(result["@type"]).toBe("WebApplication");
      expect(result.name).toBe("TTS Easy");
      expect(result.url).toContain("/en");
      expect(result.applicationCategory).toBe("UtilityApplication");
      expect(result.offers["@type"]).toBe("Offer");
      expect(result.offers.price).toBe("0");
    });

    it("includes locale in url", () => {
      expect(webApplicationJsonLd("es").url).toContain("/es");
      expect(webApplicationJsonLd("fr").url).toContain("/fr");
    });

    it("produces valid JSON", () => {
      const json = JSON.stringify(webApplicationJsonLd("en"));
      expect(() => JSON.parse(json)).not.toThrow();
    });
  });

  describe("faqJsonLd", () => {
    const items = [
      { question: "Is it free?", answer: "Yes." },
      { question: "How does it work?", answer: "Paste text and click play." },
    ];

    it("returns valid FAQPage schema", () => {
      const result = faqJsonLd(items);

      expect(result["@context"]).toBe("https://schema.org");
      expect(result["@type"]).toBe("FAQPage");
      expect(result.mainEntity).toHaveLength(2);
    });

    it("maps questions to Question schema with AcceptedAnswer", () => {
      const result = faqJsonLd(items);

      expect(result.mainEntity[0]["@type"]).toBe("Question");
      expect(result.mainEntity[0].name).toBe("Is it free?");
      expect(result.mainEntity[0].acceptedAnswer["@type"]).toBe("Answer");
      expect(result.mainEntity[0].acceptedAnswer.text).toBe("Yes.");
    });

    it("handles empty array", () => {
      const result = faqJsonLd([]);
      expect(result.mainEntity).toHaveLength(0);
    });
  });

  describe("breadcrumbJsonLd", () => {
    it("returns valid BreadcrumbList schema", () => {
      const crumbs = [
        { name: "Home", url: "https://ttseasy.com/en" },
        { name: "Blog", url: "https://ttseasy.com/en/blog" },
      ];
      const result = breadcrumbJsonLd(crumbs);

      expect(result["@context"]).toBe("https://schema.org");
      expect(result["@type"]).toBe("BreadcrumbList");
      expect(result.itemListElement).toHaveLength(2);
    });

    it("assigns sequential positions starting from 1", () => {
      const crumbs = [
        { name: "A", url: "https://example.com/a" },
        { name: "B", url: "https://example.com/b" },
        { name: "C", url: "https://example.com/c" },
      ];
      const result = breadcrumbJsonLd(crumbs);

      expect(result.itemListElement[0].position).toBe(1);
      expect(result.itemListElement[1].position).toBe(2);
      expect(result.itemListElement[2].position).toBe(3);
    });

    it("uses ListItem type for each element", () => {
      const result = breadcrumbJsonLd([{ name: "X", url: "https://x.com" }]);
      expect(result.itemListElement[0]["@type"]).toBe("ListItem");
    });
  });

  describe("articleJsonLd", () => {
    it("returns valid Article schema", () => {
      const result = articleJsonLd({
        title: "Test Article",
        description: "A test description",
        url: "https://ttseasy.com/en/blog/test",
        publishedTime: "2025-01-15",
      });

      expect(result["@context"]).toBe("https://schema.org");
      expect(result["@type"]).toBe("Article");
      expect(result.headline).toBe("Test Article");
      expect(result.description).toBe("A test description");
      expect(result.datePublished).toBe("2025-01-15");
    });

    it("defaults dateModified to publishedTime when not provided", () => {
      const result = articleJsonLd({
        title: "T",
        description: "D",
        url: "https://x.com",
        publishedTime: "2025-01-01",
      });

      expect(result.dateModified).toBe("2025-01-01");
    });

    it("uses provided dateModified when given", () => {
      const result = articleJsonLd({
        title: "T",
        description: "D",
        url: "https://x.com",
        publishedTime: "2025-01-01",
        modifiedTime: "2025-06-01",
      });

      expect(result.dateModified).toBe("2025-06-01");
    });

    it("defaults author to TTS Easy", () => {
      const result = articleJsonLd({
        title: "T",
        description: "D",
        url: "https://x.com",
        publishedTime: "2025-01-01",
      });

      expect(result.author.name).toBe("TTS Easy");
    });

    it("uses custom author when provided", () => {
      const result = articleJsonLd({
        title: "T",
        description: "D",
        url: "https://x.com",
        publishedTime: "2025-01-01",
        author: "Custom Author",
      });

      expect(result.author.name).toBe("Custom Author");
    });

    it("includes publisher", () => {
      const result = articleJsonLd({
        title: "T",
        description: "D",
        url: "https://x.com",
        publishedTime: "2025-01-01",
      });

      expect(result.publisher["@type"]).toBe("Organization");
      expect(result.publisher.name).toBe("TTS Easy");
    });
  });
});
