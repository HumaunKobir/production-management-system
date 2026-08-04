export default function ModuleGuide({ title, items }) {
  return (
    <details className="module-guide card">
      <summary>{title} — what you can do here</summary>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </details>
  );
}
