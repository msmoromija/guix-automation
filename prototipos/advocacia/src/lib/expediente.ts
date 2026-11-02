import type { DiaKey, Expediente } from "@/content/site.types";

const DIAS: DiaKey[] = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];

export function parseLocalDate(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

export function diaKey(value: string): DiaKey | null {
  const d = parseLocalDate(value);
  return d ? DIAS[d.getDay()] : null;
}

/** Returns the day's entry, or null when the office is closed that day. */
export function expedienteDoDia(value: string, expediente: Expediente[]): Expediente | null {
  const key = diaKey(value);
  if (!key) return null;
  return expediente.find((e) => e.dia === key) ?? null;
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
