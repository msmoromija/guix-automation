export type DiaSemana = "dom" | "seg" | "ter" | "qua" | "qui" | "sex" | "sab";

export type DiaExpediente = {
  dia: DiaSemana;
  label: string;
  aberto: boolean;
  inicio: string;
  fim: string;
};

export type NotaAgenda = {
  titulo: string;
  descricao: string;
  dataLabel: string;
};

export const DIAS_SEMANA: { dia: DiaSemana; label: string; curto: string }[] = [
  { dia: "seg", label: "Segunda", curto: "Seg" },
  { dia: "ter", label: "Terça", curto: "Ter" },
  { dia: "qua", label: "Quarta", curto: "Qua" },
  { dia: "qui", label: "Quinta", curto: "Qui" },
  { dia: "sex", label: "Sexta", curto: "Sex" },
  { dia: "sab", label: "Sábado", curto: "Sáb" },
  { dia: "dom", label: "Domingo", curto: "Dom" },
];

export function expedientePadrao(): DiaExpediente[] {
  return DIAS_SEMANA.map((d) => ({
    dia: d.dia,
    label: d.label,
    aberto: d.dia !== "dom" && d.dia !== "sab",
    inicio: "09:00",
    fim: "18:00",
  }));
}

function horaParaMin(h: string) {
  const m = h.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!m) return 9 * 60;
  return Number(m[1]) * 60 + Number(m[2]);
}

function minParaHora(n: number) {
  const h = Math.floor(n / 60);
  const m = n % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function intervalosEntre(inicio: string, fim: string) {
  const a = horaParaMin(inicio);
  const b = horaParaMin(fim);
  if (b <= a) return [inicio];
  const out: string[] = [];
  for (let t = a; t < b; t += 60) out.push(minParaHora(t));
  return out.length ? out : [inicio];
}

export function expedienteParaSchema(dias: DiaExpediente[]) {
  const lista = dias
    .filter((d) => d.aberto)
    .slice(0, 7)
    .map((d) => ({
      dia: d.dia,
      label: d.label,
      intervalos: intervalosEntre(d.inicio, d.fim),
    }));
  return lista.length
    ? lista
    : [{ dia: "seg" as const, label: "Segunda", intervalos: intervalosEntre("09:00", "18:00") }];
}

export function resumoDoExpediente(dias: DiaExpediente[]) {
  const abertos = dias.filter((d) => d.aberto);
  if (!abertos.length) return "Horário a combinar";
  const fmt = (h: string) => h.replace(/^0/, "").replace(":00", "h");
  const mesmos =
    abertos.length > 1 &&
    abertos.every((d) => d.inicio === abertos[0].inicio && d.fim === abertos[0].fim);
  if (mesmos && abertos.length >= 3) {
    return `${abertos[0].label} a ${abertos[abertos.length - 1].label}, ${fmt(abertos[0].inicio)} às ${fmt(abertos[0].fim)}`;
  }
  return abertos
    .map((d) => {
      const curto = DIAS_SEMANA.find((x) => x.dia === d.dia)?.curto || d.label.slice(0, 3);
      return `${curto} ${fmt(d.inicio)}–${fmt(d.fim)}`;
    })
    .join(" · ")
    .slice(0, 160);
}

export function diaDaDataISO(iso: string): DiaSemana | "" {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
  const [y, m, d] = iso.split("-").map(Number);
  const js = new Date(y, m - 1, d).getDay();
  return (["dom", "seg", "ter", "qua", "qui", "sex", "sab"] as DiaSemana[])[js] || "";
}

export function intervalosDoDia(expediente: { dia: string; intervalos: string[] }[], iso: string) {
  const dia = diaDaDataISO(iso);
  if (!dia) return null;
  const item = expediente.find((e) => e.dia === dia);
  return item?.intervalos?.length ? item.intervalos : null;
}
