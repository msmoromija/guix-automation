import { useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { site } from "@/content";
import { salvarLead } from "@/lib/lead";
import { Icon } from "./icons";

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
    salvarLead({
      tipo: "contato", servico_id: "", profissional_id: "", data: "", horario: "",
      nome: v("nome"), telefone: v("telefone"), email: v("email"), mensagem: v("mensagem"),
    });
    navigate({ to: "/obrigado" });
  };

  const info = [
    { icon: "map-pin", field: "empresa.endereco.completo", text: empresa.endereco.completo },
    { icon: "clock", field: "empresa.horario_resumo", text: empresa.horario_resumo },
    { icon: "message-circle", field: "empresa.whatsapp_label", text: empresa.whatsapp_label },
    { icon: "phone", field: "empresa.telefone_label", text: empresa.telefone_label },
  ];

  return (
    <section id="contato" data-section="contato" className="mx-auto max-w-6xl px-5 py-20 sm:py-28">
      <div className="grid gap-12 md:grid-cols-2">
        <div>
          <h2 data-field="contato.titulo" className="text-3xl text-brand sm:text-5xl">{contato.titulo}</h2>
          <p data-field="contato.subtitulo" className="mt-4 text-ink-muted">{contato.subtitulo}</p>
          <ul className="mt-8 space-y-4">
            {info.map((i) => (
              <li key={i.field} className="flex gap-3">
                <Icon name={i.icon} className="mt-0.5 h-5 w-5 shrink-0 text-sage" />
                <span data-field={i.field}>{i.text}</span>
              </li>
            ))}
            <li className="flex gap-3">
              <Icon name="star" className="mt-0.5 h-5 w-5 shrink-0 text-sage" />
              <a href={`mailto:${empresa.email}`} data-field="empresa.email" className="underline-offset-4 hover:underline">{empresa.email}</a>
            </li>
          </ul>
          {empresa.endereco.mapa_embed_url && (
            <iframe src={empresa.endereco.mapa_embed_url} title={empresa.endereco.completo} className="mt-8 aspect-video w-full rounded-ui border" loading="lazy" />
          )}
        </div>
        <form onSubmit={onSubmit} noValidate className="rounded-ui border bg-paper p-6 sm:p-8">
          <h3 data-field="contato.formulario.titulo" className="text-2xl text-brand">{f.titulo}</h3>
          <div className="mt-6 space-y-4">
            <label className="block"><span className="mb-1.5 block text-sm">{f.label_nome}</span><input name="nome" required className="field" autoComplete="name" /></label>
            <label className="block"><span className="mb-1.5 block text-sm">{f.label_telefone}</span><input name="telefone" type="tel" required className="field" autoComplete="tel" /></label>
            <label className="block"><span className="mb-1.5 block text-sm">{f.label_email}</span><input name="email" type="email" className="field" autoComplete="email" /></label>
            <label className="block"><span className="mb-1.5 block text-sm">{f.label_mensagem}</span><textarea name="mensagem" required rows={4} className="field" /></label>
          </div>
          {erro && <p role="alert" className="mt-4 text-sm text-brand">{agendamento.erro_campos}</p>}
          <button type="submit" data-action="enviar_contato" className="btn-primary mt-6 w-full">{f.botao}</button>
        </form>
      </div>
    </section>
  );
}
