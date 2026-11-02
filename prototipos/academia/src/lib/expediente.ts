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

export function expedienteDoDia(value: string, expediente: Expediente[]): Expediente | null {
  const dia = diaSemana(value);
  if (!dia) return null;
  return expediente.find((e) => e.dia === dia) ?? null;
}

export function todayLocal(now: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
}

export function formatBr(value: string): string {
  const [y, m, d] = value.split("-");
  return `${d}/${m}/${y}`;
}
