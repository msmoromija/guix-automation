import { useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { site } from "@/content";
import { Seo } from "@/components/Seo";
import { intervalosDoDia, todayLocalIso } from "@/lib/expediente";
import { saveLead } from "@/lib/lead";

export const SEM_PREFERENCIA_ID = "qualquer";

export function AgendarPage({ servico, profissional }: { servico?: string; profissional?: string }) {
  const { agendamento: a, servicos, profissionais, empresa } = site;
  const navigate = useNavigate();
  const [servicoId, setServicoId] = useState(servicos.itens.some((s) => s.id === servico) ? servico! : "");
  const [profId, setProfId] = useState(
    profissional && (profissional === SEM_PREFERENCIA_ID || profissionais.itens.some((p) => p.id === profissional)) ? profissional : "",
  );
  const [data, setData] = useState("");
  const [horario, setHorario] = useState("");
  const [erro, setErro] = useState(false);
  const hoje = useMemo(() => todayLocalIso(), []);
  const slots = data ? intervalosDoDia(empresa.expediente, data) : null;

  const profOpcoes = [
    { id: SEM_PREFERENCIA_ID, label: a.sem_preferencia },
    ...profissionais.itens.map((p) => ({ id: p.id, label: p.nome })),
  ];

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const nome = String(fd.get("nome") ?? "").trim();
    const telefone = String(fd.get("telefone") ?? "").trim();
    const observacao = String(fd.get("observacao") ?? "").trim();
    const horarioOk = !!slots && slots.includes(horario);
    if (!servicoId || !profId || !data || !horarioOk || !nome || !telefone) return setErro(true);
    saveLead({ tipo: "agendamento", servico_id: servicoId, profissional_id: profId, data, horario, nome, telefone, email: "", mensagem: observacao });
    navigate({ to: "/obrigado" });
  }

  const chip = (ativo: boolean) =>
    `rounded-[var(--radius)] border px-4 py-3 text-left text-sm transition-colors ${ativo ? "border-accent bg-accent text-background" : "border-border bg-card text-primary hover:border-secondary"}`;
  const grupo = "rounded-[var(--radius)] border border-border bg-card p-5";
  const legenda = "mb-3 font-[family-name:var(--font-heading)] text-lg font-semibold text-primary";

  return (
    <section className="py-12 md:py-16">
      <Seo title={a.titulo} />
      <div className="mx-auto max-w-2xl px-4">
        <span className="eyebrow-rule" />
        <h1 data-field="agendamento.titulo" className="text-3xl font-semibold md:text-4xl">{a.titulo}</h1>
        <p data-field="agendamento.subtitulo" className="mt-3 text-muted-foreground">{a.subtitulo}</p>

        <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
          <fieldset className={grupo}>
            <legend className={legenda} data-field="agendamento.passo_servico">{a.passo_servico}</legend>
            <select name="servico_id" value={servicoId} onChange={(e) => setServicoId(e.target.value)} className="field">
              <option value="" disabled>{a.passo_servico}</option>
              {servicos.itens.map((s) => (
                <option key={s.id} value={s.id}>{s.nome} · {s.preco_label} · {s.duracao_label}</option>
              ))}
            </select>
          </fieldset>

          <fieldset className={grupo}>
            <legend className={legenda} data-field="agendamento.passo_profissional">{a.passo_profissional}</legend>
            <input type="hidden" name="profissional_id" value={profId} />
            <div className="grid gap-2 sm:grid-cols-2">
              {profOpcoes.map((p) => (
                <button key={p.id} type="button" aria-pressed={profId === p.id} onClick={() => setProfId(p.id)} className={chip(profId === p.id)}>
                  {p.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className={grupo}>
            <legend className={legenda} data-field="agendamento.passo_data">{a.passo_data}</legend>
            <input type="date" name="data" min={hoje} value={data} onChange={(e) => { setData(e.target.value); setHorario(""); }} className="field" />
          </fieldset>

          <fieldset className={grupo}>
            <legend className={legenda} data-field="agendamento.passo_horario">{a.passo_horario}</legend>
            <input type="hidden" name="horario" value={horario} />
            {data && slots === null && <p data-field="agendamento.fechado" className="text-sm text-muted-foreground">{a.fechado}</p>}
            {slots && (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {slots.map((h) => (
                  <button key={h} type="button" aria-pressed={horario === h} onClick={() => setHorario(h)} className={`${chip(horario === h)} text-center`}>{h}</button>
                ))}
              </div>
            )}
          </fieldset>

          <fieldset className={grupo}>
            <legend className={legenda} data-field="agendamento.passo_dados">{a.passo_dados}</legend>
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-primary">{a.label_nome}<input name="nome" required autoComplete="name" className="field mt-1 font-normal" /></label>
              <label className="block text-sm font-semibold text-primary">{a.label_telefone}<input name="telefone" type="tel" required autoComplete="tel" className="field mt-1 font-normal" /></label>
              <label className="block text-sm font-semibold text-primary">{a.label_observacao}<textarea name="observacao" rows={3} placeholder={a.placeholder_observacao} className="field mt-1 font-normal" /></label>
            </div>
          </fieldset>

          {erro && <p role="alert" data-field="agendamento.erro_campos" className="text-sm text-destructive">{a.erro_campos}</p>}
          <button type="submit" data-action="confirmar_agendamento" data-field="agendamento.botao_confirmar" className="btn-primary w-full">{a.botao_confirmar}</button>
        </form>
      </div>
    </section>
  );
}
