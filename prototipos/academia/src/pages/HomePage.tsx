import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { SobreSection } from "@/components/SobreSection";
import { ServicosSection } from "@/components/ServicosSection";
import { ProfissionaisSection } from "@/components/ProfissionaisSection";
import { DiferenciaisSection } from "@/components/DiferenciaisSection";
import { PromocoesSection } from "@/components/PromocoesSection";
import { EventosSection } from "@/components/EventosSection";
import { GaleriaSection } from "@/components/GaleriaSection";
import { FaqSection } from "@/components/FaqSection";
import { ContatoSection } from "@/components/ContatoSection";
import { Rodape } from "@/components/Rodape";
import { WhatsappFlutuante } from "@/components/WhatsappFlutuante";
import { Seo } from "@/components/Seo";

export function HomePage() {
  return (
    <>
      <Seo />
      <Header />
      <main>
        <HeroSection />
        <SobreSection />
        <ServicosSection />
        <ProfissionaisSection />
        <DiferenciaisSection />
        <PromocoesSection />
        <EventosSection />
        <GaleriaSection />
        <FaqSection />
        <ContatoSection />
      </main>
      <Rodape />
      <WhatsappFlutuante />
    </>
  );
}
