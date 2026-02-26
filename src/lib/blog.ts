import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSanitize from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import type { Locale } from "@/lib/i18n/config";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  readingTime: string;
  locale: Locale;
}

export interface BlogPostWithContent extends BlogPost {
  contentHtml: string;
}

function estimateReadingTime(content: string): string {
  const words = content.split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

function markdownToHtml(markdown: string): string {
  return String(
    remark()
      .use(remarkGfm)
      .use(remarkRehype)
      .use(rehypeSanitize)
      .use(rehypeStringify)
      .processSync(markdown)
  );
}

export function getAllPosts(locale: Locale): BlogPost[] {
  const dir = path.join(BLOG_DIR, locale);
  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".mdx"));

  return files
    .map((file) => {
      const raw = fs.readFileSync(path.join(dir, file), "utf-8");
      const { data, content } = matter(raw);
      const slug = file.replace(/\.mdx$/, "");

      return {
        slug,
        title: data.title ?? slug,
        description: data.description ?? "",
        date: data.date ?? "",
        readingTime: estimateReadingTime(content),
        locale,
      };
    })
    .sort((a, b) => (a.date > b.date ? -1 : 1));
}

export function getPostBySlug(locale: Locale, slug: string): BlogPostWithContent | null {
  const filePath = path.join(BLOG_DIR, locale, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  return {
    slug,
    title: data.title ?? slug,
    description: data.description ?? "",
    date: data.date ?? "",
    readingTime: estimateReadingTime(content),
    locale,
    contentHtml: markdownToHtml(content),
  };
}

export function getPostSlugs(locale: Locale): string[] {
  const dir = path.join(BLOG_DIR, locale);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx$/, ""));
}
