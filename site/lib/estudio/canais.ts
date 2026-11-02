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

export function urlCanal(id: string, raw: string) {
  const s = raw.trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  const handle = s.replace(/^@/, "").replace(/^\/+/, "");
  if (id === "instagram") return `https://instagram.com/${handle}`;
  if (id === "facebook") return `https://facebook.com/${handle}`;
  if (id === "tiktok") return `https://tiktok.com/@${handle}`;
  if (id === "youtube") return `https://youtube.com/@${handle}`;
  if (id === "linkedin") {
    return handle.includes("linkedin.com") ? `https://${handle.replace(/^https?:\/\//, "")}` : `https://linkedin.com/company/${handle}`;
  }
  if (id === "x") return `https://x.com/${handle}`;
  if (id === "threads") return `https://threads.net/@${handle}`;
  if (id === "pinterest") return `https://pinterest.com/${handle}`;
  if (id === "kwai") return `https://www.kwai.com/@${handle}`;
  return s;
}

export function extrasDeRedes(redes: Record<string, string>) {
  return CANAIS.filter((c) => !c.schema && redes[c.id]?.trim()).map((c) => ({
    id: c.id,
    label: c.label,
    url: urlCanal(c.id, redes[c.id]),
  }));
}
