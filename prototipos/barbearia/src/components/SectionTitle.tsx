export function SectionTitle({ field, title, subField, sub }: { field: string; title: string; subField?: string; sub?: string }) {
  return (
    <div className="mb-8 max-w-2xl eyebrow-line">
      <h2 data-field={field} className="text-3xl font-bold md:text-5xl">{title}</h2>
      {sub ? <p data-field={subField} className="mt-3 text-text-muted">{sub}</p> : null}
    </div>
  );
}
