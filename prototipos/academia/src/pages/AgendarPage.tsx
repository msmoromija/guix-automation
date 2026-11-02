import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { site } from "@/content/site";
import { Header } from "@/components/Header";
import { Rodape } from "@/components/Rodape";
import { WhatsappFlutuante } from "@/components/WhatsappFlutuante";
import { Seo } from "@/components/Seo";
import { expedienteDoDia, todayLocal } from "@/lib/expediente";
import { SEM_PREFERENCIA_ID, saveLead } from "@/lib/lead";

function Grupo({ n, titulo, children }: { n: number; titulo: string; children: ReactNode }) {
  return (
    <fieldset className="rounded-theme border bg-surface p-5">
      <legend className="px-2 font-heading text-2xl font-bold uppercase">
        <span className="text-lime">{String(n).padStart(2, "0")}</span> {titulo}
      </legend>
      {children}
    </fieldset>
  );
}

const chip = (on: boolean) =>
  `min-h-11 rounded-theme border px-3 text-left text-sm transition-colors ${on ? "border-lime bg-lime text-page font-semibold" : "hover:border-lime"}`;

export function AgendarPage() {
  const { agendamento: a, servicos, profissionais, empresa } = site;
  const search = useSearch({ strict: false }) as { servico?: string; profissional?: string };
  const navigate = useNavigate();

  const profOpcoes = useMemo(
    () => [{ id: SEM_PREFERENCIA_ID, nome: a.sem_preferencia }, ...profissionais.itens.filter((p) => p.id !== SEM_PREFERENCIA_ID)],
    [a.sem_preferencia, profissionais.itens],
  );

  const [servicoId, setServicoId] = useState(servicos.itens.some((s) => s.id === search.servico) ? search.servico! : "");
  const [profId, setProfId] = useState(profOpcoes.some((p) => p.id === search.profissional) ? search.profissional! : SEM_PREFERENCIA_ID);
  const [data, setData] = useState("");
  const [horario, setHorario] = useState("");
  const [erro, setErro] = useState(false);

  const dia = data ? expedienteDoDia(data, empresa.expediente) : null;
  const hoje = todayLocal();

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const nome = String(fd.get("nome") ?? "").trim();
    const telefone = String(fd.get("telefone") ?? "").trim();
    const observacao = String(fd.get("observacao") ?? "").trim();
    const horarioOk = !!dia && dia.intervalos.includes(horario);
    if (!servicoId || !profId || !data || !horarioOk || !nome || !telefone) {
      setErro(true);
      return;
    }
    saveLead({ tipo: "agendamento", servico_id: servicoId, profissional_id: profId, data, horario, nome, telefone, email: "", mensagem: observacao });
    navigate({ to: "/obrigado" });
  }

  return (
    <>
      <Seo titulo={a.titulo} />
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 data-field="agendamento.titulo" className="text-6xl font-bold">{a.titulo}</h1>
        <p data-field="agendamento.subtitulo" className="mt-3 text-ink-muted">{a.subtitulo}</p>

        <form onSubmit={onSubmit} noValidate className="mt-10 space-y-6">
          <Grupo n={1} titulo={a.passo_servico}>
            <input type="hidden" name="servico_id" value={servicoId} />
            <div className="grid gap-2 sm:grid-cols-2">
              {servicos.itens.map((s) => (
                <button key={s.id} type="button" aria-pressed={servicoId === s.id} onClick={() => setServicoId(s.id)} className={chip(servicoId === s.id)}>
                  <span className="block">{s.nome}</span>
                  <span className="block text-xs opacity-80">{s.preco_label} · {s.duracao_label}</span>
                </button>
              ))}
            </div>
          </Grupo>

          <Grupo n={2} titulo={a.passo_profissional}>
            <select name="profissional_id" value={profId} onChange={(e) => setProfId(e.target.value)} className="field">
              {profOpcoes.map((p) => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>
          </Grupo>

          <Grupo n={3} titulo={a.passo_data}>
            <input type="date" name="data" min={hoje} value={data} onChange={(e) => { setData(e.target.value); setHorario(""); }} className="field" />
          </Grupo>

          <Grupo n={4} titulo={a.passo_horario}>
            <input type="hidden" name="horario" value={horario} />
            {data && !dia && <p data-field="agendamento.fechado" className="text-ink-muted">{a.fechado}</p>}
            {dia && (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {dia.intervalos.map((h) => (
                  <button key={h} type="button" aria-pressed={horario === h} onClick={() => setHorario(h)} className={`${chip(horario === h)} text-center`}>
                    {h}
                  </button>
                ))}
              </div>
            )}
          </Grupo>

          <Grupo n={5} titulo={a.passo_dados}>
            <div className="space-y-4">
              <label className="block text-sm">{a.label_nome}<input name="nome" required className="field mt-1" /></label>
              <label className="block text-sm">{a.label_telefone}<input name="telefone" type="tel" required className="field mt-1" /></label>
              <label className="block text-sm">{a.label_observacao}<textarea name="observacao" rows={3} placeholder={a.placeholder_observacao} className="field mt-1" /></label>
            </div>
          </Grupo>

          {erro && <p role="alert" data-field="agendamento.erro_campos" className="rounded-theme border border-lime p-3 text-sm">{a.erro_campos}</p>}
          <button type="submit" data-action="confirmar_agendamento" className="btn-primary w-full text-lg">{a.botao_confirmar}</button>
        </form>
      </main>
      <Rodape />
      <WhatsappFlutuante />
    </>
  );
}
