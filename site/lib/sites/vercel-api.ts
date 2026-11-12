/**
 * Provisiona projeto na Vercel ligado ao repo GitHub do cliente.
 * Requer VERCEL_TOKEN (+ opcional VERCEL_TEAM_ID).
 */
import { txtPublicoPresente } from "@/lib/sites/cloudflare-dns";

export type ResultadoVercel = {
  ok: boolean;
  projectId?: string;
  projectName?: string;
  dashboardUrl?: string;
  deployUrl?: string;
  passos: string[];
  avisos: string[];
};

function token() {
  return (process.env.VERCEL_TOKEN || "").trim();
}

function teamQuery() {
  const id = (process.env.VERCEL_TEAM_ID || "").trim();
  return id ? `?teamId=${encodeURIComponent(id)}` : "";
}

export function vercelConfigurado() {
  return Boolean(token());
}

/** Chamada autenticada à API REST da Vercel, com VERCEL_TEAM_ID aplicado quando definido. */
export function vercelFetch(path: string, init?: RequestInit) {
  const t = token();
  if (!t) throw new Error("VERCEL_TOKEN ausente");
  const q = teamQuery();
  const url =
    q && !path.includes("teamId=")
      ? `https://api.vercel.com${path}${path.includes("?") ? `&${q.slice(1)}` : q}`
      : `https://api.vercel.com${path}`;
  return fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${t}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
}

const api = vercelFetch;

