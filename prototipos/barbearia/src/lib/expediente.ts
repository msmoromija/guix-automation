import type { DiaSemana, Expediente } from "@/content/site.types";

const DIAS: DiaSemana[] = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];

/** Parses YYYY-MM-DD as a local date (never new Date("YYYY-MM-DD")). */
export function parseLocalDate(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

export function diaSemana(value: string): DiaSemana | null {
  const d = parseLocalDate(value);
  return d ? DIAS[d.getDay()] : null;
}

/** Returns the slots for that date, or null when closed / invalid. */
export function intervalosDoDia(expediente: Expediente[], value: string): string[] | null {
  const dia = diaSemana(value);
  if (!dia) return null;
  return expediente.find((e) => e.dia === dia)?.intervalos ?? null;
}

export function hojeLocal(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function formatarData(value: string): string {
  const d = parseLocalDate(value);
  if (!d) return value;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
}
