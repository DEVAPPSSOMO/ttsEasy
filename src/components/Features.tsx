interface FeatureItem {
  title: string;
  description: string;
}

interface FeaturesProps {
  title: string;
  items: FeatureItem[];
}

export function Features({ title, items }: FeaturesProps): JSX.Element {
  return (
    <section className="features-section">
      <h2>{title}</h2>
      <div className="features-grid">
        {items.map((item) => (
          <div className="feature-card" key={item.title}>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
