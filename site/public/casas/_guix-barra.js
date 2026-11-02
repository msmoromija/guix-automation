(function () {
  if (window.__guixBarra) return;
  window.__guixBarra = true;

  var path = location.pathname || "";
  var m = path.match(/\/casas\/([a-z0-9_-]+)/i);
  var nicho = m ? m[1] : "";
  if (!nicho) return;

  var bar = document.createElement("div");
  bar.setAttribute("role", "region");
  bar.setAttribute("aria-label", "GuiX — escolher modelo");
  bar.style.cssText =
    "position:fixed;left:0;right:0;bottom:0;z-index:2147483000;display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:center;padding:12px 16px;background:rgba(15,23,42,.96);color:#fff;font:600 13px/1.3 system-ui,sans-serif;box-shadow:0 -8px 24px rgba(0,0,0,.25)";

  function link(href, label, primary) {
    var a = document.createElement("a");
    a.href = href;
    a.textContent = label;
    a.style.cssText = primary
      ? "background:#fb923c;color:#0f172a;padding:10px 16px;border-radius:999px;text-decoration:none"
      : "border:1px solid rgba(255,255,255,.3);color:#fff;padding:10px 16px;border-radius:999px;text-decoration:none";
    return a;
  }

  var txt = document.createElement("span");
  txt.textContent = "Modelo GuiX · " + nicho;
  txt.style.cssText = "opacity:.8;margin-right:4px";

  bar.appendChild(txt);
  bar.appendChild(link("/prototipar?nicho=" + encodeURIComponent(nicho), "Usar este modelo", true));
  bar.appendChild(link("/contratar?plano=simples&nicho=" + encodeURIComponent(nicho), "Contratar", false));
  bar.appendChild(link("/exemplos/" + encodeURIComponent(nicho), "Ver com GuiX", false));

  document.body.appendChild(bar);
  document.body.style.paddingBottom = "72px";
})();
