import { Layout } from "@/components/Layout";
import { Seo } from "@/components/Seo";
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

export function HomePage() {
  return (
    <Layout>
      <Seo />
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
    </Layout>
  );
}
