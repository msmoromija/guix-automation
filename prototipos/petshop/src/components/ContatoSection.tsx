import { useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { site } from "@/content/site";
import { saveLead } from "@/lib/lead";
import { whatsappUrl } from "@/lib/whatsapp";

export function ContatoSection() {
  const { contato, empresa } = site;
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
    saveLead({ tipo: "contato", servico_id: "", profissional_id: "", data: "", horario: "", nome: v("nome"), telefone: v("telefone"), email: v("email"), mensagem: v("mensagem") });
    navigate({ to: "/obrigado" });
  }

  const row = "flex items-start gap-3";
  return (
    <section id="contato" data-section="contato" className="section">
      <span className="eyebrow-line" />
      <h2 data-field="contato.titulo" className="text-3xl font-bold text-brand md:text-4xl">{contato.titulo}</h2>
      <p data-field="contato.subtitulo" className="mt-3 max-w-xl text-ink-muted">{contato.subtitulo}</p>
      <div className="mt-10 grid gap-8 md:grid-cols-2">
        <div className="space-y-5">
          <p className={row}><MapPin className="mt-0.5 h-5 w-5 text-terra" /><span data-field="empresa.endereco.completo">{empresa.endereco.completo}</span></p>
          <p className={row}><Clock className="mt-0.5 h-5 w-5 text-terra" /><span data-field="empresa.horario_resumo">{empresa.horario_resumo}</span></p>
          <a href={`tel:${empresa.telefone}`} className={row}><Phone className="mt-0.5 h-5 w-5 text-terra" /><span data-field="empresa.telefone_label">{empresa.telefone_label}</span></a>
          <a href={whatsappUrl(empresa.whatsapp, empresa.whatsapp_mensagem)} target="_blank" rel="noreferrer" data-action="whatsapp" className={row}><MessageCircle className="mt-0.5 h-5 w-5 text-terra" /><span data-field="empresa.whatsapp_label">{empresa.whatsapp_label}</span></a>
          <a href={`mailto:${empresa.email}`} className={row}><Mail className="mt-0.5 h-5 w-5 text-terra" /><span data-field="empresa.email">{empresa.email}</span></a>
          {empresa.endereco.mapa_embed_url && (
            <iframe src={empresa.endereco.mapa_embed_url} title={empresa.endereco.completo} loading="lazy" className="aspect-video w-full rounded-site border" />
          )}
        </div>
        <form onSubmit={onSubmit} noValidate className="card space-y-4 p-6">
          <h3 data-field="contato.formulario.titulo" className="text-xl font-bold text-brand">{f.titulo}</h3>
          <label className="block"><span data-field="contato.formulario.label_nome" className="mb-1 block text-sm font-semibold">{f.label_nome}</span><input name="nome" required className="field" /></label>
          <label className="block"><span data-field="contato.formulario.label_telefone" className="mb-1 block text-sm font-semibold">{f.label_telefone}</span><input name="telefone" type="tel" required className="field" /></label>
          <label className="block"><span data-field="contato.formulario.label_email" className="mb-1 block text-sm font-semibold">{f.label_email}</span><input name="email" type="email" className="field" /></label>
          <label className="block"><span data-field="contato.formulario.label_mensagem" className="mb-1 block text-sm font-semibold">{f.label_mensagem}</span><textarea name="mensagem" required rows={4} className="field" /></label>
          {erro && <p role="alert" data-field="agendamento.erro_campos" className="text-sm font-semibold text-terra">{site.agendamento.erro_campos}</p>}
          <button type="submit" data-action="enviar_contato" data-field="contato.formulario.botao" className="btn-primary w-full">{f.botao}</button>
        </form>
      </div>
    </section>
  );
}
