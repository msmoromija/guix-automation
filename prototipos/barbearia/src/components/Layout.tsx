import type { ReactNode } from "react";
import { Header } from "./Header";
import { Rodape } from "./Rodape";
import { WhatsappFlutuante } from "./WhatsappFlutuante";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Rodape />
      <WhatsappFlutuante />
    </>
  );
}
