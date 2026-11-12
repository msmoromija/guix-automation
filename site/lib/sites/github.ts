/**
 * Provisionamento GitHub dos repos site-<cliente>.
 * Usa GUIX_SITES_GIT_TOKEN (classic ou fine-grained com contents:write + administration:write).
 */

export type ResultadoGithub = {
  ok: boolean;
  repo?: string;
  htmlUrl?: string;
  cloneUrl?: string;
  passos: string[];
  avisos: string[];
};

function org() {
  return (process.env.GUIX_SITES_GIT_ORG || "guix-sites").replace(/^@/, "");
}

function token() {
  return (process.env.GUIX_SITES_GIT_TOKEN || "").trim();
}

function api(path: string, init?: RequestInit) {
  const t = token();
  if (!t) throw new Error("GUIX_SITES_GIT_TOKEN ausente");
  return fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${t}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
}

export function githubConfigurado() {
  return Boolean(token());
}

/** Cria repo (ou reutiliza) e faz commit inicial com os arquivos do pacote. */
export async function provisionarRepoGithub(opts: {
  clienteId: string;
  nome: string;
  arquivos: Record<string, string>;
  privateRepo?: boolean;
}): Promise<ResultadoGithub> {
  const passos: string[] = [];
  const avisos: string[] = [];
  const owner = org();
  const name = opts.clienteId.startsWith("site-") ? opts.clienteId : `site-${opts.clienteId}`;
  const full = `${owner}/${name}`;

  if (!token()) {
    return { ok: false, passos, avisos: ["GUIX_SITES_GIT_TOKEN ausente — repo fica manual."] };
  }

  const template = (process.env.GUIX_SITES_TEMPLATE_REPO || "").trim(); // owner/name
  let created = false;
  let htmlUrl = `https://github.com/${full}`;
  let cloneUrl = `https://github.com/${full}.git`;

  // 1) Garante que o repo existe
  const get = await api(`/repos/${full}`);
  if (get.status === 404) {
    if (template.includes("/")) {
      const [tOwner, tName] = template.split("/");
      const gen = await api(`/repos/${tOwner}/${tName}/generate`, {
        method: "POST",
        body: JSON.stringify({
          owner,
          name,
          private: opts.privateRepo !== false,
          description: `Site GuiX — ${opts.nome}`,
          include_all_branches: false,
        }),
      });
      if (!gen.ok) {
        avisos.push(`template generate: ${(await gen.text()).slice(0, 180)}`);
      } else {
        created = true;
        passos.push("github:repo_from_template");
        const j = (await gen.json()) as { html_url?: string; clone_url?: string };
        htmlUrl = j.html_url || htmlUrl;
        cloneUrl = j.clone_url || cloneUrl;
        // template generate é async — espera um pouco
        await new Promise((r) => setTimeout(r, 2500));
      }
    }

    if (!created) {
      const cr = await api(`/orgs/${owner}/repos`, {
        method: "POST",
        body: JSON.stringify({
          name,
          private: opts.privateRepo !== false,
          description: `Site GuiX — ${opts.nome}`,
          auto_init: true,
        }),
      });
      if (!cr.ok) {
        // tenta user scope
        const cr2 = await api(`/user/repos`, {
          method: "POST",
          body: JSON.stringify({
            name,
            private: opts.privateRepo !== false,
            description: `Site GuiX — ${opts.nome}`,
            auto_init: true,
          }),
        });
        if (!cr2.ok) {
          return {
            ok: false,
            passos,
            avisos: [...avisos, `criar repo: ${(await cr2.text()).slice(0, 220)}`],
          };
        }
        const j = (await cr2.json()) as { html_url?: string; clone_url?: string; full_name?: string };
        htmlUrl = j.html_url || htmlUrl;
        cloneUrl = j.clone_url || cloneUrl;
        passos.push("github:repo_user");
      } else {
        const j = (await cr.json()) as { html_url?: string; clone_url?: string };
        htmlUrl = j.html_url || htmlUrl;
        cloneUrl = j.clone_url || cloneUrl;
        passos.push("github:repo_org");
      }
      created = true;
      await new Promise((r) => setTimeout(r, 1200));
    }
  } else if (get.ok) {
    const j = (await get.json()) as { html_url?: string; clone_url?: string };
    htmlUrl = j.html_url || htmlUrl;
    cloneUrl = j.clone_url || cloneUrl;
    passos.push("github:repo_existe");
  } else {
    return { ok: false, passos, avisos: [`ler repo: ${(await get.text()).slice(0, 180)}`] };
  }

  // 2) Commit dos arquivos via Git Data API
  try {
    const refRes = await api(`/repos/${full}/git/ref/heads/main`);
    let baseSha = "";
    let baseTree = "";
    if (refRes.ok) {
      const ref = (await refRes.json()) as { object: { sha: string } };
      baseSha = ref.object.sha;
      const commitRes = await api(`/repos/${full}/git/commits/${baseSha}`);
      if (commitRes.ok) {
        const c = (await commitRes.json()) as { tree: { sha: string } };
        baseTree = c.tree.sha;
      }
    } else {
      // tenta master
      const ref2 = await api(`/repos/${full}/git/ref/heads/master`);
      if (ref2.ok) {
        const ref = (await ref2.json()) as { object: { sha: string } };
        baseSha = ref.object.sha;
        const commitRes = await api(`/repos/${full}/git/commits/${baseSha}`);
        if (commitRes.ok) {
          const c = (await commitRes.json()) as { tree: { sha: string } };
          baseTree = c.tree.sha;
        }
      }
    }

    const treeItems: { path: string; mode: "100644"; type: "blob"; sha: string }[] = [];
    for (const [filePath, content] of Object.entries(opts.arquivos)) {
      const blob = await api(`/repos/${full}/git/blobs`, {
        method: "POST",
        body: JSON.stringify({ content, encoding: "utf-8" }),
      });
      if (!blob.ok) {
        avisos.push(`blob ${filePath}: ${(await blob.text()).slice(0, 100)}`);
        continue;
      }
      const b = (await blob.json()) as { sha: string };
      treeItems.push({ path: filePath.replace(/^\/+/, ""), mode: "100644", type: "blob", sha: b.sha });
    }

    if (!treeItems.length) {
      avisos.push("Nenhum arquivo commitado");
      return { ok: false, repo: full, htmlUrl, cloneUrl, passos, avisos };
    }

    const treeRes = await api(`/repos/${full}/git/trees`, {
      method: "POST",
      body: JSON.stringify({
        base_tree: baseTree || undefined,
        tree: treeItems,
      }),
    });
    if (!treeRes.ok) {
      return {
        ok: false,
        repo: full,
        htmlUrl,
        cloneUrl,
        passos,
        avisos: [...avisos, `tree: ${(await treeRes.text()).slice(0, 180)}`],
      };
    }
    const tree = (await treeRes.json()) as { sha: string };

    const commitRes = await api(`/repos/${full}/git/commits`, {
      method: "POST",
      body: JSON.stringify({
        message: `chore: pacote GuiX — ${opts.nome}`,
        tree: tree.sha,
        parents: baseSha ? [baseSha] : [],
      }),
    });
    if (!commitRes.ok) {
      return {
        ok: false,
        repo: full,
        htmlUrl,
        cloneUrl,
        passos,
        avisos: [...avisos, `commit: ${(await commitRes.text()).slice(0, 180)}`],
      };
    }
    const commit = (await commitRes.json()) as { sha: string };

    const branch = baseSha ? "main" : "main";
    const refUpdate = await api(`/repos/${full}/git/refs/heads/${branch}`, {
      method: "PATCH",
      body: JSON.stringify({ sha: commit.sha, force: false }),
    });
    if (!refUpdate.ok) {
      // cria branch
      const createRef = await api(`/repos/${full}/git/refs`, {
        method: "POST",
        body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: commit.sha }),
      });
      if (!createRef.ok) {
        avisos.push(`ref: ${(await createRef.text()).slice(0, 160)}`);
      } else {
        passos.push("github:branch_criada");
      }
    } else {
      passos.push("github:commit_pacote");
    }
  } catch (e) {
    avisos.push(e instanceof Error ? e.message : "falha git data api");
  }

  const commitOk = passos.some((p) => p === "github:commit_pacote" || p === "github:branch_criada");
  return {
    ok: commitOk,
    repo: full,
    htmlUrl,
    cloneUrl,
    passos,
    avisos: commitOk
      ? avisos
      : [...avisos, ...(passos.some((p) => p.startsWith("github:")) ? ["Repo pode existir, mas o commit do pacote não concluiu."] : [])],
  };
}
