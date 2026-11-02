import { useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { site } from "@/content/site";
import { saveLead } from "@/lib/lead";
import { whatsappUrl } from "@/lib/whatsapp";
import { SectionHead } from "./SectionHead";

function faixa(intervalos: string[]) {
  const minutos = (hora: string) => {
    const [h, m] = hora.split(":").map(Number);
    return h * 60 + m;
  };
  const grupos: string[][] = [];
  for (const hora of intervalos) {
    const atual = grupos[grupos.length - 1];
    if (atual && minutos(hora) - minutos(atual[atual.length - 1]) <= 60) atual.push(hora);
    else grupos.push([hora]);
  }
  return grupos.map((grupo) => (grupo.length === 1 ? grupo[0] : `${grupo[0]}–${grupo[grupo.length - 1]}`)).join(" · ");
}

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
    saveLead({ tipo: "contato", servico_id: "", profissional_id: "", data: "", horario: "", nome: v("nome"), telefone: v("telefone"), email: v("email"), mensagem: v("mensagem") });
    navigate({ to: "/obrigado" });
  }

  const linha = "flex items-start gap-3";
  return (
    <section id="contato" data-section="contato" className="mx-auto max-w-6xl px-4 py-20">
      <SectionHead titulo={contato.titulo} field="contato.titulo" subtitulo={contato.subtitulo} subField="contato.subtitulo" />
      <div className="grid gap-10 md:grid-cols-2">
        <div className="space-y-5">
          <p className={linha}><MapPin className="mt-0.5 shrink-0 text-lime" size={20} /><span data-field="empresa.endereco.completo">{empresa.endereco.completo}</span></p>
          <p className={linha}><Clock className="mt-0.5 shrink-0 text-lime" size={20} /><span data-field="empresa.horario_resumo">{empresa.horario_resumo}</span></p>
          <p className={linha}><Phone className="mt-0.5 shrink-0 text-lime" size={20} /><a href={`tel:${empresa.telefone}`} data-field="empresa.telefone_label">{empresa.telefone_label}</a></p>
          <p className={linha}><MessageCircle className="mt-0.5 shrink-0 text-lime" size={20} /><a href={whatsappUrl(empresa.whatsapp, empresa.whatsapp_mensagem)} target="_blank" rel="noreferrer" data-action="whatsapp" data-field="empresa.whatsapp_label">{empresa.whatsapp_label}</a></p>
          <p className={linha}><Mail className="mt-0.5 shrink-0 text-lime" size={20} /><a href={`mailto:${empresa.email}`} data-field="empresa.email">{empresa.email}</a></p>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-1 border-t pt-5 text-sm">
            {empresa.expediente.map((d) => (
              <li key={d.dia} className="flex justify-between gap-2">
                <span className="text-ink-muted">{d.label}</span>
                <span>{faixa(d.intervalos)}</span>
              </li>
            ))}
          </ul>
          {empresa.endereco.mapa_embed_url !== "" && (
            <iframe src={empresa.endereco.mapa_embed_url} title={empresa.endereco.completo} className="aspect-video w-full rounded-theme border" loading="lazy" />
          )}
        </div>
        <form onSubmit={onSubmit} noValidate className="space-y-4 rounded-theme border bg-surface p-5">
          <h3 data-field="contato.formulario.titulo" className="text-3xl font-bold">{f.titulo}</h3>
          <label className="block text-sm">{f.label_nome}<input name="nome" required className="field mt-1" /></label>
          <label className="block text-sm">{f.label_telefone}<input name="telefone" type="tel" required className="field mt-1" /></label>
          <label className="block text-sm">{f.label_email}<input name="email" type="email" className="field mt-1" /></label>
          <label className="block text-sm">{f.label_mensagem}<textarea name="mensagem" required rows={4} className="field mt-1" /></label>
          {erro && <p role="alert" className="text-sm text-lime">{agendamento.erro_campos}</p>}
          <button type="submit" data-action="enviar_contato" className="btn-primary w-full">{f.botao}</button>
        </form>
      </div>
    </section>
  );
}
