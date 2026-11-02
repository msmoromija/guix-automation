import { useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { MapPin, Clock, Phone, Mail } from "lucide-react";
import { site } from "@/content/site";
import { salvarLead } from "@/lib/lead";
import { SectionHead } from "./SectionHead";

export function ContatoSection() {
  const { contato, empresa, agendamento } = site;
  const f = contato.formulario;
  const navigate = useNavigate();
  const [erro, setErro] = useState(false);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const v = (k: string) => String(fd.get(k) ?? "").trim();
    if (!v("nome") || !v("telefone") || !v("mensagem")) {
      setErro(true);
      return;
    }
    salvarLead({
      tipo: "contato", servico_id: "", profissional_id: "", data: "", horario: "",
      nome: v("nome"), telefone: v("telefone"), email: v("email"), mensagem: v("mensagem"),
    });
    navigate({ to: "/obrigado" });
  }

  return (
    <section id="contato" data-section="contato" className="mx-auto max-w-6xl px-5 py-20 md:py-28">
      <SectionHead field="contato" titulo={contato.titulo} subtitulo={contato.subtitulo} />
      <div className="grid gap-12 md:grid-cols-2">
        <div className="space-y-6">
          <ul className="space-y-4 text-site-text">
            <li className="flex gap-3"><MapPin className="mt-0.5 h-5 w-5 shrink-0 text-site-accent" /><span data-field="empresa.endereco.completo">{empresa.endereco.completo}</span></li>
            <li className="flex gap-3"><Clock className="mt-0.5 h-5 w-5 shrink-0 text-site-accent" /><span data-field="empresa.horario_resumo">{empresa.horario_resumo}</span></li>
            <li className="flex gap-3"><Phone className="mt-0.5 h-5 w-5 shrink-0 text-site-accent" /><a href={`tel:${empresa.telefone}`} data-field="empresa.telefone_label">{empresa.telefone_label}</a></li>
            <li className="flex gap-3"><Mail className="mt-0.5 h-5 w-5 shrink-0 text-site-accent" /><a href={`mailto:${empresa.email}`} data-field="empresa.email" className="break-all">{empresa.email}</a></li>
          </ul>
          {empresa.endereco.mapa_embed_url ? (
            <iframe src={empresa.endereco.mapa_embed_url} title={empresa.endereco.completo} className="aspect-[4/3] w-full border border-site-line" loading="lazy" />
          ) : null}
        </div>
        <form onSubmit={onSubmit} noValidate className="space-y-4 border border-site-line bg-site-surface p-6 md:p-8">
          <h3 data-field="contato.formulario.titulo" className="text-2xl text-site-primary">{f.titulo}</h3>
          <label className="block text-sm text-site-muted">{f.label_nome}<input name="nome" required className="field mt-1" /></label>
          <label className="block text-sm text-site-muted">{f.label_telefone}<input name="telefone" type="tel" required className="field mt-1" /></label>
          <label className="block text-sm text-site-muted">{f.label_email}<input name="email" type="email" className="field mt-1" /></label>
          <label className="block text-sm text-site-muted">{f.label_mensagem}<textarea name="mensagem" required rows={4} className="field mt-1" /></label>
          {erro && <p role="alert" className="text-sm text-site-accent">{agendamento.erro_campos}</p>}
          <button type="submit" data-action="enviar_contato" className="btn-primary w-full">{f.botao}</button>
        </form>
      </div>
    </section>
  );
}
