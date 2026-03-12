import { describe, expect, it } from "vitest";
import { getAllPosts, getPostBySlug, getPostGroupEntries, getPostSlugs } from "./blog";

describe("blog", () => {
  describe("getAllPosts", () => {
    it("returns English blog posts sorted by date descending", () => {
      const posts = getAllPosts("en", { indexableOnly: true });

      expect(posts.length).toBeGreaterThanOrEqual(3);

      // sorted descending by date
      for (let i = 1; i < posts.length; i++) {
        const previous = posts[i - 1]!;
        const current = posts[i]!;
        expect(previous.date! >= current.date!).toBe(true);
      }
    });

    it("returns Spanish blog posts", () => {
      const posts = getAllPosts("es", { indexableOnly: true });
      expect(posts.length).toBeGreaterThanOrEqual(3);
    });

    it("returns French blog posts", () => {
      const posts = getAllPosts("fr", { indexableOnly: true });
      expect(posts.length).toBeGreaterThanOrEqual(3);
    });

    it("each curated post has required editorial fields", () => {
      const posts = getAllPosts("en", { indexableOnly: true });
      for (const post of posts) {
        expect(typeof post.slug).toBe("string");
        expect(post.slug.length).toBeGreaterThan(0);
        expect(typeof post.title).toBe("string");
        expect(post.title.length).toBeGreaterThan(0);
        expect(typeof post.description).toBe("string");
        expect(post.description.length).toBeGreaterThan(0);
        expect(typeof post.date).toBe("string");
        expect(post.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(post.author).toBe("TTS Easy Editorial");
        expect(post.reviewedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(post.indexable).toBe(true);
        expect(post.sources.length).toBeGreaterThan(0);
        expect(post.wordCount).toBeGreaterThanOrEqual(1200);
        expect(typeof post.readingTime).toBe("string");
        expect(post.readingTime).toMatch(/\d+ min read/);
        expect(post.locale).toBe("en");
      }
    });

    it("keeps weaker posts available but non-indexable by default", () => {
      const weakPost = getPostBySlug("en", "best-free-text-to-speech-tools-2025");
      expect(weakPost).not.toBeNull();
      expect(weakPost?.indexable).toBe(false);
    });
  });

  describe("getPostBySlug", () => {
    it("returns a known English post with content", () => {
      const post = getPostBySlug("en", "complete-guide-text-to-speech");

      expect(post).not.toBeNull();
      expect(post!.slug).toBe("complete-guide-text-to-speech");
      expect(post!.title).toContain("Text to Speech");
      expect(post!.contentHtml.length).toBeGreaterThan(100);
      expect(post!.contentHtml).toContain("<h2>");
      expect(post!.contentHtml).toContain("<ul>");
      expect(post!.locale).toBe("en");
      expect(post!.author).toBe("TTS Easy Editorial");
      expect(post!.reviewedAt).toBe("2026-03-11");
      expect(post!.sources.length).toBeGreaterThan(0);
    });

    it("returns a known Spanish post", () => {
      const post = getPostBySlug("es", "guia-completa-texto-a-voz");

      expect(post).not.toBeNull();
      expect(post!.title).toContain("Texto a Voz");
    });

    it("returns null for non-existent slug", () => {
      const post = getPostBySlug("en", "this-post-does-not-exist");
      expect(post).toBeNull();
    });

    it("returns null for existing slug in wrong locale", () => {
      const post = getPostBySlug("fr", "complete-guide-text-to-speech");
      expect(post).toBeNull();
    });
  });

  describe("getPostSlugs", () => {
    it("returns slug strings for English posts", () => {
      const slugs = getPostSlugs("en", { indexableOnly: true });

      expect(slugs.length).toBeGreaterThanOrEqual(3);
      for (const slug of slugs) {
        expect(typeof slug).toBe("string");
        expect(slug).not.toContain(".mdx");
        expect(slug.length).toBeGreaterThan(0);
      }
    });

    it("returns slug strings for Spanish posts", () => {
      const slugs = getPostSlugs("es", { indexableOnly: true });
      expect(slugs.length).toBeGreaterThanOrEqual(3);
    });

    it("returns slug strings for German posts", () => {
      const slugs = getPostSlugs("de", { indexableOnly: true });
      expect(slugs.length).toBeGreaterThanOrEqual(3);
    });

    it("slugs match getAllPosts slugs", () => {
      const slugs = getPostSlugs("en", { indexableOnly: true });
      const posts = getAllPosts("en", { indexableOnly: true });
      const postSlugs = posts.map((p) => p.slug).sort();
      expect(slugs.sort()).toEqual(postSlugs);
    });

    it("groups translated posts by canonical group", () => {
      const entries = getPostGroupEntries("accessibility", { indexableOnly: true });
      expect(entries).toHaveLength(6);
      expect(entries.map((entry) => entry.locale).sort()).toEqual(["de", "en", "es", "fr", "it", "pt"]);
    });
  });
});
