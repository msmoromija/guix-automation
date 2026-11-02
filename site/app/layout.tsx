import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "GuiX.net | Seu negócio no ar em até 24 horas",
    template: "%s | GuiX.net",
  },
  description:
    "Domínio, e-mail profissional, site, agenda online e WhatsApp. Tudo configurado com IA e publicado em até 24 horas. Desenvolvido pela GuiX.net.",
  openGraph: {
    title: "GuiX.net | Seu negócio no ar em até 24 horas",
    description:
      "Domínio, e-mail profissional, site, agenda online e WhatsApp. Presença digital completa, publicada rápido. GuiX.net.",
    locale: "pt_BR",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} ${inter.className} flex min-h-screen flex-col antialiased`}>
        <Header />
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
