export type CanalId =
  | "instagram"
  | "facebook"
  | "tiktok"
  | "youtube"
  | "linkedin"
  | "x"
  | "threads"
  | "pinterest"
  | "kwai";

export type CanalDef = {
  id: CanalId;
  label: string;
  schema: boolean;
  placeholder: string;
};

export const CANAIS: CanalDef[] = [
  { id: "instagram", label: "Instagram", schema: true, placeholder: "@seu.negocio" },
  { id: "facebook", label: "Facebook", schema: true, placeholder: "facebook.com/seu.negocio" },
  { id: "tiktok", label: "TikTok", schema: true, placeholder: "@seu.negocio" },
  { id: "youtube", label: "YouTube", schema: true, placeholder: "@canal" },
  { id: "x", label: "X", schema: false, placeholder: "@seu.negocio" },
  { id: "linkedin", label: "LinkedIn", schema: false, placeholder: "linkedin.com/company/..." },
  { id: "threads", label: "Threads", schema: false, placeholder: "@seu.negocio" },
  { id: "pinterest", label: "Pinterest", schema: false, placeholder: "pinterest.com/seu.negocio" },
  { id: "kwai", label: "Kwai", schema: false, placeholder: "@seu.negocio" },
];

export const CANAIS_SCHEMA = ["instagram", "facebook", "tiktok", "youtube"] as const;

function soHandle(raw: string, dominio: string) {
  return raw
    .trim()
    .replace(/^@/, "")
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(new RegExp(`^(?:${dominio})\\/`, "i"), "")
    .replace(/^\/+/, "");
}

export function urlSegura(raw: string) {
  const s = raw.trim();
  if (!s) return "";
  if (/^#[a-z0-9_-]+$/i.test(s)) return s;
  if (!/^https:\/\/[^\s<>"']+$/i.test(s)) return "";
  if (/^https:\/\/(javascript|data|vbscript):/i.test(s)) return "";
  return s.slice(0, 240);
}

export function urlCanal(id: string, raw: string) {
  const s = raw.trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return urlSegura(s.startsWith("https://") ? s : s.replace(/^http:/i, "https:"));
  if (id === "instagram") return urlSegura(`https://instagram.com/${soHandle(s, "instagram\\.com")}`);
  if (id === "facebook") return urlSegura(`https://facebook.com/${soHandle(s, "facebook\\.com|fb\\.com")}`);
  if (id === "tiktok") return urlSegura(`https://tiktok.com/@${soHandle(s, "tiktok\\.com").replace(/^@/, "")}`);
  if (id === "youtube") return urlSegura(`https://youtube.com/@${soHandle(s, "youtube\\.com").replace(/^@/, "")}`);
  if (id === "linkedin") {
    const h = soHandle(s, "linkedin\\.com");
    return urlSegura(h.includes("/") ? `https://linkedin.com/${h}` : `https://linkedin.com/company/${h}`);
  }
  if (id === "x") return urlSegura(`https://x.com/${soHandle(s, "x\\.com|twitter\\.com")}`);
  if (id === "threads") return urlSegura(`https://threads.net/@${soHandle(s, "threads\\.net").replace(/^@/, "")}`);
  if (id === "pinterest") return urlSegura(`https://pinterest.com/${soHandle(s, "pinterest\\.com")}`);
  if (id === "kwai") return urlSegura(`https://www.kwai.com/@${soHandle(s, "(?:www\\.)?kwai\\.com").replace(/^@/, "")}`);
  return urlSegura(s);
}

export function extrasDeRedes(redes: Record<string, string>) {
  return CANAIS.filter((c) => !c.schema && redes[c.id]?.trim()).map((c) => ({
    id: c.id,
    label: c.label,
    url: urlCanal(c.id, redes[c.id]),
  }));
}
