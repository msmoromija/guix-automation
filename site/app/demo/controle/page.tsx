import { EditorAdmin } from "@/components/conta/EditorAdmin";

export const metadata = {
  title: "Controle do site · demonstração GuiX",
  description: "Painel do administrador pós-venda: profissionais, agenda, avisos, serviços e contato.",
};

export default function DemoControlePage() {
  return <EditorAdmin id="demo" token="demo" demo />;
}
