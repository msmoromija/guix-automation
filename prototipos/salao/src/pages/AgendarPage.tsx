import { useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { site } from "@/content";
import { Seo } from "@/components/Seo";
import { intervalosDoDia, todayIso } from "@/lib/expediente";
import { saveLead } from "@/lib/lead";

export const QUALQUER = "qualquer";

export function AgendarPage({ servico, profissional }: { servico?: string; profissional?: string }) {
  const a = site.agendamento;
  const navigate = useNavigate();
  const [servicoId, setServicoId] = useState(site.servicos.itens.some((s) => s.id === servico) ? servico! : "");
  const [profId, setProfId] = useState(site.profissionais.itens.some((p) => p.id === profissional) ? profissional! : QUALQUER);
  const [data, setData] = useState("");
  const [horario, setHorario] = useState("");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [obs, setObs] = useState("");
  const [erro, setErro] = useState(false);
  const min = useMemo(() => todayIso(), []);
  const intervalos = data ? intervalosDoDia(site.empresa.expediente, data) : null;

  const profs = [{ id: QUALQUER, nome: a.sem_preferencia }, ...site.profissionais.itens];

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!servicoId || !profId || !data || !horario || !intervalos?.includes(horario) || !nome.trim() || !telefone.trim()) { setErro(true); return; }
    saveLead({ tipo: "agendamento", servico_id: servicoId, profissional_id: profId, data, horario, nome: nome.trim(), telefone: telefone.trim(), email: "", mensagem: obs.trim() });
    navigate({ to: "/obrigado" });
  }

  const pill = (active: boolean) =>
    `rounded-site min-h-11 px-4 text-sm border transition-colors ${active ? "border-secondary bg-accent text-primary font-semibold" : "border-secondary/30 bg-surface text-text"}`;

  return (
    <section className="mx-auto max-w-2xl px-5 py-12">
      <Seo title={a.titulo} />
      <h1 data-field="agendamento.titulo" className="text-4xl sm:text-5xl">{a.titulo}</h1>
      <p data-field="agendamento.subtitulo" className="mt-3 text-text-muted">{a.subtitulo}</p>
      <form onSubmit={onSubmit} noValidate className="mt-10 space-y-10">
        <fieldset>
          <legend className="mb-3 font-heading text-2xl text-primary">{a.passo_servico}</legend>
          <select name="servico_id" value={servicoId} onChange={(e) => setServicoId(e.target.value)} className="field">
            <option value="">—</option>
            {site.servicos.itens.map((s) => <option key={s.id} value={s.id}>{s.nome} · {s.preco_label} · {s.duracao_label}</option>)}
          </select>
        </fieldset>
        <fieldset>
          <legend className="mb-3 font-heading text-2xl text-primary">{a.passo_profissional}</legend>
          <select name="profissional_id" value={profId} onChange={(e) => setProfId(e.target.value)} className="field">
            {profs.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
        </fieldset>
        <fieldset>
          <legend className="mb-3 font-heading text-2xl text-primary">{a.passo_data}</legend>
          <input type="date" name="data" min={min} value={data} onChange={(e) => { setData(e.target.value); setHorario(""); }} className="field" />
        </fieldset>
        <fieldset>
          <legend className="mb-3 font-heading text-2xl text-primary">{a.passo_horario}</legend>
          <input type="hidden" name="horario" value={horario} />
          {data && intervalos === null && <p data-field="agendamento.fechado" className="text-secondary">{a.fechado}</p>}
          {intervalos && (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {intervalos.map((h) => (
                <button key={h} type="button" aria-pressed={horario === h} onClick={() => setHorario(h)} className={pill(horario === h)}>{h}</button>
              ))}
            </div>
          )}
        </fieldset>
        <fieldset className="space-y-4">
          <legend className="mb-3 font-heading text-2xl text-primary">{a.passo_dados}</legend>
          <label className="block text-sm">{a.label_nome}<input name="nome" value={nome} onChange={(e) => setNome(e.target.value)} required className="field mt-1" /></label>
          <label className="block text-sm">{a.label_telefone}<input name="telefone" type="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} required className="field mt-1" /></label>
          <label className="block text-sm">{a.label_observacao}<textarea name="observacao" rows={3} placeholder={a.placeholder_observacao} value={obs} onChange={(e) => setObs(e.target.value)} className="field mt-1" /></label>
        </fieldset>
        {erro && <p role="alert" data-field="agendamento.erro_campos" className="text-secondary">{a.erro_campos}</p>}
        <button type="submit" data-action="confirmar_agendamento" className="btn-primary w-full">{a.botao_confirmar}</button>
      </form>
    </section>
  );
}
