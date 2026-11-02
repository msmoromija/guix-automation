import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { site } from "@/content/site";
import { Seo } from "@/components/Seo";
import { hojeLocalISO, intervalosDoDia } from "@/lib/expediente";
import { saveLead } from "@/lib/lead";

const QUALQUER = "qualquer";

function Grupo({ n, titulo, field, children }: { n: number; titulo: string; field: string; children: ReactNode }) {
  return (
    <fieldset className="card p-5">
      <legend className="sr-only">{titulo}</legend>
      <p className="mb-4 flex items-center gap-3 font-display text-lg font-bold text-brand">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-sand text-sm">{n}</span>
        <span data-field={field}>{titulo}</span>
      </p>
      {children}
    </fieldset>
  );
}

export function AgendarPage({ servico, profissional }: { servico?: string; profissional?: string }) {
  const a = site.agendamento;
  const navigate = useNavigate();
  const validServico = site.servicos.itens.some((s) => s.id === servico) ? servico! : "";
  const validPro = profissional === QUALQUER || site.profissionais.itens.some((p) => p.id === profissional) ? profissional! : "";

  const [servicoId, setServicoId] = useState(validServico);
  const [proId, setProId] = useState(validPro);
  const [data, setData] = useState("");
  const [horario, setHorario] = useState("");
  const [min, setMin] = useState<string>();
  const [erro, setErro] = useState(false);

  useEffect(() => setMin(hojeLocalISO()), []);
  useEffect(() => setServicoId(validServico), [validServico]);
  useEffect(() => setProId(validPro), [validPro]);

  const intervalos = data ? intervalosDoDia(site.empresa.expediente, data) : null;

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const nome = String(fd.get("nome") ?? "").trim();
    const telefone = String(fd.get("telefone") ?? "").trim();
    const observacao = String(fd.get("observacao") ?? "").trim();
    if (!servicoId || !proId || !data || !horario || !intervalos?.includes(horario) || !nome || !telefone) {
      setErro(true);
      return;
    }
    saveLead({ tipo: "agendamento", servico_id: servicoId, profissional_id: proId, data, horario, nome, telefone, email: "", mensagem: observacao });
    navigate({ to: "/obrigado" });
  }

  const label = "mb-1 block text-sm font-semibold";
  return (
    <div className="mx-auto max-w-2xl px-5 py-10 md:py-16">
      <Seo titulo={a.titulo} />
      <h1 data-field="agendamento.titulo" className="text-3xl font-bold text-brand md:text-5xl">{a.titulo}</h1>
      <p data-field="agendamento.subtitulo" className="mt-3 text-ink-muted">{a.subtitulo}</p>

      <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
        <Grupo n={1} titulo={a.passo_servico} field="agendamento.passo_servico">
          <select name="servico_id" value={servicoId} onChange={(e) => setServicoId(e.target.value)} className="field" aria-label={a.passo_servico}>
            <option value="" disabled>{a.passo_servico}</option>
            {site.servicos.itens.map((s) => (
              <option key={s.id} value={s.id}>{s.nome} · {s.preco_label} · {s.duracao_label}</option>
            ))}
          </select>
        </Grupo>

        <Grupo n={2} titulo={a.passo_profissional} field="agendamento.passo_profissional">
          <select name="profissional_id" value={proId} onChange={(e) => setProId(e.target.value)} className="field" aria-label={a.passo_profissional}>
            <option value="" disabled>{a.passo_profissional}</option>
            <option value={QUALQUER}>{a.sem_preferencia}</option>
            {site.profissionais.itens.map((p) => (
              <option key={p.id} value={p.id}>{p.nome} · {p.cargo}</option>
            ))}
          </select>
        </Grupo>

        <Grupo n={3} titulo={a.passo_data} field="agendamento.passo_data">
          <input type="date" name="data" min={min} value={data} onChange={(e) => { setData(e.target.value); setHorario(""); }} className="field" aria-label={a.passo_data} />
        </Grupo>

        <Grupo n={4} titulo={a.passo_horario} field="agendamento.passo_horario">
          {data && intervalos === null && <p data-field="agendamento.fechado" className="font-semibold text-terra">{a.fechado}</p>}
          {intervalos && (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {intervalos.map((h) => (
                <label key={h} className={`cursor-pointer rounded-site border-2 py-3 text-center font-bold transition ${horario === h ? "border-brand bg-sand text-brand" : "border-transparent bg-page text-ink"}`}>
                  <input type="radio" name="horario" value={h} checked={horario === h} onChange={() => setHorario(h)} className="sr-only" />
                  {h}
                </label>
              ))}
            </div>
          )}
          {!data && <p className="text-sm text-ink-muted" data-field="empresa.horario_resumo">{site.empresa.horario_resumo}</p>}
        </Grupo>

        <Grupo n={5} titulo={a.passo_dados} field="agendamento.passo_dados">
          <div className="space-y-4">
            <label className="block"><span data-field="agendamento.label_nome" className={label}>{a.label_nome}</span><input name="nome" required className="field" /></label>
            <label className="block"><span data-field="agendamento.label_telefone" className={label}>{a.label_telefone}</span><input name="telefone" type="tel" required className="field" /></label>
            <label className="block"><span data-field="agendamento.label_observacao" className={label}>{a.label_observacao}</span><textarea name="observacao" rows={3} placeholder={a.placeholder_observacao} className="field" /></label>
          </div>
        </Grupo>

        {erro && <p role="alert" data-field="agendamento.erro_campos" className="rounded-site border-2 border-terra bg-surface p-4 font-semibold text-terra">{a.erro_campos}</p>}
        <button type="submit" data-action="confirmar_agendamento" data-field="agendamento.botao_confirmar" className="btn-primary w-full">{a.botao_confirmar}</button>
      </form>
    </div>
  );
}
