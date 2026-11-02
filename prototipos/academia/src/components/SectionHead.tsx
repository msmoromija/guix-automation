export function SectionHead({ titulo, field, subtitulo, subField }: { titulo: string; field: string; subtitulo?: string; subField?: string }) {
  return (
    <div className="mb-10 max-w-2xl">
      <div className="mb-4 h-1 w-10 bg-lime" />
      <h2 data-field={field} className="text-5xl font-bold">{titulo}</h2>
      {subtitulo !== undefined && subtitulo !== "" && (
        <p data-field={subField} className="mt-4 text-ink-muted">{subtitulo}</p>
      )}
    </div>
  );
}
