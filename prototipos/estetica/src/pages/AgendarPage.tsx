import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { site } from "@/content";
import { Seo } from "@/components/Seo";
import { hojeISO, intervalosDoDia } from "@/lib/expediente";
import { salvarLead } from "@/lib/lead";

export const SEM_PREFERENCIA_ID = "qualquer";

function Grupo({ n, titulo, children }: { n: number; titulo: string; children: ReactNode }) {
  return (
    <fieldset className="border-t py-8">
      <legend className="float-left mb-4 flex w-full items-center gap-3">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-sand text-sm font-semibold text-brand">{n}</span>
        <span className="font-display text-xl text-brand">{titulo}</span>
      </legend>
      <div className="clear-both">{children}</div>
    </fieldset>
  );
}

const chip = (on: boolean) =>
  `rounded-ui border px-4 py-3 text-left text-sm transition-colors ${on ? "border-brand bg-brand text-paper" : "bg-paper hover:border-sage"}`;

export function AgendarPage({ servico, profissional }: { servico?: string; profissional?: string }) {
  const { agendamento: a, servicos, profissionais, empresa } = site;
  const navigate = useNavigate();
  const validServico = servicos.itens.some((s) => s.id === servico) ? servico! : "";
  const validPro =
    profissional === SEM_PREFERENCIA_ID || profissionais.itens.some((p) => p.id === profissional) ? profissional! : "";

  const [servicoId, setServicoId] = useState(validServico);
  const [proId, setProId] = useState(validPro);
  const [data, setData] = useState("");
  const [horario, setHorario] = useState("");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [obs, setObs] = useState("");
  const [erro, setErro] = useState(false);
  const [min, setMin] = useState<string | undefined>(undefined);

  useEffect(() => setMin(hojeISO()), []);
  useEffect(() => { setServicoId(validServico); }, [validServico]);
  useEffect(() => { setProId(validPro); }, [validPro]);

  const intervalos = data ? intervalosDoDia(empresa.expediente, data) : null;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!servicoId || !proId || !data || !intervalos || !horario || !nome.trim() || !telefone.trim()) {
      setErro(true);
      return;
    }
    salvarLead({
      tipo: "agendamento", servico_id: servicoId, profissional_id: proId, data, horario,
      nome: nome.trim(), telefone: telefone.trim(), email: "", mensagem: obs.trim(),
    });
    navigate({ to: "/obrigado" });
  };

  const opcoesPro = [{ id: SEM_PREFERENCIA_ID, nome: a.sem_preferencia, cargo: "" }, ...profissionais.itens];

  return (
    <div className="mx-auto max-w-3xl px-5 py-14 sm:py-20">
      <Seo titulo={a.titulo} />
      <h1 data-field="agendamento.titulo" className="text-4xl text-brand sm:text-5xl">{a.titulo}</h1>
      <p data-field="agendamento.subtitulo" className="mt-4 text-ink-muted">{a.subtitulo}</p>

      <form onSubmit={onSubmit} noValidate className="mt-10">
        <Grupo n={1} titulo={a.passo_servico}>
          <input type="hidden" name="servico_id" value={servicoId} />
          <div className="grid gap-2 sm:grid-cols-2">
            {servicos.itens.map((s) => (
              <button key={s.id} type="button" aria-pressed={servicoId === s.id} onClick={() => setServicoId(s.id)} className={chip(servicoId === s.id)}>
                <span className="block font-medium">{s.nome}</span>
                <span className="block opacity-80">{s.preco_label} · {s.duracao_label}</span>
              </button>
            ))}
          </div>
        </Grupo>

        <Grupo n={2} titulo={a.passo_profissional}>
          <input type="hidden" name="profissional_id" value={proId} />
          <div className="grid gap-2 sm:grid-cols-2">
            {opcoesPro.map((p) => (
              <button key={p.id} type="button" aria-pressed={proId === p.id} onClick={() => setProId(p.id)} className={chip(proId === p.id)}>
                <span className="block font-medium">{p.nome}</span>
                {p.cargo && <span className="block opacity-80">{p.cargo}</span>}
              </button>
            ))}
          </div>
        </Grupo>

        <Grupo n={3} titulo={a.passo_data}>
          <input
            type="date"
            name="data"
            min={min}
            value={data}
            onChange={(e) => { setData(e.target.value); setHorario(""); }}
            className="field max-w-xs"
          />
        </Grupo>

        <Grupo n={4} titulo={a.passo_horario}>
          <input type="hidden" name="horario" value={horario} />
          {data && !intervalos && <p role="status" className="text-ink-muted">{a.fechado}</p>}
          {intervalos && (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {intervalos.map((h) => (
                <button key={h} type="button" aria-pressed={horario === h} onClick={() => setHorario(h)} className={`${chip(horario === h)} text-center`}>
                  {h}
                </button>
              ))}
            </div>
          )}
        </Grupo>

        <Grupo n={5} titulo={a.passo_dados}>
          <div className="space-y-4">
            <label className="block"><span className="mb-1.5 block text-sm">{a.label_nome}</span>
              <input name="nome" required value={nome} onChange={(e) => setNome(e.target.value)} className="field" autoComplete="name" /></label>
            <label className="block"><span className="mb-1.5 block text-sm">{a.label_telefone}</span>
              <input name="telefone" type="tel" required value={telefone} onChange={(e) => setTelefone(e.target.value)} className="field" autoComplete="tel" /></label>
            <label className="block"><span className="mb-1.5 block text-sm">{a.label_observacao}</span>
              <textarea name="observacao" rows={3} value={obs} placeholder={a.placeholder_observacao} onChange={(e) => setObs(e.target.value)} className="field" /></label>
          </div>
        </Grupo>

        {erro && <p role="alert" className="mb-4 rounded-ui bg-sand/50 p-4 text-sm text-brand">{a.erro_campos}</p>}
        <button type="submit" data-action="confirmar_agendamento" className="btn-primary w-full">{a.botao_confirmar}</button>
      </form>
    </div>
  );
}
