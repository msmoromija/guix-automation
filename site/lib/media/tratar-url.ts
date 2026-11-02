/** Enquadra foto de stock (Unsplash) no recorte do bloco. */
export function enquadrarFoto(src: string | undefined, w: number, h: number, faces = false) {
  if (!src) return src;
  try {
    const u = new URL(src);
    if (!u.hostname.includes("unsplash.com") && !u.hostname.includes("images.unsplash")) return src;
    u.searchParams.set("auto", "format");
    u.searchParams.set("fit", "crop");
    u.searchParams.set("w", String(w));
    u.searchParams.set("h", String(h));
    u.searchParams.set("q", "80");
    u.searchParams.set("crop", faces ? "faces,entropy" : "entropy");
    return u.toString();
  } catch {
    return src;
  }
}
