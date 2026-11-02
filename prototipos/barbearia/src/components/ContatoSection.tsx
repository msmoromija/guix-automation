import { useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { MapPin, Phone, Mail, Clock, MessageCircle } from "lucide-react";
import { site } from "@/content/site";
import { saveLead } from "@/lib/lead";
import { SectionTitle } from "./SectionTitle";

export function ContatoSection() {
  const { contato, empresa, agendamento } = site;
  const f = contato.formulario;
  const navigate = useNavigate();
  const [erro, setErro] = useState(false);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    const v = (k: string) => String(d.get(k) ?? "").trim();
    if (!v("nome") || !v("telefone") || !v("mensagem")) {
      setErro(true);
      return;
    }
    saveLead({ tipo: "contato", servico_id: "", profissional_id: "", data: "", horario: "", nome: v("nome"), telefone: v("telefone"), email: v("email"), mensagem: v("mensagem") });
    navigate({ to: "/obrigado" });
  };

  const linhas = [
    { icon: MapPin, field: "empresa.endereco.completo", text: empresa.endereco.completo },
    { icon: Clock, field: "empresa.horario_resumo", text: empresa.horario_resumo },
    { icon: MessageCircle, field: "empresa.whatsapp_label", text: empresa.whatsapp_label },
    { icon: Phone, field: "empresa.telefone_label", text: empresa.telefone_label },
    { icon: Mail, field: "empresa.email", text: empresa.email },
  ].filter((l) => l.text);

  return (
    <section id="contato" data-section="contato" className="mx-auto max-w-6xl px-4 py-16 md:py-24">
      <SectionTitle field="contato.titulo" title={contato.titulo} subField="contato.subtitulo" sub={contato.subtitulo} />
      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <ul className="space-y-4">
            {linhas.map((l) => (
              <li key={l.field} className="flex gap-3">
                <l.icon className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
                <span data-field={l.field}>{l.text}</span>
              </li>
            ))}
          </ul>
          {empresa.endereco.mapa_embed_url && (
            <iframe src={empresa.endereco.mapa_embed_url} title={empresa.endereco.completo} loading="lazy" className="mt-6 aspect-video w-full rounded-brand border" />
          )}
        </div>
        <form onSubmit={onSubmit} noValidate className="space-y-4 rounded-brand border bg-surface p-5">
          <h3 data-field="contato.formulario.titulo" className="text-xl font-semibold">{f.titulo}</h3>
          <label className="block text-sm"><span data-field="contato.formulario.label_nome">{f.label_nome}</span><input name="nome" required className="field mt-1" autoComplete="name" /></label>
          <label className="block text-sm"><span data-field="contato.formulario.label_telefone">{f.label_telefone}</span><input name="telefone" type="tel" required className="field mt-1" autoComplete="tel" /></label>
          <label className="block text-sm"><span data-field="contato.formulario.label_email">{f.label_email}</span><input name="email" type="email" className="field mt-1" autoComplete="email" /></label>
          <label className="block text-sm"><span data-field="contato.formulario.label_mensagem">{f.label_mensagem}</span><textarea name="mensagem" required rows={4} className="field mt-1" /></label>
          {erro && <p role="alert" className="text-sm text-accent">{agendamento.erro_campos}</p>}
          <button type="submit" data-action="enviar_contato" data-field="contato.formulario.botao" className="btn-primary w-full">{f.botao}</button>
        </form>
      </div>
    </section>
  );
}
