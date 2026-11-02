import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { site } from "@/content/site";
import { Layout } from "@/components/Layout";
import { Seo } from "@/components/Seo";
import { hojeLocal, intervalosDoDia } from "@/lib/expediente";
import { saveLead } from "@/lib/lead";

const QUALQUER = "qualquer";

function Grupo({ n, titulo, field, children }: { n: number; titulo: string; field: string; children: ReactNode }) {
  return (
    <fieldset className="rounded-brand border bg-surface p-4 md:p-5">
      <legend className="px-1 font-heading text-lg uppercase tracking-wide">
        <span className="mr-2 text-secondary">{String(n).padStart(2, "0")}</span>
        <span data-field={field}>{titulo}</span>
      </legend>
      {children}
    </fieldset>
  );
}

export function AgendarPage({ servico, profissional }: { servico?: string; profissional?: string }) {
  const a = site.agendamento;
  const navigate = useNavigate();
  const initServ = site.servicos.itens.some((s) => s.id === servico) ? servico! : "";
  const initPro = site.profissionais.itens.some((p) => p.id === profissional) ? profissional! : QUALQUER;

  const [servicoId, setServicoId] = useState(initServ);
  const [profissionalId, setProfissionalId] = useState(initPro);
  const [data, setData] = useState("");
  const [horario, setHorario] = useState("");
  const [min, setMin] = useState("");
  const [erro, setErro] = useState(false);

  useEffect(() => setMin(hojeLocal()), []);
  useEffect(() => setServicoId(initServ), [initServ]);
  useEffect(() => setProfissionalId(initPro), [initPro]);

  const intervalos = data ? intervalosDoDia(site.empresa.expediente, data) : null;
  const profs = [{ id: QUALQUER, nome: a.sem_preferencia }, ...site.profissionais.itens];

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    const nome = String(d.get("nome") ?? "").trim();
    const telefone = String(d.get("telefone") ?? "").trim();
    const observacao = String(d.get("observacao") ?? "").trim();
    if (!servicoId || !profissionalId || !data || !horario || !intervalos?.includes(horario) || !nome || !telefone) {
      setErro(true);
      return;
    }
    saveLead({ tipo: "agendamento", servico_id: servicoId, profissional_id: profissionalId, data, horario, nome, telefone, email: "", mensagem: observacao });
    navigate({ to: "/obrigado" });
  };

  return (
    <Layout>
      <Seo title={a.titulo} />
      <section className="mx-auto max-w-3xl px-4 py-10 md:py-16">
        <h1 data-field="agendamento.titulo" className="text-4xl font-bold md:text-5xl">{a.titulo}</h1>
        <p data-field="agendamento.subtitulo" className="mt-3 text-text-muted">{a.subtitulo}</p>

        <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
          <input type="hidden" name="servico_id" value={servicoId} />
          <input type="hidden" name="profissional_id" value={profissionalId} />
          <input type="hidden" name="horario" value={horario} />

          <Grupo n={1} titulo={a.passo_servico} field="agendamento.passo_servico">
            <div className="grid gap-2 sm:grid-cols-2">
              {site.servicos.itens.map((s) => (
                <button key={s.id} type="button" aria-pressed={servicoId === s.id} onClick={() => setServicoId(s.id)} className="chip flex items-center justify-between gap-3">
                  <span>{s.nome}<span className="block text-xs text-text-muted">{s.duracao_label}</span></span>
                  <span className="font-heading text-accent">{s.preco_label}</span>
                </button>
              ))}
            </div>
          </Grupo>

          <Grupo n={2} titulo={a.passo_profissional} field="agendamento.passo_profissional">
            <div className="grid gap-2 sm:grid-cols-2">
              {profs.map((p) => (
                <button key={p.id} type="button" aria-pressed={profissionalId === p.id} onClick={() => setProfissionalId(p.id)} className="chip">{p.nome}</button>
              ))}
            </div>
          </Grupo>

          <Grupo n={3} titulo={a.passo_data} field="agendamento.passo_data">
            <input type="date" name="data" min={min || undefined} value={data} onChange={(e) => { setData(e.target.value); setHorario(""); }} className="field" aria-label={a.passo_data} />
          </Grupo>

          <Grupo n={4} titulo={a.passo_horario} field="agendamento.passo_horario">
            {data && !intervalos && <p data-field="agendamento.fechado" className="text-text-muted">{a.fechado}</p>}
            {intervalos && (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {intervalos.map((h) => (
                  <button key={h} type="button" aria-pressed={horario === h} onClick={() => setHorario(h)} className="chip text-center">{h}</button>
                ))}
              </div>
            )}
          </Grupo>

          <Grupo n={5} titulo={a.passo_dados} field="agendamento.passo_dados">
            <div className="space-y-4">
              <label className="block text-sm"><span data-field="agendamento.label_nome">{a.label_nome}</span><input name="nome" required className="field mt-1" autoComplete="name" /></label>
              <label className="block text-sm"><span data-field="agendamento.label_telefone">{a.label_telefone}</span><input name="telefone" type="tel" required className="field mt-1" autoComplete="tel" /></label>
              <label className="block text-sm"><span data-field="agendamento.label_observacao">{a.label_observacao}</span><textarea name="observacao" rows={3} placeholder={a.placeholder_observacao} className="field mt-1" /></label>
            </div>
          </Grupo>

          {erro && <p role="alert" data-field="agendamento.erro_campos" className="rounded-brand border border-secondary p-3 text-sm">{a.erro_campos}</p>}
          <button type="submit" data-action="confirmar_agendamento" data-field="agendamento.botao_confirmar" className="btn-primary w-full">{a.botao_confirmar}</button>
        </form>
      </section>
    </Layout>
  );
}
