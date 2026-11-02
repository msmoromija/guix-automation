import { useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { site } from "@/content";
import { saveLead } from "@/lib/lead";

export function ContatoSection() {
  const { contato, empresa, agendamento } = site;
  const f = contato.formulario;
  const navigate = useNavigate();
  const [erro, setErro] = useState(false);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const v = (k: string) => String(fd.get(k) ?? "").trim();
    if (!v("nome") || !v("telefone") || !v("mensagem")) { setErro(true); return; }
    saveLead({ tipo: "contato", servico_id: "", profissional_id: "", data: "", horario: "", nome: v("nome"), telefone: v("telefone"), email: v("email"), mensagem: v("mensagem") });
    navigate({ to: "/obrigado" });
  }

  return (
    <section id="contato" data-section="contato" className="mx-auto grid max-w-6xl gap-10 px-5 py-20 md:grid-cols-2">
      <div>
        <h2 data-field="contato.titulo" className="text-4xl sm:text-5xl">{contato.titulo}</h2>
        <p data-field="contato.subtitulo" className="mt-3 text-text-muted">{contato.subtitulo}</p>
        <dl className="mt-8 space-y-4 text-sm">
          <dd data-field="empresa.endereco.completo" className="text-text">{empresa.endereco.completo}</dd>
          <dd data-field="empresa.horario_resumo" className="text-text-muted">{empresa.horario_resumo}</dd>
          <dd><a href={`tel:${empresa.telefone}`} data-field="empresa.telefone_label" className="text-primary underline-offset-4 hover:underline">{empresa.telefone_label}</a></dd>
          <dd><a href={`mailto:${empresa.email}`} data-field="empresa.email" className="text-primary underline-offset-4 hover:underline">{empresa.email}</a></dd>
        </dl>
        {empresa.endereco.mapa_embed_url && (
          <iframe src={empresa.endereco.mapa_embed_url} title={empresa.endereco.completo} loading="lazy" className="rounded-site line mt-6 aspect-video w-full" />
        )}
      </div>
      <form onSubmit={onSubmit} noValidate className="rounded-site line space-y-4 bg-surface p-6">
        <h3 data-field="contato.formulario.titulo" className="text-2xl">{f.titulo}</h3>
        <label className="block text-sm">{f.label_nome}<input name="nome" required className="field mt-1" /></label>
        <label className="block text-sm">{f.label_telefone}<input name="telefone" type="tel" required className="field mt-1" /></label>
        <label className="block text-sm">{f.label_email}<input name="email" type="email" className="field mt-1" /></label>
        <label className="block text-sm">{f.label_mensagem}<textarea name="mensagem" required rows={4} className="field mt-1" /></label>
        {erro && <p role="alert" className="text-sm text-secondary">{agendamento.erro_campos}</p>}
        <button type="submit" data-action="enviar_contato" className="btn-primary w-full">{f.botao}</button>
      </form>
    </section>
  );
}
