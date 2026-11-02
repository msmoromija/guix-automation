import type { DiaExpediente } from "@/content/site.types";

const DIAS = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"] as const;

/** Parse YYYY-MM-DD as a local date (never new Date("YYYY-MM-DD")). */
export function parseLocalDate(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

export function todayIso(now: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
}

export function diaDaSemana(value: string): string | null {
  const d = parseLocalDate(value);
  return d ? DIAS[d.getDay()] : null;
}

export function intervalosDoDia(expediente: DiaExpediente[], value: string): string[] | null {
  const dia = diaDaSemana(value);
  if (!dia) return null;
  const found = expediente.find((e) => e.dia === dia);
  return found ? found.intervalos : null;
}

export function formatBr(value: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : value;
}
