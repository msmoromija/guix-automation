const traco = {
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export type NomeIcone =
  | "dominio"
  | "email"
  | "site"
  | "agenda"
  | "whatsapp"
  | "check"
  | "equipe"
  | "pagamento"
  | "chave"
  | "relogio";

export function Icone({
  nome,
  className = "h-6 w-6",
}: {
  nome: NomeIcone;
  className?: string;
}) {
  if (nome === "relogio") {
    return (
      <svg viewBox="0 0 24 24" className={`icone-relogio ${className}`} aria-hidden="true" {...traco}>
        <circle cx="12" cy="12" r="9" />
        <g className="icone-relogio-hora">
          <path d="M12 12V7.5" />
        </g>
        <g className="icone-relogio-minuto">
          <path d="M12 12l4.2 2.4" />
        </g>
        <circle cx="12" cy="12" r="0.9" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...traco}>
      {nome === "dominio" ? (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18" />
          <path d="M12 3c2.4 2.7 3.6 5.7 3.6 9s-1.2 6.3-3.6 9c-2.4-2.7-3.6-5.7-3.6-9s1.2-6.3 3.6-9z" />
        </>
      ) : null}
      {nome === "email" ? (
        <>
          <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
          <path d="M4 7l8 6 8-6" />
        </>
      ) : null}
      {nome === "site" ? (
        <>
          <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
          <path d="M3.5 8.5h17" />
          <path d="M8 12.5h8M8 16h5" />
        </>
      ) : null}
      {nome === "agenda" ? (
        <>
          <rect x="4" y="5" width="16" height="15" rx="2" />
          <path d="M8 3.5v3M16 3.5v3M4 9.5h16" />
        </>
      ) : null}
      {nome === "whatsapp" ? (
        <>
          <path d="M6 18.5l.8-2.8A7 7 0 1 1 8.6 17L6 18.5z" />
          <path d="M9.2 10.2c.2-.4.4-.4.6-.4h.5c.2 0 .4 0 .5.4.2.5.6 1.6.6 1.7.1.2 0 .3-.1.5l-.3.4c-.1.1-.2.3 0 .5.2.3.8 1.2 1.7 1.6.2.1.4.1.5-.1l.4-.5c.1-.2.3-.1.5-.1.1 0 1.2.6 1.4.7.2.1.3.2.3.4.1.5-.2 1.4-.7 1.6-.4.2-1 .3-1.7.1-1.5-.4-3.4-1.6-4.5-3.5-.8-1.4-.9-2.5-.7-3.1z" />
        </>
      ) : null}
      {nome === "check" ? <path d="M5 12.5l4.2 4.2L19 7.5" /> : null}
      {nome === "equipe" ? (
        <>
          <circle cx="9" cy="8.5" r="2.4" />
          <path d="M4.5 18.5c.4-3 2.2-4.5 4.5-4.5s4.1 1.5 4.5 4.5" />
          <circle cx="16.2" cy="9.2" r="2" />
          <path d="M13.2 18.5c.3-2.2 1.5-3.4 3-3.4 1.6 0 2.9 1.2 3.3 3.4" />
        </>
      ) : null}
      {nome === "pagamento" ? (
        <>
          <rect x="3.5" y="6" width="17" height="12" rx="2" />
          <path d="M3.5 10h17" />
          <path d="M7 14.5h4" />
        </>
      ) : null}
      {nome === "chave" ? (
        <>
          <circle cx="8.5" cy="12" r="3.2" />
          <path d="M11.2 12H20v2.2" />
          <path d="M16.5 12v2.2M18.8 12v2.2" />
        </>
      ) : null}
    </svg>
  );
}
