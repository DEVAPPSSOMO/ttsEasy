import Link from "next/link";
import { getAllPosts } from "@/lib/blog";

interface FeaturedPostsProps {
  description: string;
  title: string;
}

export function FeaturedPosts({ description, title }: FeaturedPostsProps): JSX.Element | null {
  const posts = getAllPosts("en").slice(0, 3);

  if (posts.length === 0) return null;

  return (
    <section className="featured-posts">
      <div className="section-heading">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>

      <div className="featured-posts-grid">
        {posts.map((post) => (
          <article className="featured-post-card" key={post.slug}>
            <div className="featured-post-meta">
              <span>{post.date}</span>
              <span>{post.readingTime}</span>
            </div>
            <h3>
              <Link href={`/en/blog/${post.slug}`}>{post.title}</Link>
            </h3>
            <p>{post.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
