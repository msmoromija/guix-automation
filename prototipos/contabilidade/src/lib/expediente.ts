import type { Expediente } from "@/content/site.types";

const DIAS = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"] as const;

/** Builds a local date from YYYY-MM-DD without timezone shift. */
export function parseLocalDate(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

export function todayLocalIso(now: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
}

export function diaKey(value: string): string | null {
  const d = parseLocalDate(value);
  return d ? DIAS[d.getDay()] : null;
}

/** Returns the slots for that date, or null when the office is closed. */
export function intervalosDoDia(expediente: Expediente[], value: string): string[] | null {
  const key = diaKey(value);
  if (!key) return null;
  return expediente.find((e) => e.dia === key)?.intervalos ?? null;
}

export function formatBr(value: string): string {
  const d = parseLocalDate(value);
  if (!d) return value;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
}
