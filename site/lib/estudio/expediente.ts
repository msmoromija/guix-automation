export type DiaSemana = "dom" | "seg" | "ter" | "qua" | "qui" | "sex" | "sab";

export type DiaExpediente = {
  dia: DiaSemana;
  label: string;
  aberto: boolean;
  inicio: string;
  fim: string;
  /** Pausa para almoço no meio do expediente. */
  pausa: boolean;
  pausaInicio: string;
  pausaFim: string;
};

export type NotaAgenda = {
  titulo: string;
  descricao: string;
  dataLabel: string;
};

/** Ausência pontual ou intervalo (férias, folga, consulta). */
export type AusenciaPro = {
  de: string;
  ate: string;
  motivo: string;
};

export type GradeProDia = {
  dia: DiaSemana;
  inicio: string;
  fim: string;
  pausa?: boolean;
  pausaInicio?: string;
  pausaFim?: string;
};

export type AgendaProVisual = {
  nome: string;
  dias: GradeProDia[];
  ausencias?: AusenciaPro[];
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

function diaBase(d: (typeof DIAS_SEMANA)[number], aberto: boolean): DiaExpediente {
  return {
    dia: d.dia,
    label: d.label,
    aberto,
    inicio: "09:00",
    fim: "18:00",
    pausa: aberto && d.dia !== "sab" && d.dia !== "dom",
    pausaInicio: "12:00",
    pausaFim: "13:00",
  };
}

export function expedientePadrao(): DiaExpediente[] {
  return DIAS_SEMANA.map((d) => diaBase(d, d.dia !== "dom" && d.dia !== "sab"));
}

export function expedienteProPadrao(): DiaExpediente[] {
  return DIAS_SEMANA.map((d) => diaBase(d, d.dia !== "dom"));
}

/** Garante campos de pausa em grades antigas sem almoço. */
export function normalizarDiaExpediente(d: Partial<DiaExpediente> & { dia: DiaSemana; label?: string }): DiaExpediente {
  const meta = DIAS_SEMANA.find((x) => x.dia === d.dia);
  return {
    dia: d.dia,
    label: d.label || meta?.label || d.dia,
    aberto: Boolean(d.aberto),
    inicio: d.inicio || "09:00",
    fim: d.fim || "18:00",
    pausa: Boolean(d.pausa),
    pausaInicio: d.pausaInicio || "12:00",
    pausaFim: d.pausaFim || "13:00",
  };
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
  if (b <= a) return [];
  const out: string[] = [];
  for (let t = a; t < b; t += 60) out.push(minParaHora(t));
  return out;
}

/** Gera slots de 1h respeitando pausa de almoço. */
export function slotsDoDia(d: Pick<DiaExpediente, "aberto" | "inicio" | "fim" | "pausa" | "pausaInicio" | "pausaFim">) {
  if (!d.aberto) return [];
  if (d.pausa) {
    const manha = intervalosEntre(d.inicio, d.pausaInicio || "12:00");
    const tarde = intervalosEntre(d.pausaFim || "13:00", d.fim);
    const juntos = [...manha, ...tarde];
    return juntos.length ? juntos : intervalosEntre(d.inicio, d.fim);
  }
  const continuo = intervalosEntre(d.inicio, d.fim);
  return continuo.length ? continuo : [d.inicio];
}

export function expedienteParaSchema(dias: DiaExpediente[]) {
  const lista = dias
    .filter((d) => d.aberto)
    .slice(0, 7)
    .map((d) => ({
      dia: d.dia,
      label: d.label,
      intervalos: slotsDoDia(d),
    }))
    .filter((d) => d.intervalos.length);
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
    abertos.every(
      (d) =>
        d.inicio === abertos[0].inicio &&
        d.fim === abertos[0].fim &&
        d.pausa === abertos[0].pausa &&
        (!d.pausa || (d.pausaInicio === abertos[0].pausaInicio && d.pausaFim === abertos[0].pausaFim)),
    );
  if (mesmos && abertos.length >= 3) {
    const base = `${abertos[0].label} a ${abertos[abertos.length - 1].label}, ${fmt(abertos[0].inicio)} às ${fmt(abertos[0].fim)}`;
    if (abertos[0].pausa) {
      return `${base} (almoço ${fmt(abertos[0].pausaInicio)}–${fmt(abertos[0].pausaFim)})`.slice(0, 160);
    }
    return base.slice(0, 160);
  }
  return abertos
    .map((d) => {
      const curto = DIAS_SEMANA.find((x) => x.dia === d.dia)?.curto || d.label.slice(0, 3);
      if (d.pausa) return `${curto} ${fmt(d.inicio)}–${fmt(d.pausaInicio)}/${fmt(d.pausaFim)}–${fmt(d.fim)}`;
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

export function dataEmAusencia(ausencias: AusenciaPro[] | undefined, iso: string) {
  if (!ausencias?.length || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  for (const a of ausencias) {
    const de = a.de || "";
    const ate = a.ate || a.de || "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(de)) continue;
    const fim = /^\d{4}-\d{2}-\d{2}$/.test(ate) ? ate : de;
    if (iso >= de && iso <= fim) return a;
  }
  return null;
}

function horaNaGrade(h: string, grade: GradeProDia) {
  const m = horaParaMin(h);
  const ini = horaParaMin(grade.inicio || "09:00");
  const fim = horaParaMin(grade.fim || "18:00");
  if (m < ini || m >= fim) return false;
  if (grade.pausa) {
    const pIni = horaParaMin(grade.pausaInicio || "12:00");
    const pFim = horaParaMin(grade.pausaFim || "13:00");
    if (m >= pIni && m < pFim) return false;
  }
  return true;
}

/** Cruza expediente da casa com a grade do profissional e bloqueia ausências. */
export function intervalosDoProfissional(
  expedienteCasa: { dia: string; intervalos: string[] }[],
  agenda: AgendaProVisual | undefined,
  iso: string,
): { slots: string[] | null; motivo?: string } {
  const base = intervalosDoDia(expedienteCasa, iso);
  if (!base) return { slots: null, motivo: "A casa não atende neste dia." };
  if (!agenda) return { slots: base };

  const aus = dataEmAusencia(agenda.ausencias, iso);
  if (aus) {
    return { slots: null, motivo: aus.motivo?.trim() || "Profissional ausente neste dia." };
  }

  const dia = diaDaDataISO(iso);
  if (!dia) return { slots: null };
  const grade = (agenda.dias || []).find((d) => d.dia === dia);
  if (!grade) return { slots: null, motivo: "Este profissional não atende neste dia." };

  const lista = base.filter((h) => horaNaGrade(h, grade));
  return lista.length
    ? { slots: lista }
    : { slots: null, motivo: "Sem horário livre com este profissional neste dia." };
}

export function normalizarAgendaPro(raw: {
  nome: string;
  dias?: Array<string | { dia: string; inicio?: string; fim?: string; pausa?: boolean; pausaInicio?: string; pausaFim?: string }>;
  inicio?: string;
  fim?: string;
  ausencias?: AusenciaPro[];
}): AgendaProVisual {
  const inicioPadrao = raw.inicio || "09:00";
  const fimPadrao = raw.fim || "18:00";
  const dias: AgendaProVisual["dias"] = [];
  for (const item of raw.dias || []) {
    if (typeof item === "string") {
      if (["dom", "seg", "ter", "qua", "qui", "sex", "sab"].includes(item)) {
        dias.push({ dia: item as DiaSemana, inicio: inicioPadrao, fim: fimPadrao });
      }
      continue;
    }
    if (item?.dia && ["dom", "seg", "ter", "qua", "qui", "sex", "sab"].includes(item.dia)) {
      dias.push({
        dia: item.dia as DiaSemana,
        inicio: item.inicio || inicioPadrao,
        fim: item.fim || fimPadrao,
        pausa: Boolean(item.pausa),
        pausaInicio: item.pausaInicio || "12:00",
        pausaFim: item.pausaFim || "13:00",
      });
    }
  }
  return {
    nome: raw.nome,
    dias,
    ausencias: (raw.ausencias || []).filter((a) => a.de),
  };
}

export function agendaProParaVisual(nome: string, expediente: DiaExpediente[], ausencias: AusenciaPro[]): AgendaProVisual {
  return {
    nome: nome.trim(),
    dias: expediente
      .filter((d) => d.aberto)
      .map((d) => ({
        dia: d.dia,
        inicio: d.inicio,
        fim: d.fim,
        pausa: d.pausa,
        pausaInicio: d.pausaInicio,
        pausaFim: d.pausaFim,
      })),
    ausencias: ausencias.filter((a) => a.de),
  };
}

export function aplicarAlmocoNosAbertos(dias: DiaExpediente[], ligado: boolean, inicio = "12:00", fim = "13:00"): DiaExpediente[] {
  return dias.map((d) =>
    d.aberto
      ? {
          ...d,
          pausa: ligado,
          pausaInicio: inicio,
          pausaFim: fim,
        }
      : { ...d, pausa: false },
  );
}

/** Espelha horário de abertura/fechamento em todos os dias abertos. */
export function aplicarExpedienteNosAbertos(dias: DiaExpediente[], inicio: string, fim: string): DiaExpediente[] {
  return dias.map((d) => (d.aberto ? { ...d, inicio, fim } : d));
}

export function horarioCompartilhado(dias: DiaExpediente[]) {
  const abertos = dias.filter((d) => d.aberto);
  if (!abertos.length) {
    return { inicio: "09:00", fim: "18:00", pausa: false, pausaInicio: "12:00", pausaFim: "13:00", homogeneo: true };
  }
  const ref = abertos[0];
  const homogeneo = abertos.every(
    (d) =>
      d.inicio === ref.inicio &&
      d.fim === ref.fim &&
      d.pausa === ref.pausa &&
      (!d.pausa || (d.pausaInicio === ref.pausaInicio && d.pausaFim === ref.pausaFim)),
  );
  return {
    inicio: ref.inicio,
    fim: ref.fim,
    pausa: abertos.every((d) => d.pausa),
    pausaInicio: ref.pausaInicio || "12:00",
    pausaFim: ref.pausaFim || "13:00",
    homogeneo,
  };
}
