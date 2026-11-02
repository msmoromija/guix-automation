import { describe, expect, it } from "vitest";
import { site } from "@/content/site";
import { expedienteDoDia, parseLocalDate } from "@/lib/expediente";
import { whatsappUrl } from "@/lib/whatsapp";
import { leadMessage } from "@/lib/lead";

describe("regras", () => {
  it("domingo não tem horário", () => {
    expect(expedienteDoDia("2026-11-01", site.empresa.expediente)).toBeNull();
  });
  it("segunda inclui 06:00", () => {
    expect(expedienteDoDia("2026-11-02", site.empresa.expediente)?.intervalos).toContain("06:00");
  });
  it("data local não desloca o dia", () => {
    expect(parseLocalDate("2026-11-02")?.getDate()).toBe(2);
  });
  it("whatsapp usa só dígitos", () => {
    expect(whatsappUrl("+55 (79) 9999", "a b")).toBe("https://wa.me/55799999?text=a%20b");
  });
  it("mensagem de agendamento", () => {
    const msg = leadMessage({ tipo: "agendamento", servico_id: "srv_avaliacao", profissional_id: "qualquer", data: "2026-11-02", horario: "06:00", nome: "Ana", telefone: "79 9", email: "", mensagem: "" }, site);
    expect(msg).toBe("Olá, quero agendar: Avaliação física com Sem preferência em 02/11/2026 às 06:00. Meu nome é Ana. WhatsApp: 79 9.");
  });
});
