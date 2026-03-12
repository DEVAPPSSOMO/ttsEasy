import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSanitize from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import { LOCALES, type Locale } from "@/lib/i18n/config";

export type EditorialSection = "blog" | "use-case" | "compare";

export interface EditorialSource {
  title: string;
  url: string;
}

export interface EditorialEntrySummary {
  author?: string;
  canonicalGroup: string;
  date?: string;
  description: string;
  indexable: boolean;
  locale: Locale;
  readingTime: string;
  reviewedAt?: string;
  section: EditorialSection;
  slug: string;
  sources: EditorialSource[];
  title: string;
  translationStatus?: string;
  wordCount: number;
}

export interface EditorialEntry extends EditorialEntrySummary {
  contentHtml: string;
  contentMarkdown: string;
}

interface EditorialFrontmatter {
  author?: unknown;
  canonicalGroup?: unknown;
  date?: unknown;
  description?: unknown;
  indexable?: unknown;
  reviewedAt?: unknown;
  sources?: unknown;
  title?: unknown;
  translationStatus?: unknown;
}

const CONTENT_ROOT = path.join(process.cwd(), "content");
const SECTION_DIRS: Record<EditorialSection, string> = {
  blog: "blog",
  compare: "compare",
  "use-case": "use-cases",
};
const MIN_WORDS: Record<EditorialSection, number> = {
  blog: 1200,
  compare: 1200,
  "use-case": 800,
};

const sectionLocaleCache = new Map<string, EditorialEntry[]>();
const sectionAllCache = new Map<EditorialSection, EditorialEntry[]>();

function estimateReadingTime(content: string): string {
  const words = content.split(/\s+/).filter(Boolean).length;
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

function countWords(markdown: string): number {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/\[[^\]]*\]\([^)]+\)/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
}

function parseDate(value: unknown): string | undefined {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined;
}

function parseString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function parseBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function parseSources(value: unknown): EditorialSource[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (typeof item === "string" && item.trim().length > 0) {
      return [{ title: item.trim(), url: item.trim() }];
    }

    if (!item || typeof item !== "object") {
      return [];
    }

    const candidate = item as { title?: unknown; url?: unknown };
    const title = parseString(candidate.title);
    const url = parseString(candidate.url);
    if (!title || !url) {
      return [];
    }
    return [{ title, url }];
  });
}

function validateIndexableEntry(entry: EditorialEntry): void {
  if (!entry.indexable) {
    return;
  }

  const missing: string[] = [];
  if (!entry.author) missing.push("author");
  if (!entry.reviewedAt) missing.push("reviewedAt");
  if (!entry.translationStatus) missing.push("translationStatus");
  if (!entry.canonicalGroup) missing.push("canonicalGroup");
  if (entry.sources.length === 0) missing.push("sources");

  if (missing.length > 0) {
    throw new Error(
      `Indexable ${entry.section} entry ${entry.locale}/${entry.slug} is missing: ${missing.join(", ")}`
    );
  }

  const minWords = MIN_WORDS[entry.section];
  if (entry.wordCount < minWords) {
    throw new Error(
      `Indexable ${entry.section} entry ${entry.locale}/${entry.slug} has ${entry.wordCount} words; minimum is ${minWords}`
    );
  }
}

function parseEntry(section: EditorialSection, locale: Locale, slug: string, raw: string): EditorialEntry {
  const { data, content } = matter(raw);
  const frontmatter = data as EditorialFrontmatter;
  const title = parseString(frontmatter.title) ?? slug;
  const description = parseString(frontmatter.description) ?? "";
  const indexable = parseBoolean(frontmatter.indexable) ?? false;
  const author = parseString(frontmatter.author);
  const reviewedAt = parseDate(frontmatter.reviewedAt);
  const date = parseDate(frontmatter.date);
  const canonicalGroup = parseString(frontmatter.canonicalGroup) ?? slug;
  const translationStatus = parseString(frontmatter.translationStatus);
  const sources = parseSources(frontmatter.sources);
  const wordCount = countWords(content);

  const entry: EditorialEntry = {
    author,
    canonicalGroup,
    contentHtml: markdownToHtml(content),
    contentMarkdown: content,
    date,
    description,
    indexable,
    locale,
    readingTime: estimateReadingTime(content),
    reviewedAt,
    section,
    slug,
    sources,
    title,
    translationStatus,
    wordCount,
  };

  validateIndexableEntry(entry);
  return entry;
}

function getSectionLocaleKey(section: EditorialSection, locale: Locale): string {
  return `${section}:${locale}`;
}

function getSectionDir(section: EditorialSection, locale: Locale): string {
  return path.join(CONTENT_ROOT, SECTION_DIRS[section], locale);
}

function loadSectionLocale(section: EditorialSection, locale: Locale): EditorialEntry[] {
  const cacheKey = getSectionLocaleKey(section, locale);
  const cached = sectionLocaleCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const dir = getSectionDir(section, locale);
  if (!fs.existsSync(dir)) {
    sectionLocaleCache.set(cacheKey, []);
    return [];
  }

  const entries = fs.readdirSync(dir)
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => {
      const slug = file.replace(/\.mdx$/, "");
      const raw = fs.readFileSync(path.join(dir, file), "utf8");
      return parseEntry(section, locale, slug, raw);
    })
    .sort((left, right) => {
      if (left.date && right.date) {
        return left.date > right.date ? -1 : 1;
      }
      return left.title.localeCompare(right.title);
    });

  sectionLocaleCache.set(cacheKey, entries);
  return entries;
}

function loadAllSectionEntries(section: EditorialSection): EditorialEntry[] {
  const cached = sectionAllCache.get(section);
  if (cached) {
    return cached;
  }

  const entries = LOCALES.flatMap((locale) => loadSectionLocale(section, locale));
  sectionAllCache.set(section, entries);
  return entries;
}

export function getEditorialEntries(
  section: EditorialSection,
  locale: Locale,
  options?: { indexableOnly?: boolean }
): EditorialEntrySummary[] {
  const entries = loadSectionLocale(section, locale);
  return options?.indexableOnly ? entries.filter((entry) => entry.indexable) : entries;
}

export function getEditorialEntry(
  section: EditorialSection,
  locale: Locale,
  slug: string
): EditorialEntry | null {
  return loadSectionLocale(section, locale).find((entry) => entry.slug === slug) ?? null;
}

export function getEditorialGroupEntries(
  section: EditorialSection,
  canonicalGroup: string,
  options?: { indexableOnly?: boolean }
): EditorialEntrySummary[] {
  const entries = loadAllSectionEntries(section).filter((entry) => entry.canonicalGroup === canonicalGroup);
  return options?.indexableOnly ? entries.filter((entry) => entry.indexable) : entries;
}

export function getEditorialLocalizedLocales(
  section: EditorialSection,
  canonicalGroup: string,
  options?: { indexableOnly?: boolean }
): Locale[] {
  const entries = getEditorialGroupEntries(section, canonicalGroup, options);
  return LOCALES.filter((locale) => entries.some((entry) => entry.locale === locale));
}

export function getEditorialGroupEntryForLocale(
  section: EditorialSection,
  canonicalGroup: string,
  locale: Locale,
  options?: { indexableOnly?: boolean }
): EditorialEntrySummary | null {
  return (
    getEditorialGroupEntries(section, canonicalGroup, options).find((entry) => entry.locale === locale) ?? null
  );
}
