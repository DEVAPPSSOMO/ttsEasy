import { describe, expect, it } from "vitest";
import { getAllPosts, getPostBySlug, getPostSlugs } from "./blog";

describe("blog", () => {
  describe("getAllPosts", () => {
    it("returns English blog posts sorted by date descending", () => {
      const posts = getAllPosts("en");

      expect(posts.length).toBeGreaterThanOrEqual(3);

      // sorted descending by date
      for (let i = 1; i < posts.length; i++) {
        expect(posts[i - 1].date >= posts[i].date).toBe(true);
      }
    });

    it("returns Spanish blog posts", () => {
      const posts = getAllPosts("es");
      expect(posts.length).toBeGreaterThanOrEqual(3);
    });

    it("returns empty array for locale without posts", () => {
      const posts = getAllPosts("fr");
      expect(posts).toEqual([]);
    });

    it("each post has required fields", () => {
      const posts = getAllPosts("en");
      for (const post of posts) {
        expect(typeof post.slug).toBe("string");
        expect(post.slug.length).toBeGreaterThan(0);
        expect(typeof post.title).toBe("string");
        expect(post.title.length).toBeGreaterThan(0);
        expect(typeof post.description).toBe("string");
        expect(post.description.length).toBeGreaterThan(0);
        expect(typeof post.date).toBe("string");
        expect(post.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(typeof post.readingTime).toBe("string");
        expect(post.readingTime).toMatch(/\d+ min read/);
        expect(post.locale).toBe("en");
      }
    });
  });

  describe("getPostBySlug", () => {
    it("returns a known English post with content", () => {
      const post = getPostBySlug("en", "complete-guide-text-to-speech");

      expect(post).not.toBeNull();
      expect(post!.slug).toBe("complete-guide-text-to-speech");
      expect(post!.title).toContain("Text to Speech");
      expect(post!.content.length).toBeGreaterThan(100);
      expect(post!.locale).toBe("en");
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
      const slugs = getPostSlugs("en");

      expect(slugs.length).toBeGreaterThanOrEqual(3);
      for (const slug of slugs) {
        expect(typeof slug).toBe("string");
        expect(slug).not.toContain(".mdx");
        expect(slug.length).toBeGreaterThan(0);
      }
    });

    it("returns slug strings for Spanish posts", () => {
      const slugs = getPostSlugs("es");
      expect(slugs.length).toBeGreaterThanOrEqual(3);
    });

    it("returns empty array for locale without posts", () => {
      expect(getPostSlugs("de")).toEqual([]);
    });

    it("slugs match getAllPosts slugs", () => {
      const slugs = getPostSlugs("en");
      const posts = getAllPosts("en");
      const postSlugs = posts.map((p) => p.slug).sort();
      expect(slugs.sort()).toEqual(postSlugs);
    });
  });
});
