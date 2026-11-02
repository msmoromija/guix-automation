import type { DiaSemana, Expediente } from "@/content/site.types";

const DIAS: DiaSemana[] = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];

/** Builds a local date from YYYY-MM-DD without timezone shift. */
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
  const e = expediente.find((x) => x.dia === dia);
  return e ? e.intervalos : null;
}

export function hojeLocalISO(now: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
}

export function formatarDataBR(value: string): string {
  const d = parseLocalDate(value);
  if (!d) return value;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
}
