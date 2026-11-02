import { useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { site } from "@/content";
import { saveLead } from "@/lib/lead";
import { whatsappUrl } from "@/lib/whatsapp";

export function ContatoSection() {
  const { contato, empresa, agendamento } = site;
  const f = contato.formulario;
  const navigate = useNavigate();
  const [erro, setErro] = useState(false);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const v = (k: string) => String(fd.get(k) ?? "").trim();
    if (!v("nome") || !v("telefone") || !v("mensagem")) return setErro(true);
    saveLead({ tipo: "contato", servico_id: "", profissional_id: "", data: "", horario: "", nome: v("nome"), telefone: v("telefone"), email: v("email"), mensagem: v("mensagem") });
    navigate({ to: "/obrigado" });
  }

  const linha = "flex items-start gap-3 py-3 border-b border-border";
  return (
    <section id="contato" data-section="contato" className="py-16 md:py-24">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 md:grid-cols-2">
        <div>
          <span className="eyebrow-rule" />
          <h2 data-field="contato.titulo" className="text-3xl font-semibold md:text-4xl">{contato.titulo}</h2>
          <p data-field="contato.subtitulo" className="mt-3 text-muted-foreground">{contato.subtitulo}</p>
          <ul className="mt-6 text-primary">
            <li className={linha}><MapPin className="mt-0.5 h-5 w-5 text-secondary" /><span data-field="empresa.endereco.completo">{empresa.endereco.completo}</span></li>
            <li className={linha}><Phone className="mt-0.5 h-5 w-5 text-secondary" /><a href={`tel:${empresa.telefone}`} data-field="empresa.telefone_label">{empresa.telefone_label}</a></li>
            <li className={linha}><MessageCircle className="mt-0.5 h-5 w-5 text-secondary" /><a href={whatsappUrl(empresa.whatsapp, empresa.whatsapp_mensagem)} target="_blank" rel="noreferrer" data-action="whatsapp" data-field="empresa.whatsapp_label">{empresa.whatsapp_label}</a></li>
            <li className={linha}><Mail className="mt-0.5 h-5 w-5 text-secondary" /><a href={`mailto:${empresa.email}`} data-field="empresa.email">{empresa.email}</a></li>
            <li className={linha}><Clock className="mt-0.5 h-5 w-5 text-secondary" /><span data-field="empresa.horario_resumo">{empresa.horario_resumo}</span></li>
          </ul>
          {empresa.endereco.mapa_embed_url && (
            <iframe src={empresa.endereco.mapa_embed_url} title={empresa.endereco.completo} loading="lazy" className="mt-6 aspect-video w-full rounded-[var(--radius)] border border-border" />
          )}
        </div>

        <form onSubmit={onSubmit} noValidate className="rounded-[var(--radius)] border border-border bg-card p-6">
          <h3 data-field="contato.formulario.titulo" className="text-xl font-semibold">{f.titulo}</h3>
          <div className="mt-5 space-y-4">
            <label className="block text-sm font-semibold text-primary">{f.label_nome}<input name="nome" required autoComplete="name" className="field mt-1 font-normal" /></label>
            <label className="block text-sm font-semibold text-primary">{f.label_telefone}<input name="telefone" type="tel" required autoComplete="tel" className="field mt-1 font-normal" /></label>
            <label className="block text-sm font-semibold text-primary">{f.label_email}<input name="email" type="email" autoComplete="email" className="field mt-1 font-normal" /></label>
            <label className="block text-sm font-semibold text-primary">{f.label_mensagem}<textarea name="mensagem" required rows={4} className="field mt-1 font-normal" /></label>
          </div>
          {erro && <p role="alert" className="mt-4 text-sm text-destructive">{agendamento.erro_campos}</p>}
          <button type="submit" data-action="enviar_contato" data-field="contato.formulario.botao" className="btn-primary mt-5 w-full">{f.botao}</button>
        </form>
      </div>
    </section>
  );
}