/** Cria (ou reutiliza) projeto Vercel a partir do repo GitHub. */
export async function provisionarProjetoVercel(opts: {
  projetoNome: string;
  githubRepo: string; // owner/name
  framework?: "vite" | "nextjs" | "other";
  dominio?: string;
}): Promise<ResultadoVercel> {
  const passos: string[] = [];
  const avisos: string[] = [];

  if (!token()) {
    return { ok: false, passos, avisos: ["VERCEL_TOKEN ausente — deploy fica manual."] };
  }

  const name = opts.projetoNome
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  // Já existe?
  const list = await api(`/v9/projects/${encodeURIComponent(name)}`);
  let projectId = "";
  if (list.ok) {
    const j = (await list.json()) as { id?: string; name?: string };
    projectId = j.id || "";
    passos.push("vercel:projeto_existe");
  } else {
    const [owner, repo] = opts.githubRepo.split("/");
    const body: Record<string, unknown> = {
      name,
      framework: opts.framework === "nextjs" ? "nextjs" : "vite",
      gitRepository: {
        type: "github",
        repo: `${owner}/${repo}`,
      },
    };
    const cr = await api(`/v10/projects`, { method: "POST", body: JSON.stringify(body) });
    if (!cr.ok) {
      // sem git link (token sem integração GitHub na Vercel) — cria projeto vazio
      const cr2 = await api(`/v10/projects`, {
        method: "POST",
        body: JSON.stringify({ name, framework: body.framework }),
      });
      if (!cr2.ok) {
        return {
          ok: false,
          passos,
          avisos: [`criar projeto: ${(await cr2.text()).slice(0, 220)}`],
        };
      }
      const j = (await cr2.json()) as { id?: string; name?: string };
      projectId = j.id || "";
      avisos.push("Projeto Vercel criado sem git link — conecte o repo no dashboard ou use Deploy Hook.");
      passos.push("vercel:projeto_sem_git");
    } else {
      const j = (await cr.json()) as { id?: string; name?: string };
      projectId = j.id || "";
      passos.push("vercel:projeto_criado");
    }
  }

  if (opts.dominio && projectId) {
    const dom = await api(`/v10/projects/${projectId}/domains`, {
      method: "POST",
      body: JSON.stringify({ name: opts.dominio.replace(/^https?:\/\//, "").replace(/\/$/, "") }),
    });
    if (dom.ok) passos.push("vercel:dominio_anexado");
    else avisos.push(`domínio Vercel: ${(await dom.text()).slice(0, 160)}`);
  }

  // Dispara deploy se houver deploy hook
  const hook = (process.env.VERCEL_DEPLOY_HOOK_TEMPLATE || "").trim();
  // por projeto: Vercel dashboard gera hook; opcional GUIX_VERCEL_DEPLOY_HOOKS=slug=url
  let deployUrl = "";
  const hooksMap = Object.fromEntries(
    `${process.env.GUIX_VERCEL_DEPLOY_HOOKS || ""}`
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => {
        const i = p.indexOf("=");
        return i > 0 ? [p.slice(0, i), p.slice(i + 1)] : [p, ""];
      }),
  );
  const hookUrl = hooksMap[name] || hook;
  if (hookUrl) {
    try {
      const d = await fetch(hookUrl, { method: "POST" });
      if (d.ok) {
        passos.push("vercel:deploy_hook");
        const j = (await d.json().catch(() => ({}))) as { url?: string; job?: { url?: string } };
        deployUrl = j.url || j.job?.url || "";
      } else {
        avisos.push(`deploy hook: HTTP ${d.status}`);
      }
    } catch (e) {
      avisos.push(e instanceof Error ? e.message : "deploy hook falhou");
    }
  }

  return {
    ok: Boolean(projectId),
    projectId,
    projectName: name,
    dashboardUrl: `https://vercel.com/${(process.env.VERCEL_TEAM_SLUG || "").trim() || "dashboard"}/${name}`,
    deployUrl,
    passos,
    avisos,
  };
}

/** Anexa o domínio, publica o desafio TXT pelo provedor de DNS e aguarda a Vercel confirmar. */
export async function anexarDominioVercel(opts: {
  projeto: string;
  dominio: string;
  /** Grava o TXT de verificação no provedor de DNS correto (Vercel ou Cloudflare). */
  gravarTxt: (registro: { name: string; content: string }) => Promise<{ ok: boolean; aviso?: string }>;
}): Promise<{ ok: boolean; pendente?: boolean; aviso?: string }> {
  if (!token()) return { ok: false, aviso: "VERCEL_TOKEN ausente." };
  const dominio = opts.dominio.replace(/^https?:\/\//, "").replace(/\/$/, "").toLowerCase();
  const projeto = encodeURIComponent(opts.projeto);
  const dominioPath = encodeURIComponent(dominio);
  const adicao = await api(`/v10/projects/${projeto}/domains`, {
    method: "POST",
    body: JSON.stringify({ name: dominio }),
  });
  const erroAdicao = adicao.ok ? "" : (await adicao.text()).slice(0, 200);

  const obterStatus = async () => {
    const resposta = await api(`/v9/projects/${projeto}/domains/${dominioPath}`);
    if (!resposta.ok) return { status: resposta.status, estado: null };
    const estado = (await resposta.json().catch(() => null)) as {
      verified?: boolean | string;
      verification?: { type?: string; domain?: string; value?: string }[];
    } | null;
    return { status: resposta.status, estado };
  };

  let consulta = await obterStatus();
  let estado = consulta.estado;
  if (!estado && (consulta.status === 429 || consulta.status >= 500)) {
    return { ok: false, pendente: true, aviso: `Consulta à Vercel temporariamente indisponível (HTTP ${consulta.status}).` };
  }
  if (!estado) {
    return {
      ok: false,
      aviso: erroAdicao
        ? `A Vercel recusou o domínio (HTTP ${consulta.status}) e não foi possível confirmar sua associação: ${erroAdicao}`
        : `A Vercel aceitou a solicitação, mas não foi possível consultar o status do domínio (HTTP ${consulta.status}).`,
    };
  }
  if (estado.verified === true || estado.verified === "true") return { ok: true };

  const desafio = estado.verification?.find(
    (item) => item.type?.toUpperCase() === "TXT" && item.domain && item.value,
  );
  if (!desafio?.domain || !desafio.value) {
    return { ok: false, aviso: "A Vercel ainda não marcou o domínio como verificado e não retornou um desafio TXT." };
  }

  const txt = await opts.gravarTxt({ name: desafio.domain, content: desafio.value });
  if (!txt.ok) return { ok: false, aviso: txt.aviso || "Não foi possível criar no DNS o TXT exigido pela Vercel." };

  const esperar = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
  for (let tentativa = 0; tentativa < 10; tentativa += 1) {
    const txtEncontrado = await txtPublicoPresente(desafio.domain, desafio.value);

    if (txtEncontrado) {
      const validar = await api(`/v9/projects/${projeto}/domains/${dominioPath}/verify`, { method: "POST" });
      if (!validar.ok && validar.status !== 400 && validar.status !== 429 && validar.status < 500) {
        return {
          ok: false,
          aviso: `A Vercel recusou a verificação do domínio (HTTP ${validar.status}).`,
        };
      }
      if (!validar.ok && validar.status === 400) {
        const erro = (await validar.text()).toLowerCase();
        if (/another project|different project|outro projeto/.test(erro)) {
          return { ok: false, aviso: "A Vercel informa que o domínio já está verificado em outro projeto." };
        }
      }
    }

    consulta = await obterStatus();
    estado = consulta.estado;
    if (estado?.verified === true || estado?.verified === "true") return { ok: true };
    if (!estado) {
      if (consulta.status !== 429 && consulta.status < 500) {
        return { ok: false, aviso: `Não foi possível consultar a Vercel durante a validação (HTTP ${consulta.status}).` };
      }
    }
    if (tentativa < 9) await esperar(6_000);
  }

  return {
    ok: false,
    pendente: true,
    aviso: `TXT da Vercel criado automaticamente em ${desafio.domain}; aguardando propagação para ${desafio.value}.`,
  };
}
