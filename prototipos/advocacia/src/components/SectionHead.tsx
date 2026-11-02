export function SectionHead({ field, titulo, subtitulo }: { field: string; titulo: string; subtitulo?: string }) {
  return (
    <div className="mb-12 max-w-2xl">
      <h2 data-field={`${field}.titulo`} className="text-4xl leading-tight text-site-primary md:text-5xl">{titulo}</h2>
      {subtitulo ? (
        <p data-field={`${field}.subtitulo`} className="mt-4 text-base leading-relaxed text-site-muted">{subtitulo}</p>
      ) : null}
    </div>
  );
}
