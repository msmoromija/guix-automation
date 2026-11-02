import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { site } from "@/content/site";
import { Seo } from "@/components/Seo";
import { expedienteDoDia, hojeLocal } from "@/lib/expediente";
import { salvarLead } from "@/lib/lead";

const QUALQUER = "qualquer";

function Grupo({ n, titulo, children }: { n: number; titulo: string; children: ReactNode }) {
  return (
    <fieldset className="border-t border-site-line pt-6">
      <legend className="flex items-baseline gap-3">
        <span className="font-heading text-lg text-site-accent">{String(n).padStart(2, "0")}</span>
        <span className="font-heading text-2xl text-site-primary">{titulo}</span>
      </legend>
      <div className="mt-4">{children}</div>
    </fieldset>
  );
}

export function AgendarPage({ servico, profissional }: { servico?: string; profissional?: string }) {
  const a = site.agendamento;
  const navigate = useNavigate();
  const validServ = site.servicos.itens.some((s) => s.id === servico) ? servico! : "";
  const validProf = site.profissionais.itens.some((p) => p.id === profissional) ? profissional! : QUALQUER;

  const [servicoId, setServicoId] = useState(validServ);
  const [profId, setProfId] = useState(validProf);
  const [data, setData] = useState("");
  const [horario, setHorario] = useState("");
  const [min, setMin] = useState<string | undefined>(undefined);
  const [erro, setErro] = useState(false);

  useEffect(() => setMin(hojeLocal()), []);
  useEffect(() => setServicoId(validServ), [validServ]);
  useEffect(() => setProfId(validProf), [validProf]);

  const dia = data ? expedienteDoDia(data, site.empresa.expediente) : null;

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const nome = String(fd.get("nome") ?? "").trim();
    const telefone = String(fd.get("telefone") ?? "").trim();
    const observacao = String(fd.get("observacao") ?? "").trim();
    if (!servicoId || !profId || !data || !dia || !horario || !nome || !telefone) {
      setErro(true);
      return;
    }
    salvarLead({
      tipo: "agendamento", servico_id: servicoId, profissional_id: profId, data, horario,
      nome, telefone, email: "", mensagem: observacao,
    });
    navigate({ to: "/obrigado" });
  }

  const opt = (active: boolean) =>
    `flex min-h-12 w-full items-center justify-between gap-3 border px-4 py-3 text-left transition-colors ${
      active ? "border-site-accent bg-site-accent text-site-bg" : "border-site-line bg-site-surface text-site-text hover:border-site-secondary"
    }`;

  return (
    <section className="mx-auto max-w-2xl px-5 py-14 md:py-20">
      <Seo titulo={a.titulo} />
      <h1 data-field="agendamento.titulo" className="text-4xl text-site-primary md:text-5xl">{a.titulo}</h1>
      <p data-field="agendamento.subtitulo" className="mt-4 leading-relaxed text-site-muted">{a.subtitulo}</p>

      <form onSubmit={onSubmit} noValidate className="mt-10 space-y-10">
        <Grupo n={1} titulo={a.passo_servico}>
          <input type="hidden" name="servico_id" value={servicoId} />
          <div className="grid gap-2" role="radiogroup">
            {site.servicos.itens.map((s) => (
              <button key={s.id} type="button" role="radio" aria-checked={servicoId === s.id} data-item-id={s.id} onClick={() => setServicoId(s.id)} className={opt(servicoId === s.id)}>
                <span className="font-medium">{s.nome}</span>
                <span className="text-sm opacity-80">{s.preco_label} · {s.duracao_label}</span>
              </button>
            ))}
          </div>
        </Grupo>

        <Grupo n={2} titulo={a.passo_profissional}>
          <select name="profissional_id" value={profId} onChange={(e) => setProfId(e.target.value)} className="field">
            <option value={QUALQUER}>{a.sem_preferencia}</option>
            {site.profissionais.itens.map((p) => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>
        </Grupo>

        <Grupo n={3} titulo={a.passo_data}>
          <input type="date" name="data" min={min} value={data} onChange={(e) => { setData(e.target.value); setHorario(""); }} className="field" />
        </Grupo>

        <Grupo n={4} titulo={a.passo_horario}>
          <input type="hidden" name="horario" value={horario} />
          {data && !dia ? (
            <p data-field="agendamento.fechado" className="text-site-accent">{a.fechado}</p>
          ) : dia ? (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {dia.intervalos.map((h) => (
                <button key={h} type="button" aria-pressed={horario === h} onClick={() => setHorario(h)} className={`${opt(horario === h)} justify-center`}>
                  {h}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-site-muted">{site.empresa.horario_resumo}</p>
          )}
        </Grupo>

        <Grupo n={5} titulo={a.passo_dados}>
          <div className="space-y-4">
            <label className="block text-sm text-site-muted">{a.label_nome}<input name="nome" required className="field mt-1" /></label>
            <label className="block text-sm text-site-muted">{a.label_telefone}<input name="telefone" type="tel" required className="field mt-1" /></label>
            <label className="block text-sm text-site-muted">{a.label_observacao}<textarea name="observacao" rows={3} placeholder={a.placeholder_observacao} className="field mt-1" /></label>
          </div>
        </Grupo>

        {erro && <p role="alert" data-field="agendamento.erro_campos" className="text-site-accent">{a.erro_campos}</p>}
        <button type="submit" data-action="confirmar_agendamento" className="btn-primary w-full">{a.botao_confirmar}</button>
      </form>
    </section>
  );
}
