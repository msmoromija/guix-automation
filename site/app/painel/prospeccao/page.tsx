"use client";

import { Suspense, useEffect, useRef, useState } from "react";

type StatusLead = "novo" | "mensagem_gerada" | "enviado" | "respondeu" | "descartado";

type EventoLead = {
  em: string;
  tipo: StatusLead | "observacao";
  conta_whatsapp?: string | null;
  conta_nome?: string | null;
  mensagem?: string | null;
  observacao?: string | null;
};

type Lead = {
  id: string;
  nome: string;
  telefone: string;
  cidade: string;
  nicho: string;
  endereco: string;
  categoria?: string;
  site?: string | null;
  email?: string | null;
  status: StatusLead;
  data_ultimo_contato: string | null;
  conta_whatsapp: string | null;
  modelo_usado: string | null;
  mensagem_gerada: string | null;
  observacoes: string;
  congelado?: boolean;
  arquivado?: boolean;
  external_id: string | null;
  fonte: string;
  created_at: string;
  updated_at: string;
  historico?: EventoLead[];
};

type EnvioRegistro = {
  id: string;
  em: string;
  lead_id: string;
  nome: string;
  telefone: string;
  nicho: string;
  conta_id: string;
  conta_nome: string;
  mensagem: string;
  canal?: "link" | "cloud_api";
  wamid?: string | null;
  status?: string | null;
  erro?: string | null;
};

type MensagemRecebida = {
  id: string;
  wamid: string;
  em: string;
  de: string;
  nome_contato?: string | null;
  texto: string;
  tipo: string;
  conta_id?: string | null;
  conta_nome?: string | null;
  lead_id?: string | null;
};

type Conta = {
  id: string;
  nome: string;
  limite_diario: number;
  enviados_hoje: number;
  provedor?: "manual" | "cloud_api";
  phone_number_id?: string | null;
  display_phone_number?: string | null;
  waba_id?: string | null;
  status_conexao?: "desconectada" | "conectada" | "erro";
  conectada?: boolean;
  conectada_em?: string | null;
};

type Meta = {
  configurado: boolean;
  embedded_signup: boolean;
  app_id: string;
  config_id: string;
};

declare global {
  interface Window {
    FB?: {
      init: (o: Record<string, unknown>) => void;
      login: (cb: (r: { authResponse?: { code?: string } }) => void, o: Record<string, unknown>) => void;
    };
    fbAsyncInit?: () => void;
  }
}

type NichoCfg = {
  slug: string;
  nome: string;
  modelo_url: string;
  termos_busca: string[];
};

type Template = { id: string; nome: string; texto: string };

type ResultadoBusca = {
  nome: string;
  telefone: string;
  telefone_normalizado: string;
  endereco: string;
  cidade: string;
  categoria: string;
  site: string | null;
  email: string | null;
  external_id: string;
  lead_id: string | null;
  status: StatusLead;
  ja_contatado: boolean;
  contatado_recentemente: boolean;
  congelado: boolean;
  arquivado: boolean;
};

type BuscaExecucao = {
  id: string;
  em: string;
  numero: number;
  termo: string;
  filtros: { soComTelefone: boolean; soNovos: boolean; naoContatados: boolean };
  totalBruto: number;
  totalExibido: number;
  ids: string[];
  /** Resultados exibidos nesta execução (permite reabrir a "Busca N"). */
  resultados?: ResultadoBusca[];
};

type SessaoBusca = {
  nicho: string;
  cidade: string;
  atualizadoEm: string;
  resultados: ResultadoBusca[];
  buscas: BuscaExecucao[];
};

type Config = {
  api: { provedor: string; chave: string; endpoint_busca: string; endpoint_detalhes: string };
  contas: Conta[];
  nichos: NichoCfg[];
  templates: Template[];
  template_ativo: string;
  periodo_recontato_dias: number;
  remetente?: string;
};

const STORAGE_KEY = "guix.prospeccao.senha";

const STATUS_META: Record<StatusLead, { label: string; cor: string }> = {
  novo: { label: "Novo", cor: "bg-sky-100 text-sky-800" },
  mensagem_gerada: { label: "Mensagem gerada", cor: "bg-violet-100 text-violet-800" },
  enviado: { label: "Enviado", cor: "bg-amber-100 text-amber-800" },
  respondeu: { label: "Respondeu", cor: "bg-emerald-100 text-emerald-800" },
  descartado: { label: "Descartado", cor: "bg-slate-200 text-slate-600" },
};

const EVENTO_META: Record<StatusLead | "observacao", { label: string; cor: string }> = {
  ...STATUS_META,
  observacao: { label: "Observação", cor: "bg-slate-100 text-slate-700" },
};

function inicial(chave: string) {
  return chave.slice(0, 2).toUpperCase();
}

function PainelProspeccao() {
  const [senha, setSenha] = useState("");
  const [senhaDigitada, setSenhaDigitada] = useState("");
  const [liberado, setLiberado] = useState(false);

  const [config, setConfig] = useState<Config | null>(null);
  const [contas, setContas] = useState<Conta[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [envios, setEnvios] = useState<EnvioRegistro[]>([]);
  const [mensagens, setMensagens] = useState<MensagemRecebida[]>([]);

  const [nicho, setNicho] = useState("dentista");
  const [cidade, setCidade] = useState("");
  const [soComTelefone, setSoComTelefone] = useState(true);
  const [soNovos, setSoNovos] = useState(true);
  const [naoContatados, setNaoContatados] = useState(false);

  const [resultados, setResultados] = useState<ResultadoBusca[]>([]);
  const [totalBruto, setTotalBruto] = useState(0);
  const [buscando, setBuscando] = useState(false);

  // Histórico de buscas por nicho+cidade (Busca 1, Busca 2…) e qual está aberta.
  const [sessoes, setSessoes] = useState<SessaoBusca[]>([]);
  const [buscaAtual, setBuscaAtual] = useState<{ numero: number; termo: string } | null>(null);
  /** Mostra também os leads congelados e removidos (fora da fila principal). */
  const [mostrarOcultos, setMostrarOcultos] = useState(false);

  // Paginação dos leads encontrados: menos por tela no celular, mais no PC.
  const [porPagina, setPorPagina] = useState<number>(() =>
    typeof window !== "undefined" && window.innerWidth >= 1024 ? 15 : 5,
  );
  const [paginaAtual, setPaginaAtual] = useState(1);

  const [leadSelecionado, setLeadSelecionado] = useState<Lead | null>(null);
  const [mensagem, setMensagem] = useState("");
  const [whatsappUrl, setWhatsappUrl] = useState("");
  const [gerandoMsg, setGerandoMsg] = useState(false);

  // Zoom do texto da mensagem (passos de 2px).
  const [zoomMsg, setZoomMsg] = useState(0);
  const tamanhoMensagem = `calc(1rem + ${zoomMsg * 2}px)`;

  const [contaEnvio, setContaEnvio] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [salvandoObs, setSalvandoObs] = useState(false);

  const [erro, setErro] = useState("");
  const [ok, setOk] = useState("");
  const [uso, setUso] = useState<{ mes: string; buscas: number; limite_mensal: number } | null>(null);

  const [abaConfig, setAbaConfig] = useState(false);

  // Conexão real da conta WhatsApp Business (Embedded Signup + fallback manual).
  const [meta, setMeta] = useState<Meta | null>(null);
  const [conectando, setConectando] = useState(false);
  const [manualAberto, setManualAberto] = useState(false);
  const [manualNumeroId, setManualNumeroId] = useState("");
  const [manualToken, setManualToken] = useState("");
  const [manualWaba, setManualWaba] = useState("");
  const [manualNome, setManualNome] = useState("");

  // Restaura a última busca apenas uma vez, na primeira carga do painel.
  const restauradoRef = useRef(false);
  // Preenchido pelo postMessage do Embedded Signup (waba_id/phone_number_id).
  const signupRef = useRef<{ waba_id: string; phone_number_id: string }>({
    waba_id: "",
    phone_number_id: "",
  });

  useEffect(() => {
    try {
      const salva = sessionStorage.getItem(STORAGE_KEY) || "";
      if (salva) {
        setSenha(salva);
        setLiberado(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (liberado && senha) void carregarTudo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liberado, senha]);

  // Carrega o SDK do Facebook quando o Embedded Signup estiver disponível.
  useEffect(() => {
    if (!liberado || !meta?.embedded_signup || !meta.app_id) return;
    if (typeof document === "undefined" || document.getElementById("facebook-jssdk")) return;
    window.fbAsyncInit = function init() {
      window.FB?.init({
        appId: meta.app_id,
        autoLogAppEvents: true,
        xfbml: false,
        version: "v21.0",
      });
    };
    const script = document.createElement("script");
    script.id = "facebook-jssdk";
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.async = true;
    script.defer = true;
    script.crossOrigin = "anonymous";
    document.body.appendChild(script);
  }, [liberado, meta]);

  // Captura waba_id/phone_number_id que o popup do Embedded Signup envia por postMessage.
  useEffect(() => {
    function onMessage(event: MessageEvent) {
      let host = "";
      try {
        host = new URL(event.origin).hostname;
      } catch {
        return;
      }
      if (!host.endsWith("facebook.com")) return;
      try {
        const dados = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        if (dados?.type === "WA_EMBEDDED_SIGNUP" && dados?.event === "FINISH" && dados?.data) {
          signupRef.current = {
            waba_id: String(dados.data.waba_id || ""),
            phone_number_id: String(dados.data.phone_number_id || ""),
          };
        }
      } catch {
        /* ignore */
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // No celular, a mensagem abre em tela cheia (overlay) — trava o scroll do fundo.
  // No desktop (lg+) a mensagem fica na coluna da direita e o scroll segue normal.
  useEffect(() => {
    if (!leadSelecionado) return;
    if (typeof window === "undefined" || window.innerWidth >= 1024) return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = anterior;
    };
  }, [leadSelecionado]);

  // Ajusta a quantidade de leads por página conforme a largura da tela.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const atualizar = () => {
      const w = window.innerWidth;
      setPorPagina(w >= 1024 ? 15 : w >= 768 ? 10 : 5);
    };
    atualizar();
    window.addEventListener("resize", atualizar);
    return () => window.removeEventListener("resize", atualizar);
  }, []);

  // Volta para a página 1 sempre que chega um novo conjunto de resultados.
  useEffect(() => {
    setPaginaAtual(1);
  }, [resultados]);

  const headers = () => ({
    "Content-Type": "application/json",
    "x-painel-token": senha,
  });

  async function carregarTudo() {
    setErro("");
    const res = await fetch("/api/painel/prospeccao", { headers: headers() });
    const j = await res.json();
    if (!res.ok) {
      setErro(j.erro || "Senha incorreta.");
      setLiberado(false);
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
      return;
    }
    setConfig(j.config);
    setContas(j.contas || []);
    setLeads(j.leads || []);
    setEnvios(j.envios || []);
    setMensagens(j.mensagens || []);
    if (j.meta) setMeta(j.meta);
    if (j.uso) setUso(j.uso);

    const listaSessoes = (j.sessoes_busca as SessaoBusca[]) || [];
    setSessoes(listaSessoes);

    // Nicho, conta de envio e a busca aberta só são inicializados uma vez.
    // Assim recargas disparadas por outras ações não resetam o que o usuário
    // selecionou (o dropdown agora tem vários nichos).
    if (!restauradoRef.current) {
      restauradoRef.current = true;
      if (j.contas?.[0]?.id) setContaEnvio(j.contas[0].id);
      const maisRecente = [...listaSessoes].sort(
        (a, b) => new Date(b.atualizadoEm).getTime() - new Date(a.atualizadoEm).getTime(),
      )[0];
      if (maisRecente && (maisRecente.resultados?.length || 0) > 0) {
        abrirSessao(maisRecente, false);
      } else if (j.config?.nichos?.[0]?.slug) {
        setNicho(j.config.nichos[0].slug);
      }
    }
  }

  /** Recarrega só a lista de leads (usado após uma busca que salva leads). */
  async function recarregarLeads() {
    const res = await fetch("/api/painel/prospeccao", { headers: headers() });
    const j = await res.json();
    if (res.ok) setLeads(j.leads || []);
  }

  /**
   * Abre uma sessão do histórico de buscas (cidade+nicho): mostra os
   * resultados da última busca daquela cidade, sem gastar cota da API.
   */
  function abrirBusca(s: SessaoBusca, b: BuscaExecucao, avisar = true) {
    const ultima = s.buscas[s.buscas.length - 1];
    // Buscas antigas podem não ter os resultados arquivados: nesse caso só a
    // última busca tem como ser restaurada (via `s.resultados`).
    const ress = (b.resultados?.length ? b.resultados : b.id === ultima?.id ? s.resultados : []) as ResultadoBusca[];
    setResultados(ress);
    setTotalBruto(b.totalBruto || ress.length);
    setNicho(s.nicho);
    setCidade(s.cidade);
    setBuscaAtual({ numero: b.numero, termo: b.termo });
    if (b.filtros) {
      setSoComTelefone(b.filtros.soComTelefone);
      setSoNovos(b.filtros.soNovos);
      setNaoContatados(b.filtros.naoContatados);
    }
    setPaginaAtual(1);
    if (avisar) {
      setOk(
        ress.length
          ? `${s.cidade} · ${nomeDoNicho(s.nicho)} — Busca ${b.numero} (${b.termo}): ${ress.length} resultado(s), sem gastar cota.`
          : `${s.cidade} · ${nomeDoNicho(s.nicho)} — Busca ${b.numero} (${b.termo}) sem resultados arquivados (busca feita antes da atualização).`,
      );
    }
  }

  function abrirSessao(s: SessaoBusca, avisar = true) {
    const ultima = s.buscas[s.buscas.length - 1];
    if (ultima) {
      abrirBusca(s, ultima, avisar);
      return;
    }
    // Sessão antiga, sem execuções registradas.
    const ress = (s.resultados || []) as ResultadoBusca[];
    setResultados(ress);
    setTotalBruto(ress.length);
    setNicho(s.nicho);
    setCidade(s.cidade);
    setBuscaAtual(null);
    setPaginaAtual(1);
    if (avisar) {
      setOk(`${s.cidade} · ${nomeDoNicho(s.nicho)} — ${ress.length} resultado(s) salvos (sem gastar cota).`);
    }
  }

  /** Nome amigável do nicho a partir do slug. */
  function nomeDoNicho(slug: string) {
    return config?.nichos.find((n) => n.slug === slug)?.nome || slug;
  }

  function entrar(e: React.FormEvent) {
    e.preventDefault();
    const s = senhaDigitada.trim();
    if (!s) {
      setErro("Digite a senha do painel.");
      return;
    }
    setSenha(s);
    setLiberado(true);
    try {
      sessionStorage.setItem(STORAGE_KEY, s);
    } catch {
      /* ignore */
    }
  }

  function sair() {
    setLiberado(false);
    setSenha("");
    setSenhaDigitada("");
    setConfig(null);
    setLeads([]);
    setContas([]);
    setResultados([]);
    setMensagens([]);
    setSessoes([]);
    setBuscaAtual(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }

  // —— Conexão da conta WhatsApp Business ——

  /** Abre o popup do Embedded Signup e conclui a conexão no servidor. */
  async function conectarComFacebook() {
    setErro("");
    setOk("");
    if (!meta?.embedded_signup || !meta.app_id || !meta.config_id) {
      setErro("Embedded Signup não configurado. Use a conexão manual abaixo.");
      return;
    }
    if (!window.FB) {
      setErro("SDK do Facebook ainda não carregou. Aguarde um instante e tente novamente.");
      return;
    }
    signupRef.current = { waba_id: "", phone_number_id: "" };
    setConectando(true);
    try {
      const resposta = await new Promise<{ authResponse?: { code?: string } }>((resolve) => {
        window.FB!.login((r) => resolve(r || {}), {
          config_id: meta.config_id,
          response_type: "code",
          override_default_response_type: true,
          extras: { setup: {}, featureType: "", sessionInfoVersion: "3" },
        });
      });
      const code = resposta?.authResponse?.code;
      if (!code) {
        setErro("Conexão cancelada ou sem código de autorização.");
        return;
      }
      await finalizarConexao(code, signupRef.current.waba_id, signupRef.current.phone_number_id);
    } finally {
      setConectando(false);
    }
  }

  async function finalizarConexao(code: string, wabaId: string, phoneNumberId: string) {
    const res = await fetch("/api/painel/prospeccao/whatsapp/conectar", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ code, waba_id: wabaId, phone_number_id: phoneNumberId }),
    });
    const j = await res.json();
    if (!res.ok) {
      setErro(j.erro || "Não foi possível concluir a conexão.");
      return;
    }
    setOk(j.aviso ? `Conta conectada. ${j.aviso}` : "Conta WhatsApp Business conectada com sucesso.");
    await carregarTudo();
  }

  /** Conexão manual: cola o phone_number_id + token de System User. */
  async function conectarManual(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setOk("");
    if (!manualNumeroId.trim() || !manualToken.trim()) {
      setErro("Informe o phone_number_id e o token de acesso.");
      return;
    }
    setConectando(true);
    try {
      const res = await fetch("/api/painel/prospeccao/whatsapp/manual", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          phone_number_id: manualNumeroId.trim(),
          token: manualToken.trim(),
          waba_id: manualWaba.trim(),
          nome: manualNome.trim(),
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        setErro(j.erro || "Não foi possível validar/conectar o número.");
        return;
      }
      setOk(`Conta "${j.conta?.nome || "WhatsApp"}" conectada.`);
      setManualNumeroId("");
      setManualToken("");
      setManualWaba("");
      setManualNome("");
      setManualAberto(false);
      await carregarTudo();
    } finally {
      setConectando(false);
    }
  }

  async function desconectarConta(id: string, nome: string) {
    if (!window.confirm(`Desconectar "${nome}"? O recebimento de mensagens e os status de entrega serão interrompidos.`)) return;
    setErro("");
    setOk("");
    const res = await fetch("/api/painel/prospeccao/whatsapp/desconectar", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ id }),
    });
    const j = await res.json();
    if (!res.ok) {
      setErro(j.erro || "Não foi possível desconectar.");
      return;
    }
    setOk(`Conta "${nome}" desconectada.`);
    await carregarTudo();
  }

  async function buscar(e?: React.FormEvent) {
    e?.preventDefault();
    setErro("");
    setOk("");
    if (!nicho || !cidade) {
      setErro("Selecione o nicho e digite a cidade.");
      return;
    }
    setBuscando(true);
    try {
      const res = await fetch("/api/painel/prospeccao/buscar", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          nicho,
          cidade,
          soComTelefone,
          excluirContatados: soNovos,
          excluirRecontato: naoContatados,
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        setErro(j.erro || "Falha na busca.");
        return;
      }
      setResultados(j.resultados || []);
      setPaginaAtual(1);
      setTotalBruto(j.total_bruto || j.resultados?.length || 0);
      if (j.uso) setUso(j.uso);
      if (j.busca) setBuscaAtual({ numero: j.busca.numero, termo: j.busca.termo });
      if (j.sessao) {
        const sessaoNova = j.sessao as SessaoBusca;
        setSessoes((atual) => {
          const outras = atual.filter((s) => !(s.nicho === sessaoNova.nicho && s.cidade === sessaoNova.cidade));
          return [sessaoNova, ...outras];
        });
      }
      const salvos = Number(j.leads_salvos || 0);
      const repetidos = Number(j.repetidos || 0);
      setOk(
        `Busca ${j.busca?.numero || 1} (${j.busca?.termo || nicho}): ${j.total} resultado(s) novo(s)` +
          (repetidos ? `, ${repetidos} já exibido(s) anteriormente ignorado(s)` : "") +
          "." +
          (salvos ? ` ${salvos} salvo(s) no Histórico de leads.` : "") +
          (j.aviso ? ` ${j.aviso}` : ""),
      );
      // Os resultados já ficaram salvos como leads no servidor — atualiza a lista.
      if (salvos) await recarregarLeads();
    } finally {
      setBuscando(false);
    }
  }

  async function gerarMensagem(r: ResultadoBusca) {
    setErro("");
    setOk("");
    setGerandoMsg(true);
    setLeadSelecionado(null);
    setMensagem("");
    setWhatsappUrl("");
    try {
      const res = await fetch("/api/painel/prospeccao/lead", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          nome: r.nome,
          telefone: r.telefone,
          cidade: r.cidade,
          nicho,
          endereco: r.endereco,
          categoria: r.categoria,
          site: r.site,
          email: r.email,
          external_id: r.external_id,
          fonte: "google",
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        setErro(j.erro || "Não foi possível gerar a mensagem.");
        return;
      }
      setLeadSelecionado(j.lead);
      setMensagem(j.mensagem);
      setWhatsappUrl(j.whatsapp_url);
      setObservacoes(j.lead.observacoes || "");
      setContaEnvio(j.lead.conta_whatsapp || contas[0]?.id || "");
      setOk(`Mensagem gerada para ${j.lead.nome}.`);
      await carregarTudo();
    } finally {
      setGerandoMsg(false);
    }
  }

  async function gerarMensagemDeLead(lead: Lead) {
    setErro("");
    setOk("");
    setGerandoMsg(true);
    setLeadSelecionado(null);
    setMensagem("");
    setWhatsappUrl("");
    try {
      const res = await fetch("/api/painel/prospeccao/lead", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ id: lead.id }),
      });
      const j = await res.json();
      if (!res.ok) {
        setErro(j.erro || "Não foi possível gerar a mensagem.");
        return;
      }
      setLeadSelecionado(j.lead);
      setMensagem(j.mensagem);
      setWhatsappUrl(j.whatsapp_url);
      setObservacoes(j.lead.observacoes || "");
      setContaEnvio(j.lead.conta_whatsapp || contas[0]?.id || "");
      setOk(`Mensagem gerada para ${j.lead.nome}.`);
      await carregarTudo();
    } finally {
      setGerandoMsg(false);
    }
  }

  /**
   * Remover/Restaurar (soft delete): o lead sai da fila principal sem perder
   * nada — segue salvo no R2 e volta com "Mostrar congelados e removidos" ligado.
   */
  async function alternarArquivado(alvo: { id: string; nome: string }, arquivar: boolean) {
    setErro("");
    setOk("");
    try {
      const res = await fetch("/api/painel/prospeccao/lead", {
        method: "PATCH",
        headers: headers(),
        body: JSON.stringify({ id: alvo.id, arquivado: arquivar }),
      });
      const j = await res.json();
      if (!res.ok) {
        setErro(j.erro || "Não foi possível atualizar o lead.");
        return;
      }
      // Reflete na lista em tela sem precisar de nova busca.
      setResultados((atual) =>
        atual.map((r) => (r.lead_id === alvo.id ? { ...r, arquivado: arquivar } : r)),
      );
      setLeads((atual) => atual.map((l) => (l.id === alvo.id ? { ...l, arquivado: arquivar } : l)));
      if (arquivar && leadSelecionado?.id === alvo.id) {
        setLeadSelecionado(null);
        setMensagem("");
        setWhatsappUrl("");
      }
      setOk(
        arquivar
          ? `"${alvo.nome}" removido da fila — dá para restaurar em “Mostrar removidos”.`
          : `"${alvo.nome}" restaurado para a fila.`,
      );
      await carregarTudo();
    } catch {
      setErro("Falha de rede ao atualizar o lead.");
    }
  }

  /** Exclusão definitiva (não reversível) — só para leads já removidos. */
  async function excluirDefinitivo(lead: Lead) {
    if (!window.confirm(`Excluir "${lead.nome}" definitivamente? Esta ação não pode ser desfeita.`)) return;
    setErro("");
    setOk("");
    try {
      const res = await fetch("/api/painel/prospeccao/lead", {
        method: "DELETE",
        headers: headers(),
        body: JSON.stringify({ id: lead.id }),
      });
      const j = await res.json();
      if (!res.ok) {
        setErro(j.erro || "Não foi possível excluir o lead.");
        return;
      }
      if (leadSelecionado?.id === lead.id) {
        setLeadSelecionado(null);
        setMensagem("");
        setWhatsappUrl("");
      }
      setOk(`Lead "${lead.nome}" excluído definitivamente.`);
      await carregarTudo();
    } catch {
      setErro("Falha de rede ao excluir o lead.");
    }
  }

  async function copiarMensagem() {
    if (!mensagem) return;
    try {
      await navigator.clipboard.writeText(mensagem);
      setOk("Mensagem copiada.");
    } catch {
      setErro("Não foi possível copiar. Selecione o texto manualmente.");
    }
  }

  async function marcarEnviado() {
    if (!leadSelecionado) return;
    if (!contaEnvio) {
      setErro("Escolha a conta WhatsApp usada.");
      return;
    }
    setErro("");
    setOk("");
    const res = await fetch("/api/painel/prospeccao/lead", {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify({
        id: leadSelecionado.id,
        marcar_enviado: true,
        conta_whatsapp: contaEnvio,
        observacoes,
      }),
    });
    const j = await res.json();
    if (!res.ok) {
      setErro(j.erro || "Não foi possível marcar como enviado.");
      return;
    }
    setLeadSelecionado(j.lead);
    setContas(j.contas || contas);
    if (j.envios) setEnvios(j.envios);
    setOk(j.enviado_registrado ? "Envio registrado. Contador atualizado." : "Envio já registrado hoje (não duplicado).");
    await carregarTudo();
  }

  /**
   * Abre o WhatsApp e registra o envio automaticamente na conta escolhida:
   * grava o texto exato no log de envios (R2) e soma no contador da conta.
   * O envio é idempotente por dia — abrir duas vezes não duplica o contador.
   */
  async function abrirWhatsApp() {
    if (!leadSelecionado) return;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    if (!contaEnvio) {
      setErro("Envio aberto, mas escolha a conta WhatsApp para registrar no painel.");
      return;
    }
    setErro("");
    try {
      const res = await fetch("/api/painel/prospeccao/lead", {
        method: "PATCH",
        headers: headers(),
        body: JSON.stringify({
          id: leadSelecionado.id,
          marcar_enviado: true,
          conta_whatsapp: contaEnvio,
          observacoes,
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        setErro(j.erro || "Enviado, mas não foi possível registrar no painel.");
        return;
      }
      setLeadSelecionado(j.lead);
      setContas(j.contas || contas);
      if (j.envios) setEnvios(j.envios);
      setOk(j.enviado_registrado ? "Envio registrado automaticamente na conta escolhida." : "Envio já constava hoje (não duplicado).");
      void carregarTudo();
    } catch {
      setErro("Enviado, mas falhou o registro no painel.");
    }
  }

  /**
   * Congela/descongela o lead: sai da fila principal (vai para o fim da lista
   * e só aparece com "Mostrar congelados" ligado).
   */
  async function alternarCongelado(alvo: { id: string; nome: string }, congelar: boolean) {
    setErro("");
    try {
      const res = await fetch("/api/painel/prospeccao/lead", {
        method: "PATCH",
        headers: headers(),
        body: JSON.stringify({ id: alvo.id, congelado: congelar }),
      });
      const j = await res.json();
      if (!res.ok) {
        setErro(j.erro || "Não foi possível atualizar o lead.");
        return;
      }
      if (leadSelecionado?.id === alvo.id) setLeadSelecionado(j.lead);
      // Reflete na lista de resultados em tela sem precisar de nova busca.
      setResultados((atual) =>
        atual.map((r) => (r.lead_id === alvo.id ? { ...r, congelado: congelar } : r)),
      );
      setLeads((atual) => atual.map((l) => (l.id === alvo.id ? { ...l, congelado: congelar } : l)));
      setOk(congelar ? `"${alvo.nome}" congelado (fora da fila principal).` : `"${alvo.nome}" descongelado.`);
      await carregarTudo();
    } catch {
      setErro("Falha de rede ao atualizar o lead.");
    }
  }

  async function salvarObservacoes() {
    if (!leadSelecionado) return;
    setSalvandoObs(true);
    setErro("");
    try {
      const res = await fetch("/api/painel/prospeccao/lead", {
        method: "PATCH",
        headers: headers(),
        body: JSON.stringify({ id: leadSelecionado.id, observacoes }),
      });
      const j = await res.json();
      if (!res.ok) {
        setErro(j.erro || "Não salvou as observações.");
        return;
      }
      setLeadSelecionado(j.lead);
      setOk("Observações salvas.");
    } finally {
      setSalvandoObs(false);
    }
  }

  async function mudarStatus(status: StatusLead) {
    if (!leadSelecionado) return;
    setErro("");
    const res = await fetch("/api/painel/prospeccao/lead", {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify({ id: leadSelecionado.id, status, observacoes }),
    });
    const j = await res.json();
    if (!res.ok) {
      setErro(j.erro || "Não atualizou o status.");
      return;
    }
    setLeadSelecionado(j.lead);
    setOk(`Status → ${STATUS_META[status].label}.`);
    await carregarTudo();
  }

  /** Fecha a tela da mensagem (usado no celular). */
  function fecharMensagem() {
    setLeadSelecionado(null);
    setMensagem("");
    setWhatsappUrl("");
  }

  if (!liberado) {
    return (
      <main className="mx-auto max-w-md px-5 py-16">
        <p className="text-xs font-semibold tracking-[0.16em] text-accent">GUIX ADMIN</p>
        <h1 className="mt-2 text-3xl font-bold">Prospecção</h1>
        <p className="mt-2 text-sm text-muted">Acesso restrito ao time comercial.</p>
        <form onSubmit={entrar} className="mt-8 space-y-4 rounded-2xl border border-line bg-white p-6">
          <label className="block text-sm font-semibold">
            Senha
            <input
              className="mt-1.5 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-accent"
              type="password"
              autoComplete="current-password"
              value={senhaDigitada}
              onChange={(e) => setSenhaDigitada(e.target.value)}
              required
            />
          </label>
          {erro ? <p className="text-sm text-rose-700">{erro}</p> : null}
          <button
            type="submit"
            className="w-full rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white hover:bg-accent-dark"
          >
            Entrar
          </button>
        </form>
      </main>
    );
  }

  const campo =
    "mt-1.5 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-accent";

  // Fora da fila: 0 = normal, 1 = congelado, 2 = removido. Vão para o fim e só
  // aparecem com "Mostrar congelados e removidos" ligado.
  const ordem = (o: { congelado?: boolean; arquivado?: boolean }) =>
    o.arquivado ? 2 : o.congelado ? 1 : 0;

  const resultadosOrdenados = [...resultados].sort((a, b) => ordem(a) - ordem(b));
  const resultadosVisiveis = mostrarOcultos
    ? resultadosOrdenados
    : resultadosOrdenados.filter((r) => ordem(r) === 0);
  const resultadosOcultosCount = resultados.filter((r) => ordem(r) > 0).length;

  const leadsOrdenados = [...leads].sort((a, b) => ordem(a) - ordem(b));
  const leadsVisiveis = mostrarOcultos ? leadsOrdenados : leadsOrdenados.filter((l) => ordem(l) === 0);
  const leadsOcultosCount = leads.filter((l) => ordem(l) > 0).length;

  // Sessões de busca agrupadas por nicho (acesso ao histórico por nicho).
  const sessoesPorNicho = sessoes.reduce<Record<string, SessaoBusca[]>>((acc, s) => {
    (acc[s.nicho] = acc[s.nicho] || []).push(s);
    return acc;
  }, {});

  return (
    <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8">
      {/* Cabeçalho */}
      <header className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-accent">GUIX ADMIN</p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Prospecção de leads</h1>
          <p className="mt-1 text-sm text-muted">
            Busque negócios locais, gere mensagens personalizadas, acompanhe o histórico de contatos e as
            respostas recebidas no WhatsApp conectado.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a href="/painel/cupons" className="rounded-full border border-line px-4 py-2 text-xs font-semibold">
            Cupons
          </a>
          <a href="/painel/orcamentos" className="rounded-full border border-line px-4 py-2 text-xs font-semibold">
            Orçamentos
          </a>
          <a href="/painel/pedidos" className="rounded-full border border-line px-4 py-2 text-xs font-semibold">
            Pedidos / ZIP
          </a>
          <span className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold">
            {config?.remetente || "Equipe GuiX"}
          </span>
          <button
            type="button"
            onClick={sair}
            className="rounded-full border border-line px-4 py-2 text-xs font-semibold"
          >
            Sair
          </button>
        </div>
      </header>

      {erro ? <p className="mt-4 rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-700">{erro}</p> : null}
      {ok ? <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">{ok}</p> : null}

      {/* Layout principal */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[16rem_minmax(0,1fr)_24rem] xl:grid-cols-[18rem_minmax(0,1fr)_26rem]">
        {/* Coluna esquerda: filtros de busca.
            No celular usa `contents` para que cada card vire item do grid e possa
            ser reordenado (resultados logo abaixo dos filtros). */}
        <aside className="contents lg:block lg:space-y-4">
          <form
            onSubmit={buscar}
            className="order-1 rounded-2xl border border-line bg-white p-5 lg:order-none"
          >
            <h2 className="flex items-center gap-2 text-sm font-bold">
              <span>🔍</span> Filtros de busca
            </h2>

            <label className="mt-4 block text-sm font-semibold">
              Nicho
              <select
                className={campo}
                value={nicho}
                onChange={(e) => setNicho(e.target.value)}
              >
                {(config?.nichos || []).map((n) => (
                  <option key={n.slug} value={n.slug}>
                    {n.nome}
                  </option>
                ))}
              </select>
            </label>

            <label className="mt-3 block text-sm font-semibold">
              Cidade
              <input
                className={campo}
                placeholder="Aracaju"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
              />
            </label>

            <button
              type="submit"
              disabled={buscando}
              className="mt-4 w-full rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-60"
            >
              {buscando ? "Buscando…" : "Buscar"}
            </button>

            <p className="mt-3 text-xs text-muted">
              {resultados.length > 0 ? `${resultados.length} resultado(s) exibidos` : "Resultados aparecerão aqui."}
            </p>

            <div className="mt-4 space-y-2 border-t border-line pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Filtros rápidos</p>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={soNovos}
                  onChange={(e) => setSoNovos(e.target.checked)}
                />
                Só novos
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={soComTelefone}
                  onChange={(e) => setSoComTelefone(e.target.checked)}
                />
                Com telefone
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={naoContatados}
                  onChange={(e) => setNaoContatados(e.target.checked)}
                />
                Não contatados {config?.periodo_recontato_dias || 45} dias
              </label>
            </div>
          </form>

          {/* Cota mensal da API */}
          {uso ? (
            (() => {
              const pct = Math.min(100, Math.round((uso.buscas / uso.limite_mensal) * 100));
              const alerta = pct >= 80;
              const critico = pct >= 100;
              return (
                <div
                  className={`order-4 rounded-2xl border p-5 lg:order-none ${
                    critico
                      ? "border-rose-300 bg-rose-50"
                      : alerta
                        ? "border-amber-300 bg-amber-50"
                        : "border-line bg-white"
                  }`}
                >
                  <h2 className="flex items-center gap-2 text-sm font-bold">
                    <span>📡</span> Cota da API (mês)
                  </h2>
                  <p className="mt-1 text-[11px] text-muted">Google Places · Text Search (Enterprise)</p>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span
                      className={`font-mono text-xs ${
                        critico ? "text-rose-700" : alerta ? "text-amber-700" : "text-muted"
                      }`}
                    >
                      {uso.buscas} / {uso.limite_mensal} buscas
                    </span>
                    <span className="text-[10px] text-muted">{uso.mes}</span>
                  </div>
                  <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${
                        critico ? "bg-rose-500" : alerta ? "bg-amber-500" : "bg-accent"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {critico ? (
                    <p className="mt-2 text-xs text-rose-800">
                      Cota mensal esgotada. As buscas podem falhar até a renovação do plano.
                    </p>
                  ) : alerta ? (
                    <p className="mt-2 text-xs text-amber-800">
                      Cota quase esgotada. Evite buscas desnecessárias ou aumente o limite no Google Cloud.
                    </p>
                  ) : null}
                </div>
              );
            })()
          ) : null}

          {/* Contadores */}
          <div className="order-5 rounded-2xl border border-line bg-white p-5 lg:order-none">
            <h2 className="text-sm font-bold">Limite diário</h2>
            <p className="mt-1 text-xs text-muted">
              Contadores claros evitam excesso de envios e garantem conformidade com as políticas do WhatsApp.
            </p>
            <div className="mt-4 space-y-4">
              {contas.map((c) => {
                const pct = Math.min(100, Math.round((c.enviados_hoje / c.limite_diario) * 100));
                const perto = pct >= 80;
                return (
                  <div key={c.id}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold">{c.nome}</span>
                      <span className={`font-mono text-xs ${perto ? "text-rose-600" : "text-muted"}`}>
                        {c.enviados_hoje} / {c.limite_diario}
                      </span>
                    </div>
                    <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${perto ? "bg-rose-500" : "bg-accent"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted">Limite diário: {c.limite_diario} mensagens</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Histórico de nichos pesquisados e suas buscas (Busca 1, Busca 2…) */}
          {sessoes.length > 0 ? (
            <div className="order-3 rounded-2xl border border-line bg-white p-5 lg:order-none">
              <h2 className="flex items-center gap-2 text-sm font-bold">
                <span>🗂️</span> Nichos pesquisados
              </h2>
              <p className="mt-1 text-[11px] text-muted">
                Cada nicho mantém suas próprias buscas. Clique em uma cidade para reabrir o resultado sem gastar cota.
              </p>
              <div className="mt-3 space-y-3">
                {Object.entries(sessoesPorNicho).map(([slug, lista]) => (
                  <div key={slug}>
                    <p className="text-xs font-bold uppercase tracking-wide text-accent">{nomeDoNicho(slug)}</p>
                    <div className="mt-1.5 space-y-1.5">
                      {[...lista]
                        .sort((a, b) => new Date(b.atualizadoEm).getTime() - new Date(a.atualizadoEm).getTime())
                        .map((s) => {
                          const ativa =
                            nicho === s.nicho && s.cidade.trim().toLowerCase() === cidade.trim().toLowerCase();
                          const distintos = new Set(s.buscas.flatMap((b) => b.ids || [])).size;
                          return (
                            <div
                              key={`${s.nicho}-${s.cidade}`}
                              className={`rounded-xl border p-2.5 ${ativa ? "border-accent bg-accent/5" : "border-line"}`}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  abrirSessao(s);
                                  setPaginaAtual(1);
                                }}
                                className="flex w-full items-center justify-between gap-2 text-left"
                              >
                                <span className="truncate text-sm font-semibold">{s.cidade}</span>
                                <span className="shrink-0 text-[10px] text-muted">
                                  {s.buscas.length} busca(s) · {distintos} lead(s)
                                </span>
                              </button>
                              <div className="mt-1.5 flex flex-wrap gap-1">
                                {s.buscas.map((b) => {
                                  const ativa =
                                    nicho === s.nicho &&
                                    s.cidade.trim().toLowerCase() === cidade.trim().toLowerCase() &&
                                    buscaAtual?.numero === b.numero;
                                  return (
                                    <button
                                      key={b.id}
                                      type="button"
                                      onClick={() => abrirBusca(s, b)}
                                      title={`Termo: ${b.termo} · ${b.totalExibido} exibido(s) de ${b.totalBruto} bruto(s). Clique para reabrir sem gastar cota.`}
                                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                        ativa ? "bg-accent text-white" : "bg-canvas text-muted hover:bg-accent/10"
                                      }`}
                                    >
                                      Busca {b.numero} · {b.totalExibido}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </aside>

        {/* Coluna central: tabela de leads */}
        <section className="order-2 rounded-2xl border border-line bg-white lg:order-none">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
            <div className="min-w-0">
              <h2 className="text-sm font-bold">
                Leads encontrados ({resultadosVisiveis.length})
                {totalBruto > resultadosVisiveis.length ? (
                  <span className="ml-2 text-xs font-normal text-muted">
                    {totalBruto - resultadosVisiveis.length} filtrados
                  </span>
                ) : null}
              </h2>
              {buscaAtual && resultados.length > 0 ? (
                <p className="mt-1 truncate text-xs text-muted">
                  {nomeDoNicho(nicho)} · {cidade} — Busca {buscaAtual.numero} (termo: {buscaAtual.termo})
                </p>
              ) : null}
            </div>
            {resultadosOcultosCount > 0 ? (
              <label className="flex shrink-0 cursor-pointer items-center gap-2 rounded-full border border-line px-3 py-1.5 text-xs font-semibold hover:border-accent">
                <input
                  type="checkbox"
                  checked={mostrarOcultos}
                  onChange={(e) => {
                    setMostrarOcultos(e.target.checked);
                    setPaginaAtual(1);
                  }}
                />
                Mostrar congelados e removidos ({resultadosOcultosCount})
              </label>
            ) : null}
          </div>

          {resultadosVisiveis.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted">
              {buscando
                ? "Buscando…"
                : resultados.length > 0
                  ? "Todos os resultados desta busca estão congelados ou removidos. Marque “Mostrar congelados e removidos” para vê-los."
                  : "Selecione nicho e cidade para buscar leads."}
            </div>
          ) : (
            (() => {
              const totalPaginas = Math.max(1, Math.ceil(resultadosVisiveis.length / porPagina));
              const pagina = Math.min(paginaAtual, totalPaginas);
              const inicio = (pagina - 1) * porPagina;
              const resultadosPagina = resultadosVisiveis.slice(inicio, inicio + porPagina);
              return (
                <>
                  {/* Desktop: tabela com scroll interno */}
                  <div className="hidden max-h-[60vh] overflow-auto md:block">
                    <table className="w-full text-left text-sm">
                      <thead className="sticky top-0 z-10 bg-canvas text-xs uppercase tracking-wide text-muted">
                        <tr>
                          <th className="px-5 py-3 font-semibold">Nome</th>
                          <th className="px-3 py-3 font-semibold">Telefone</th>
                          <th className="px-3 py-3 font-semibold">Endereço</th>
                          <th className="px-3 py-3 font-semibold">Contato</th>
                          <th className="px-3 py-3 font-semibold">Status</th>
                          <th className="px-5 py-3 text-right font-semibold">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {resultadosPagina.map((r, i) => (
                          <tr key={`${r.external_id}-${inicio + i}`} className="hover:bg-canvas/50">
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-3">
                                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent/10 text-xs font-bold text-accent">
                                  {inicial(r.nome)}
                                </span>
                                <div className="min-w-0">
                                  <p className="truncate font-semibold">{r.nome}</p>
                                  {r.categoria ? (
                                    <p className="truncate text-xs text-muted">{r.categoria}</p>
                                  ) : null}
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-3 font-mono text-xs">{r.telefone || "—"}</td>
                            <td className="px-3 py-3 text-xs text-muted">
                              <span className="line-clamp-2">{r.endereco || "—"}</span>
                            </td>
                            <td className="px-3 py-3 text-xs">
                              {r.email || r.site ? (
                                <div className="space-y-0.5">
                                  {r.email ? (
                                    <a
                                      href={`mailto:${r.email}`}
                                      className="block max-w-[12rem] truncate text-accent hover:underline"
                                      title={r.email}
                                    >
                                      {r.email}
                                    </a>
                                  ) : null}
                                  {r.site ? (
                                    <a
                                      href={r.site}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="block max-w-[12rem] truncate text-accent hover:underline"
                                      title={r.site}
                                    >
                                      Site ↗
                                    </a>
                                  ) : null}
                                </div>
                              ) : (
                                <span className="text-muted">—</span>
                              )}
                            </td>
                            <td className="px-3 py-3">
                              <span
                                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_META[r.status].cor}`}
                              >
                                {STATUS_META[r.status].label}
                              </span>
                              {r.contatado_recentemente ? (
                                <p className="mt-1 text-[10px] text-rose-600">contatado recentemente</p>
                              ) : null}
                              {r.congelado ? (
                                <p className="mt-1 text-[10px] font-semibold text-amber-700">congelado</p>
                              ) : null}
                              {r.arquivado ? (
                                <p className="mt-1 text-[10px] font-semibold text-rose-600">removido</p>
                              ) : null}
                            </td>
                            <td className="px-5 py-3">
                              <div className="flex flex-wrap justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => void gerarMensagem(r)}
                                  disabled={gerandoMsg}
                                  className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold hover:border-accent hover:text-accent disabled:opacity-50"
                                >
                                  Gerar mensagem
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    r.lead_id && void alternarCongelado({ id: r.lead_id, nome: r.nome }, !r.congelado)
                                  }
                                  disabled={!r.lead_id || r.arquivado}
                                  title={
                                    !r.lead_id
                                      ? "Disponível após salvar o lead"
                                      : r.arquivado
                                        ? "Restaure o lead para poder congelar"
                                        : undefined
                                  }
                                  className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-slate-400 hover:bg-canvas disabled:opacity-40"
                                >
                                  {r.congelado ? "Descongelar" : "Congelar"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    r.lead_id &&
                                    void alternarArquivado({ id: r.lead_id, nome: r.nome }, !r.arquivado)
                                  }
                                  disabled={!r.lead_id}
                                  title={
                                    r.lead_id
                                      ? r.arquivado
                                        ? "Restaurar para a fila"
                                        : "Remover da fila (dá para restaurar depois)"
                                      : "Disponível após salvar o lead"
                                  }
                                  className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-rose-600 hover:border-rose-400 hover:bg-rose-50 disabled:opacity-40"
                                >
                                  {r.arquivado ? "Restaurar" : "Remover"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile: cartões */}
                  <ul className="divide-y divide-line md:hidden">
                    {resultadosPagina.map((r, i) => (
                      <li
                        key={`${r.external_id}-${inicio + i}`}
                        className={`space-y-2.5 p-4 ${
                          r.arquivado ? "bg-rose-50/60" : r.congelado ? "bg-amber-50/60" : ""
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent/10 text-sm font-bold text-accent">
                            {inicial(r.nome)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-base font-semibold">{r.nome}</p>
                            {r.categoria ? <p className="truncate text-xs text-muted">{r.categoria}</p> : null}
                            <p className="mt-1 font-mono text-sm">{r.telefone || "—"}</p>
                            {r.endereco ? (
                              <p className="mt-1 line-clamp-2 text-sm text-muted">{r.endereco}</p>
                            ) : null}
                          </div>
                          <span
                            className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_META[r.status].cor}`}
                          >
                            {STATUS_META[r.status].label}
                          </span>
                        </div>
                        {r.email || r.site ? (
                          <div className="space-y-0.5">
                            {r.email ? (
                              <a href={`mailto:${r.email}`} className="block truncate text-sm text-accent hover:underline">
                                {r.email}
                              </a>
                            ) : null}
                            {r.site ? (
                              <a
                                href={r.site}
                                target="_blank"
                                rel="noreferrer"
                                className="block truncate text-sm text-accent hover:underline"
                              >
                                Site institucional ↗
                              </a>
                            ) : null}
                          </div>
                        ) : null}
                        {r.contatado_recentemente ? (
                          <p className="text-[11px] text-rose-600">contatado recentemente</p>
                        ) : null}
                        {r.congelado ? (
                          <p className="text-[11px] font-semibold text-amber-700">congelado — no fim da fila</p>
                        ) : null}
                        {r.arquivado ? (
                          <p className="text-[11px] font-semibold text-rose-600">removido — fora da fila</p>
                        ) : null}
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() => void gerarMensagem(r)}
                            disabled={gerandoMsg}
                            className="min-w-[8rem] flex-1 rounded-full border border-line px-3 py-2.5 text-sm font-semibold hover:border-accent hover:text-accent disabled:opacity-50"
                          >
                            Gerar mensagem
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              r.lead_id && void alternarCongelado({ id: r.lead_id, nome: r.nome }, !r.congelado)
                            }
                            disabled={!r.lead_id || r.arquivado}
                            className="rounded-full border border-line px-3 py-2.5 text-sm font-semibold text-slate-600 hover:border-slate-400 disabled:opacity-40"
                          >
                            {r.congelado ? "Descongelar" : "Congelar"}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              r.lead_id && void alternarArquivado({ id: r.lead_id, nome: r.nome }, !r.arquivado)
                            }
                            disabled={!r.lead_id}
                            className="rounded-full border border-line px-3 py-2.5 text-sm font-semibold text-rose-600 hover:border-rose-400 hover:bg-rose-50 disabled:opacity-40"
                          >
                            {r.arquivado ? "Restaurar" : "Remover"}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>

              {/* Controles de paginação */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 sm:px-5">
                <p className="text-xs text-muted">
                  {inicio + 1}–{Math.min(inicio + porPagina, resultadosVisiveis.length)} de {resultadosVisiveis.length}
                  {totalBruto > resultadosVisiveis.length ? ` (${totalBruto} brutos)` : ""}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
                    disabled={pagina <= 1}
                    className="h-8 rounded-full border border-line px-3 text-xs font-semibold disabled:opacity-40"
                  >
                    ←
                  </button>
                  {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((p) => {
                    // Mostra todas se forem poucas; senão, mostra primeira, última e vizinhas.
                    const mostrar =
                      totalPaginas <= 7 ||
                      p === 1 ||
                      p === totalPaginas ||
                      Math.abs(p - pagina) <= 1;
                    if (!mostrar) {
                      if (p === pagina - 2 || p === pagina + 2) {
                        return (
                          <span key={`e-${p}`} className="px-1 text-xs text-muted">
                            …
                          </span>
                        );
                      }
                      return null;
                    }
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPaginaAtual(p)}
                        className={`h-8 min-w-[2rem] rounded-full px-2 text-xs font-semibold ${
                          p === pagina
                            ? "bg-accent text-white"
                            : "border border-line hover:border-accent"
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))}
                    disabled={pagina >= totalPaginas}
                    className="h-8 rounded-full border border-line px-3 text-xs font-semibold disabled:opacity-40"
                  >
                    →
                  </button>
                </div>
              </div>
            </>
              );
            })()
          )}

          {/* Legenda de status */}
          <div className="border-t border-line px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Legenda de status</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(Object.keys(STATUS_META) as StatusLead[]).map((s) => (
                <span key={s} className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_META[s].cor}`}>
                  {STATUS_META[s].label}
                </span>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">
              Prevenção de duplicidade: leads já contatados recentemente são destacados.
            </p>
          </div>
        </section>

        {/* Coluna direita: prévia WhatsApp + configurações */}
        <aside className="order-6 space-y-4 lg:order-none">
          {/* Conexão real da conta WhatsApp Business (Cloud API oficial) */}
          <div className="rounded-2xl border border-line bg-white p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold">
              <span>📱</span> Contas WhatsApp Business
            </h2>
            <p className="mt-1 text-xs text-muted">
              Conecte um número pela WhatsApp Business Platform (Cloud API) oficial para receber mensagens
              e o status de entrega (enviada/entregue/lida). O recebimento é gratuito.
            </p>

            <div className="mt-3 space-y-2">
              {contas.map((c) => {
                const conectada = Boolean(c.conectada);
                const status = c.status_conexao || (conectada ? "conectada" : "desconectada");
                const cor = conectada
                  ? "bg-emerald-100 text-emerald-800"
                  : status === "erro"
                    ? "bg-rose-100 text-rose-700"
                    : "bg-slate-200 text-slate-600";
                return (
                  <div key={c.id} className="rounded-xl border border-line p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{c.nome}</p>
                        <p className="truncate text-[11px] text-muted">
                          {c.display_phone_number || "cadastro manual (sem número)"}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${cor}`}>
                        {conectada ? "Conectada" : status === "erro" ? "Erro" : "Não conectada"}
                      </span>
                    </div>
                    {c.phone_number_id ? (
                      <p className="mt-1 break-all text-[10px] text-muted">
                        phone_number_id: <span className="font-mono">{c.phone_number_id}</span>
                        {c.waba_id ? (
                          <>
                            {" · "}waba_id: <span className="font-mono">{c.waba_id}</span>
                          </>
                        ) : null}
                      </p>
                    ) : null}
                    {conectada ? (
                      <button
                        type="button"
                        onClick={() => void desconectarConta(c.id, c.nome)}
                        className="mt-2 rounded-full border border-line px-3 py-1 text-[11px] font-semibold text-rose-600 hover:border-rose-400 hover:bg-rose-50"
                      >
                        Desconectar
                      </button>
                    ) : null}
                  </div>
                );
              })}
              {contas.length === 0 ? (
                <p className="text-xs text-muted">Nenhuma conta cadastrada.</p>
              ) : null}
            </div>

            <div className="mt-3 space-y-2 border-t border-line pt-3">
              <button
                type="button"
                onClick={() => void conectarComFacebook()}
                disabled={conectando || !meta?.embedded_signup}
                className="w-full rounded-full bg-[#1877F2] px-4 py-2.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-60"
              >
                {conectando ? "Conectando…" : "Conectar com Facebook"}
              </button>
              {!meta?.embedded_signup ? (
                <p className="text-[10px] text-muted">
                  Embedded Signup indisponível (faltam META_APP_ID/META_CONFIG_ID no servidor). Use a conexão manual.
                </p>
              ) : null}

              <button
                type="button"
                onClick={() => setManualAberto((v) => !v)}
                className="w-full rounded-full border border-line px-4 py-2 text-xs font-semibold hover:border-accent hover:text-accent"
              >
                {manualAberto ? "Fechar conexão manual" : "Conexão manual (phone_number_id + token)"}
              </button>

              {manualAberto ? (
                <form onSubmit={conectarManual} className="space-y-2">
                  <input
                    className={campo}
                    value={manualNumeroId}
                    onChange={(e) => setManualNumeroId(e.target.value)}
                    placeholder="phone_number_id (ex: 1234567890)"
                  />
                  <input
                    type="password"
                    className={campo}
                    value={manualToken}
                    onChange={(e) => setManualToken(e.target.value)}
                    placeholder="Token de acesso (System User)"
                  />
                  <input
                    className={campo}
                    value={manualWaba}
                    onChange={(e) => setManualWaba(e.target.value)}
                    placeholder="waba_id (opcional)"
                  />
                  <input
                    className={campo}
                    value={manualNome}
                    onChange={(e) => setManualNome(e.target.value)}
                    placeholder="Nome da conta (opcional)"
                  />
                  <button
                    type="submit"
                    disabled={conectando}
                    className="w-full rounded-full bg-accent px-4 py-2.5 text-xs font-semibold text-white hover:bg-accent-dark disabled:opacity-60"
                  >
                    {conectando ? "Validando…" : "Conectar conta"}
                  </button>
                  <p className="text-[10px] text-muted">
                    O token é validado na Graph API e fica salvo só no servidor (nunca volta ao navegador).
                  </p>
                </form>
              ) : null}
            </div>
          </div>

          <div
            className={
              leadSelecionado
                ? "fixed inset-0 z-50 overflow-y-auto bg-white p-4 pb-28 sm:p-6 lg:static lg:z-auto lg:overflow-visible lg:rounded-2xl lg:border lg:border-line lg:p-5 lg:pb-5"
                : "rounded-2xl border border-line bg-white p-5"
            }
          >
            {leadSelecionado ? (
              <div className="mb-4 flex items-center justify-between gap-2 lg:hidden">
                <button
                  type="button"
                  onClick={fecharMensagem}
                  className="flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-sm font-semibold"
                >
                  ← Voltar
                </button>
                <span className="truncate text-sm font-bold text-accent">
                  {leadSelecionado.nome}
                </span>
                <span className="w-16" aria-hidden />
              </div>
            ) : null}

            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="flex items-center gap-2 text-base font-bold sm:text-sm">
                  <span>💬</span> Prévia da mensagem WhatsApp
                </h2>
                <p className="mt-1 text-sm text-muted lg:text-xs">
                  {leadSelecionado ? (
                    <>
                      <span className="font-semibold text-ink">{leadSelecionado.nome}</span> ·{" "}
                    </>
                  ) : null}
                  Mensagem personalizada baseada no template selecionado.
                </p>
              </div>
              {leadSelecionado ? (
                <button
                  type="button"
                  onClick={fecharMensagem}
                  className="hidden shrink-0 rounded-full border border-line px-3 py-1.5 text-xs font-semibold hover:border-accent lg:inline-flex"
                >
                  Fechar
                </button>
              ) : null}
            </div>

            {leadSelecionado ? (
              <div className="mt-4 space-y-4">
                {/* Controles de zoom + ações rápidas */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1 rounded-full border border-line bg-white p-1">
                    <button
                      type="button"
                      onClick={() => setZoomMsg((z) => Math.max(-2, z - 1))}
                      className="h-8 w-8 rounded-full text-base font-bold text-ink hover:bg-canvas"
                      aria-label="Diminuir fonte"
                    >
                      A−
                    </button>
                    <span className="px-1 text-[11px] text-muted">{100 + zoomMsg * 12}%</span>
                    <button
                      type="button"
                      onClick={() => setZoomMsg((z) => Math.min(4, z + 1))}
                      className="h-8 w-8 rounded-full text-lg font-bold text-ink hover:bg-canvas"
                      aria-label="Aumentar fonte"
                    >
                      A+
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={copiarMensagem}
                      className="rounded-full border border-line px-3 py-1.5 text-sm font-semibold hover:border-accent"
                    >
                      Copiar
                    </button>
                    <button
                      type="button"
                      onClick={() => void abrirWhatsApp()}
                      className="hidden rounded-full bg-[#25D366] px-5 py-2.5 text-center text-sm font-bold text-white shadow-md hover:opacity-90 lg:inline-flex"
                      title="Abre o WhatsApp e registra o envio automaticamente na conta escolhida"
                    >
                      💬 Abrir WhatsApp
                    </button>
                  </div>
                </div>

                <div className="max-h-[16rem] overflow-y-auto rounded-2xl bg-[#ECE5DD] p-4 text-ink sm:p-5">
                  <p
                    className="whitespace-pre-wrap break-words leading-relaxed"
                    style={{ fontSize: tamanhoMensagem }}
                  >
                    {mensagem || "Nenhuma mensagem."}
                  </p>
                </div>

                <p className="text-xs text-muted lg:text-[10px]">
                  &quot;Abrir WhatsApp&quot; abre o app pelo link e registra o envio no painel. O envio pela API
                  fica desativado (é cobrado por mensagem); a conta conectada serve para <strong>receber</strong>{" "}
                  mensagens e o status de entrega — sem custo.
                </p>

                <div className="space-y-2 border-t border-line pt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">Status do lead</span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_META[leadSelecionado.status].cor}`}
                    >
                      {STATUS_META[leadSelecionado.status].label}
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold">Conta WhatsApp usada</label>
                    <select
                      className={campo}
                      value={contaEnvio}
                      onChange={(e) => setContaEnvio(e.target.value)}
                    >
                      <option value="">— escolha —</option>
                      {contas.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nome} ({c.enviados_hoje}/{c.limite_diario} hoje){c.conectada ? " · recebendo" : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={marcarEnviado}
                    className="w-full rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark"
                  >
                    Marcar como enviado
                  </button>

                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => void mudarStatus("respondeu")}
                      className="rounded-full border border-line px-2.5 py-1 text-[11px] font-semibold hover:border-emerald-500"
                    >
                      Respondeu
                    </button>
                    <button
                      type="button"
                      onClick={() => void mudarStatus("descartado")}
                      className="rounded-full border border-line px-2.5 py-1 text-[11px] font-semibold hover:border-slate-500"
                    >
                      Descartar
                    </button>
                  </div>
                </div>

                <div className="border-t border-line pt-4">
                  <label className="block text-sm font-semibold">Observações</label>
                  <textarea
                    className={`${campo} min-h-[5rem] resize-y`}
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder="Adicione notas sobre este lead…"
                    maxLength={1000}
                  />
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-[10px] text-muted">{observacoes.length}/1000</span>
                    <button
                      type="button"
                      onClick={salvarObservacoes}
                      disabled={salvandoObs}
                      className="rounded-full border border-line px-3 py-1 text-[11px] font-semibold hover:border-accent disabled:opacity-50"
                    >
                      {salvandoObs ? "Salvando…" : "Salvar obs."}
                    </button>
                  </div>
                </div>

                {/* Linha do tempo do lead (histórico fiel de geração/envio/status) */}
                <div className="border-t border-line pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">Histórico do lead</p>
                  {(leadSelecionado.historico || []).length === 0 ? (
                    <p className="mt-2 text-xs text-muted">Sem eventos registrados ainda.</p>
                  ) : (
                    <ol className="mt-2 space-y-2">
                      {[...(leadSelecionado.historico || [])].reverse().map((ev, i) => (
                        <li key={`${ev.em}-${i}`} className="flex gap-2">
                          <span
                            className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${EVENTO_META[ev.tipo].cor}`}
                          >
                            {EVENTO_META[ev.tipo].label}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] text-muted">
                              {new Date(ev.em).toLocaleString("pt-BR")}
                              {ev.conta_nome ? ` · ${ev.conta_nome}` : ""}
                            </p>
                            {ev.observacao ? (
                              <p className="whitespace-pre-wrap break-words text-xs text-ink">{ev.observacao}</p>
                            ) : ev.mensagem ? (
                              <p className="line-clamp-2 text-xs text-muted">{ev.mensagem}</p>
                            ) : null}
                          </div>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-6 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-line px-4 py-10 text-center">
                <span className="text-4xl">💬</span>
                <p className="mt-3 text-sm font-semibold text-ink">Nenhum lead selecionado</p>
                <p className="mt-1 text-xs text-muted">
                  Clique em <strong>&ldquo;Gerar mensagem&rdquo;</strong> em um lead da lista ao lado para
                  visualizar e editar a mensagem aqui.
                </p>
              </div>
            )}

            {/* Barra fixa de ação no mobile — "Abrir WhatsApp" sempre à mão */}
            {leadSelecionado ? (
              <div className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-white/95 p-3 backdrop-blur lg:hidden">
                <button
                  type="button"
                  onClick={() => void abrirWhatsApp()}
                  className="w-full rounded-full bg-[#25D366] px-4 py-3.5 text-center text-base font-bold text-white shadow-lg hover:opacity-90"
                  title="Abre o WhatsApp e registra o envio automaticamente na conta escolhida"
                >
                  💬 Abrir WhatsApp
                </button>
              </div>
            ) : null}
          </div>

          {/* Configurações */}
          <ConfigPanel
            config={config}
            senha={senha}
            onSalvo={(cfg) => {
              setConfig(cfg);
              setOk("Configurações salvas.");
              void carregarTudo();
            }}
            aberto={abaConfig}
            onToggle={() => setAbaConfig((v) => !v)}
          />
        </aside>
      </div>

      {/* Histórico de leads salvos */}
      <section className="mt-6 rounded-2xl border border-line bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold">Histórico de leads ({leadsVisiveis.length})</h2>
            <p className="mt-1 text-xs text-muted">
              Todos os leads gerados ficam salvos para consulta futura e para a IA da Meta.
            </p>
          </div>
          {leadsOcultosCount > 0 ? (
            <label className="flex shrink-0 cursor-pointer items-center gap-2 rounded-full border border-line px-3 py-1.5 text-xs font-semibold hover:border-accent">
              <input
                type="checkbox"
                checked={mostrarOcultos}
                onChange={(e) => setMostrarOcultos(e.target.checked)}
              />
              Mostrar congelados e removidos ({leadsOcultosCount})
            </label>
          ) : null}
        </div>
        {leads.length === 0 ? (
          <p className="mt-4 text-sm text-muted">Nenhum lead salvo ainda.</p>
        ) : leadsVisiveis.length === 0 ? (
          <p className="mt-4 text-sm text-muted">
            Todos os leads estão congelados ou removidos. Marque “Mostrar congelados e removidos” para vê-los.
          </p>
        ) : (
          <>
            <div className="mt-4 hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-canvas text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Nome</th>
                    <th className="px-3 py-2 font-semibold">Telefone</th>
                    <th className="px-3 py-2 font-semibold">Nicho</th>
                    <th className="px-3 py-2 font-semibold">Contato</th>
                    <th className="px-3 py-2 font-semibold">Status</th>
                    <th className="px-3 py-2 font-semibold">Último contato</th>
                    <th className="px-3 py-2 text-right font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {leadsVisiveis.slice(0, 50).map((l) => (
                    <tr key={l.id} className="hover:bg-canvas/50">
                      <td className="px-3 py-2 font-semibold">{l.nome}</td>
                      <td className="px-3 py-2 font-mono text-xs">{l.telefone}</td>
                      <td className="px-3 py-2 text-xs">{l.nicho}</td>
                      <td className="px-3 py-2 text-xs">
                        {l.email || l.site ? (
                          <div className="space-y-0.5">
                            {l.email ? (
                              <a
                                href={`mailto:${l.email}`}
                                className="block max-w-[12rem] truncate text-accent hover:underline"
                                title={l.email}
                              >
                                {l.email}
                              </a>
                            ) : null}
                            {l.site ? (
                              <a
                                href={l.site}
                                target="_blank"
                                rel="noreferrer"
                                className="block max-w-[12rem] truncate text-accent hover:underline"
                                title={l.site}
                              >
                                Site ↗
                              </a>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_META[l.status].cor}`}>
                          {STATUS_META[l.status].label}
                        </span>
                        {l.congelado ? (
                          <p className="mt-1 text-[10px] font-semibold text-amber-700">congelado</p>
                        ) : null}
                        {l.arquivado ? (
                          <p className="mt-1 text-[10px] font-semibold text-rose-600">removido</p>
                        ) : null}
                      </td>
                      <td className="px-3 py-2 text-xs text-muted">
                        {l.data_ultimo_contato
                          ? new Date(l.data_ultimo_contato).toLocaleString("pt-BR")
                          : "—"}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => void gerarMensagemDeLead(l)}
                            disabled={gerandoMsg}
                            className="rounded-full border border-line px-3 py-1 text-[11px] font-semibold hover:border-accent hover:text-accent disabled:opacity-50"
                          >
                            Gerar mensagem
                          </button>
                          <button
                            type="button"
                            onClick={() => void alternarCongelado({ id: l.id, nome: l.nome }, !l.congelado)}
                            disabled={Boolean(l.arquivado)}
                            className="rounded-full border border-line px-3 py-1 text-[11px] font-semibold text-slate-600 hover:border-slate-400 hover:bg-canvas disabled:opacity-40"
                            title={
                              l.arquivado
                                ? "Restaure o lead para poder congelar"
                                : l.congelado
                                  ? "Descongelar (volta à fila)"
                                  : "Congelar (vai para o fim da fila)"
                            }
                          >
                            {l.congelado ? "Descongelar" : "Congelar"}
                          </button>
                          <button
                            type="button"
                            onClick={() => void alternarArquivado({ id: l.id, nome: l.nome }, !l.arquivado)}
                            className="rounded-full border border-line px-3 py-1 text-[11px] font-semibold text-rose-600 hover:border-rose-400 hover:bg-rose-50"
                            title={l.arquivado ? "Restaurar para a fila" : "Remover da fila (reversível)"}
                          >
                            {l.arquivado ? "Restaurar" : "Remover"}
                          </button>
                          {l.arquivado ? (
                            <button
                              type="button"
                              onClick={() => void excluirDefinitivo(l)}
                              className="rounded-full border border-line px-2.5 py-1 text-[11px] font-semibold text-rose-700 hover:border-rose-500 hover:bg-rose-100"
                              title="Excluir definitivamente (não reversível)"
                            >
                              ✕
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile: cartões */}
            <ul className="mt-4 divide-y divide-line md:hidden">
              {leadsVisiveis.slice(0, 50).map((l) => (
                <li
                  key={l.id}
                  className={`space-y-2 rounded-xl px-2 py-3 ${
                    l.arquivado ? "bg-rose-50/60" : l.congelado ? "bg-amber-50/60" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{l.nome}</p>
                      <p className="font-mono text-xs text-muted">{l.telefone}</p>
                      <p className="text-xs text-muted">
                        {l.nicho} ·{" "}
                        {l.data_ultimo_contato
                          ? new Date(l.data_ultimo_contato).toLocaleString("pt-BR")
                          : "sem contato"}
                      </p>
                      {l.email ? (
                        <a href={`mailto:${l.email}`} className="block truncate text-xs text-accent hover:underline">
                          {l.email}
                        </a>
                      ) : null}
                      {l.site ? (
                        <a
                          href={l.site}
                          target="_blank"
                          rel="noreferrer"
                          className="block truncate text-xs text-accent hover:underline"
                        >
                          Site institucional ↗
                        </a>
                      ) : null}
                      {l.congelado ? <p className="text-[11px] font-semibold text-amber-700">congelado</p> : null}
                      {l.arquivado ? <p className="text-[11px] font-semibold text-rose-600">removido</p> : null}
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_META[l.status].cor}`}
                    >
                      {STATUS_META[l.status].label}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => void gerarMensagemDeLead(l)}
                      disabled={gerandoMsg}
                      className="min-w-[8rem] flex-1 rounded-full border border-line px-3 py-2 text-[11px] font-semibold hover:border-accent hover:text-accent disabled:opacity-50"
                    >
                      Gerar mensagem
                    </button>
                    <button
                      type="button"
                      onClick={() => void alternarCongelado({ id: l.id, nome: l.nome }, !l.congelado)}
                      disabled={Boolean(l.arquivado)}
                      className="rounded-full border border-line px-3 py-2 text-[11px] font-semibold text-slate-600 hover:border-slate-400 disabled:opacity-40"
                    >
                      {l.congelado ? "Descongelar" : "Congelar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void alternarArquivado({ id: l.id, nome: l.nome }, !l.arquivado)}
                      className="rounded-full border border-line px-3 py-2 text-[11px] font-semibold text-rose-600 hover:border-rose-400 hover:bg-rose-50"
                    >
                      {l.arquivado ? "Restaurar" : "Remover"}
                    </button>
                    {l.arquivado ? (
                      <button
                        type="button"
                        onClick={() => void excluirDefinitivo(l)}
                        className="rounded-full border border-line px-3 py-2 text-[11px] font-semibold text-rose-700 hover:border-rose-500 hover:bg-rose-100"
                        title="Excluir definitivamente (não reversível)"
                      >
                        Excluir de vez
                      </button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {/* Histórico de envios (log fiel por conta WhatsApp) */}
      <section className="mt-6 rounded-2xl border border-line bg-white p-5">
        <h2 className="text-sm font-bold">Histórico de envios ({envios.length})</h2>
        <p className="mt-1 text-xs text-muted">
          Registro imutável de cada mensagem enviada: texto exato, lead e conta WhatsApp usada.
        </p>
        {envios.length === 0 ? (
          <p className="mt-4 text-sm text-muted">Nenhuma mensagem enviada ainda.</p>
        ) : (
          <>
            <div className="mt-4 hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-canvas text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Quando</th>
                    <th className="px-3 py-2 font-semibold">Lead</th>
                    <th className="px-3 py-2 font-semibold">Telefone</th>
                    <th className="px-3 py-2 font-semibold">Conta WhatsApp</th>
                    <th className="px-3 py-2 font-semibold">Canal / Status</th>
                    <th className="px-3 py-2 font-semibold">Mensagem enviada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {envios.slice(0, 50).map((e) => (
                    <tr key={e.id} className="hover:bg-canvas/50">
                      <td className="px-3 py-2 text-xs text-muted whitespace-nowrap">
                        {new Date(e.em).toLocaleString("pt-BR")}
                      </td>
                      <td className="px-3 py-2 font-semibold">{e.nome}</td>
                      <td className="px-3 py-2 font-mono text-xs">{e.telefone}</td>
                      <td className="px-3 py-2 text-xs">
                        <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-semibold text-accent">
                          {e.conta_nome}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs">
                        {e.canal === "cloud_api" ? (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                              e.status === "read"
                                ? "bg-emerald-100 text-emerald-800"
                                : e.status === "delivered"
                                  ? "bg-sky-100 text-sky-800"
                                  : e.status === "failed"
                                    ? "bg-rose-100 text-rose-700"
                                    : "bg-slate-200 text-slate-600"
                            }`}
                            title={e.wamid ? `wamid: ${e.wamid}` : ""}
                          >
                            {e.status || "sent"} · API
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                            link
                          </span>
                        )}
                        {e.erro ? <p className="mt-1 text-[10px] text-rose-600">{e.erro}</p> : null}
                      </td>
                      <td className="px-3 py-2 text-xs text-muted">
                        <span className="line-clamp-2">{e.mensagem || "—"}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile: cartões */}
            <ul className="mt-4 divide-y divide-line md:hidden">
              {envios.slice(0, 50).map((e) => (
                <li key={e.id} className="space-y-1.5 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{e.nome}</p>
                      <p className="font-mono text-xs text-muted">{e.telefone}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-semibold text-accent">
                      {e.conta_nome}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {e.canal === "cloud_api" ? (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          e.status === "read"
                            ? "bg-emerald-100 text-emerald-800"
                            : e.status === "delivered"
                              ? "bg-sky-100 text-sky-800"
                              : e.status === "failed"
                                ? "bg-rose-100 text-rose-700"
                                : "bg-slate-200 text-slate-600"
                        }`}
                        title={e.wamid ? `wamid: ${e.wamid}` : ""}
                      >
                        {e.status || "sent"} · API
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                        link
                      </span>
                    )}
                    <span className="text-muted">{new Date(e.em).toLocaleString("pt-BR")}</span>
                  </div>
                  {e.erro ? <p className="text-[10px] text-rose-600">{e.erro}</p> : null}
                  <p className="line-clamp-2 text-xs text-muted">{e.mensagem || "—"}</p>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {/* Mensagens recebidas (webhook da Cloud API) — base do uso em suporte */}
      <section className="mt-6 rounded-2xl border border-line bg-white p-5">
        <h2 className="text-sm font-bold">Mensagens recebidas ({mensagens.length})</h2>
        <p className="mt-1 text-xs text-muted">
          Mensagens enviadas pelos contatos no número conectado. O recebimento é gratuito — use para dar
          suporte e acompanhar quem respondeu.
        </p>
        {mensagens.length === 0 ? (
          <p className="mt-4 text-sm text-muted">
            Nenhuma mensagem recebida ainda. Elas aparecem aqui assim que um contato escrever para o número conectado.
          </p>
        ) : (
          <>
            <div className="mt-4 hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-canvas text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Quando</th>
                    <th className="px-3 py-2 font-semibold">Contato</th>
                    <th className="px-3 py-2 font-semibold">Conta WhatsApp</th>
                    <th className="px-3 py-2 font-semibold">Mensagem</th>
                    <th className="px-3 py-2 font-semibold">Lead</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {mensagens.slice(0, 50).map((m) => {
                    const leadCasa = m.lead_id ? leads.find((l) => l.id === m.lead_id) : null;
                    return (
                      <tr key={m.id} className="hover:bg-canvas/50">
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-muted">
                          {new Date(m.em).toLocaleString("pt-BR")}
                        </td>
                        <td className="px-3 py-2">
                          <p className="font-semibold">{m.nome_contato || "—"}</p>
                          <p className="font-mono text-[11px] text-muted">{m.de}</p>
                        </td>
                        <td className="px-3 py-2 text-xs">
                          {m.conta_nome ? (
                            <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-semibold text-accent">
                              {m.conta_nome}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-3 py-2 text-xs">
                          {m.tipo !== "text" ? (
                            <span className="mr-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                              {m.tipo}
                            </span>
                          ) : null}
                          <span className="line-clamp-2">{m.texto || "—"}</span>
                        </td>
                        <td className="px-3 py-2 text-xs">
                          {leadCasa ? (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                              {leadCasa.nome}
                            </span>
                          ) : (
                            <span className="text-muted">sem lead</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile: cartões */}
            <ul className="mt-4 divide-y divide-line md:hidden">
              {mensagens.slice(0, 50).map((m) => {
                const leadCasa = m.lead_id ? leads.find((l) => l.id === m.lead_id) : null;
                return (
                  <li key={m.id} className="space-y-1.5 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{m.nome_contato || "—"}</p>
                        <p className="font-mono text-[11px] text-muted">{m.de}</p>
                      </div>
                      {m.conta_nome ? (
                        <span className="shrink-0 rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-semibold text-accent">
                          {m.conta_nome}
                        </span>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {m.tipo !== "text" ? (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                          {m.tipo}
                        </span>
                      ) : null}
                      <span className="text-muted">{new Date(m.em).toLocaleString("pt-BR")}</span>
                      {leadCasa ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                          {leadCasa.nome}
                        </span>
                      ) : (
                        <span className="text-muted">sem lead</span>
                      )}
                    </div>
                    <p className="line-clamp-3 text-sm text-ink">{m.texto || "—"}</p>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>
    </main>
  );
}

// —— Subcomponente: Configurações ——

function ConfigPanel({
  config,
  senha,
  onSalvo,
  aberto,
  onToggle,
}: {
  config: Config | null;
  senha: string;
  onSalvo: (cfg: Config) => void;
  aberto: boolean;
  onToggle: () => void;
}) {
  const [chave, setChave] = useState("");
  const [endpointBusca, setEndpointBusca] = useState("");
  const [endpointDetalhes, setEndpointDetalhes] = useState("");
  const [periodo, setPeriodo] = useState(45);
  const [templateAtivo, setTemplateAtivo] = useState("");
  const [remetente, setRemetente] = useState("Equipe GuiX");

  const [contas, setContas] = useState<Conta[]>([]);
  const [nichos, setNichos] = useState<NichoCfg[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (config) {
      setChave(config.api.chave || "");
      setEndpointBusca(config.api.endpoint_busca);
      setEndpointDetalhes(config.api.endpoint_detalhes);
      setPeriodo(config.periodo_recontato_dias);
      setTemplateAtivo(config.template_ativo);
      setRemetente(config.remetente || "Equipe GuiX");
      setContas(config.contas.map((c) => ({ ...c })));
      setNichos(
        config.nichos.map((n) => ({
          slug: n.slug,
          nome: n.nome,
          modelo_url: n.modelo_url,
          termos_busca: [...(n.termos_busca || [])],
        })),
      );
      setTemplates(config.templates.map((t) => ({ ...t })));
    }
  }, [config]);

  function novaConta() {
    const id = `conta_${Date.now().toString(36)}`;
    setContas((prev) => [
      ...prev,
      { id, nome: `Conta ${prev.length + 1}`, limite_diario: 30, enviados_hoje: 0, provedor: "manual" },
    ]);
  }
  function atualizarConta(i: number, patch: Partial<Conta>) {
    setContas((prev) => prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  }
  function removerConta(i: number) {
    setContas((prev) => prev.filter((_, idx) => idx !== i));
  }

  function novoNicho() {
    setNichos((prev) => [
      ...prev,
      { slug: `nicho_${Date.now().toString(36)}`, nome: "", modelo_url: "", termos_busca: [] },
    ]);
  }
  function atualizarNicho(i: number, patch: Partial<NichoCfg>) {
    setNichos((prev) => prev.map((n, idx) => (idx === i ? { ...n, ...patch } : n)));
  }
  function removerNicho(i: number) {
    setNichos((prev) => prev.filter((_, idx) => idx !== i));
  }

  function novoTemplate() {
    const id = `tpl_${Date.now().toString(36)}`;
    setTemplates((prev) => [...prev, { id, nome: "Novo template", texto: "" }]);
    setTemplateAtivo(id);
  }
  function atualizarTemplate(i: number, patch: Partial<Template>) {
    setTemplates((prev) => prev.map((t, idx) => (idx === i ? { ...t, ...patch } : t)));
  }
  function removerTemplate(i: number) {
    setTemplates((prev) => {
      const next = prev.filter((_, idx) => idx !== i);
      if (templateAtivo && !next.find((t) => t.id === templateAtivo)) {
        setTemplateAtivo(next[0]?.id || "");
      }
      return next;
    });
  }

  async function salvar() {
    if (!config) return;
    setSalvando(true);
    setErro("");
    try {
      // Sanitiza contas (remove enviados_hoje que não faz parte da config)
      const contasCfg = contas.map(({ enviados_hoje: _e, ...resto }) => resto);
      const res = await fetch("/api/painel/prospeccao", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-painel-token": senha },
        body: JSON.stringify({
          api: {
            provedor: "google",
            chave,
            endpoint_busca: endpointBusca,
            endpoint_detalhes: endpointDetalhes,
          },
          periodo_recontato_dias: periodo,
          template_ativo: templateAtivo,
          remetente,
          contas: contasCfg,
          nichos,
          templates,
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        setErro(j.erro || "Não salvou.");
        return;
      }
      onSalvo(j.config);
    } finally {
      setSalvando(false);
    }
  }

  const campo =
    "mt-1.5 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:border-accent";
  const btnGhost =
    "rounded-full border border-line px-3 py-1.5 text-xs font-semibold hover:border-accent hover:text-accent";

  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between text-left"
      >
        <h2 className="flex items-center gap-2 text-sm font-bold">
          <span>⚙️</span> Configurações
        </h2>
        <span className="text-muted">{aberto ? "▾" : "▸"}</span>
      </button>

      {aberto ? (
        <div className="mt-4 space-y-5">
          {erro ? <p className="text-sm text-rose-700">{erro}</p> : null}

          {/* API Google Places */}
          <div className="space-y-2">
            <p className="flex items-center justify-between text-xs font-semibold">
              API Google Places
              {config?.api.chave ? (
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-700">
                  Conectada
                </span>
              ) : (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] text-amber-700">
                  Pendente
                </span>
              )}
            </p>
            <div>
              <label className="text-[11px] text-muted">API Key</label>
              <input
                type="password"
                className={campo}
                value={chave}
                onChange={(e) => setChave(e.target.value)}
                placeholder="AIza..."
              />
            </div>
            <div>
              <label className="text-[11px] text-muted">Endpoint de busca</label>
              <input
                className={campo}
                value={endpointBusca}
                onChange={(e) => setEndpointBusca(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[11px] text-muted">Endpoint de detalhes</label>
              <input
                className={campo}
                value={endpointDetalhes}
                onChange={(e) => setEndpointDetalhes(e.target.value)}
              />
            </div>
          </div>

          {/* Contas WhatsApp */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold">Contas WhatsApp</p>
              <button type="button" onClick={novaConta} className={btnGhost}>
                + Adicionar
              </button>
            </div>
            <p className="text-[10px] text-muted">
              A conexão com a conta real é feita no card “Contas WhatsApp Business”. Aqui só se define nome e limite
              diário.
            </p>
            <div className="space-y-2">
              {contas.map((c, i) => (
                <div key={c.id} className="rounded-lg border border-line p-2.5">
                  <div className="flex items-center gap-2">
                    <input
                      className={`${campo} mt-0`}
                      value={c.nome}
                      onChange={(e) => atualizarConta(i, { nome: e.target.value })}
                      placeholder="Nome da conta"
                    />
                    <input
                      type="number"
                      min={1}
                      max={500}
                      className={`${campo} mt-0 w-24`}
                      value={c.limite_diario}
                      onChange={(e) => atualizarConta(i, { limite_diario: Number(e.target.value) })}
                      title="Limite diário"
                    />
                    <button
                      type="button"
                      onClick={() => removerConta(i)}
                      className="rounded-full px-2 py-1 text-xs text-rose-600 hover:bg-rose-50"
                      title="Remover conta"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-muted">
                    <span
                      className={`rounded-full px-2 py-0.5 font-semibold ${
                        c.conectada ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {c.conectada ? "API oficial conectada" : "não conectada"}
                    </span>
                    {c.display_phone_number ? <span>{c.display_phone_number}</span> : null}
                    {c.enviados_hoje != null ? <span>Envios hoje: {c.enviados_hoje}</span> : null}
                  </p>
                </div>
              ))}
              {contas.length === 0 ? (
                <p className="text-xs text-muted">Nenhuma conta cadastrada.</p>
              ) : null}
            </div>
          </div>

          {/* Nichos */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold">Nichos</p>
              <button type="button" onClick={novoNicho} className={btnGhost}>
                + Adicionar
              </button>
            </div>
            <div className="space-y-2">
              {nichos.map((n, i) => (
                <div key={`${n.slug}-${i}`} className="space-y-1.5 rounded-lg border border-line p-2.5">
                  <div className="flex items-center gap-2">
                    <input
                      className={`${campo} mt-0`}
                      value={n.slug}
                      onChange={(e) =>
                        atualizarNicho(i, { slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })
                      }
                      placeholder="slug (ex: dentista)"
                    />
                    <input
                      className={`${campo} mt-0`}
                      value={n.nome}
                      onChange={(e) => atualizarNicho(i, { nome: e.target.value })}
                      placeholder="Nome (ex: Dentista)"
                    />
                    <button
                      type="button"
                      onClick={() => removerNicho(i)}
                      className="rounded-full px-2 py-1 text-xs text-rose-600 hover:bg-rose-50"
                    >
                      ✕
                    </button>
                  </div>
                  <input
                    className={campo}
                    value={n.modelo_url}
                    onChange={(e) => atualizarNicho(i, { modelo_url: e.target.value })}
                    placeholder="URL do modelo de site"
                  />
                  <input
                    className={campo}
                    value={(n.termos_busca || []).join(", ")}
                    onChange={(e) =>
                      atualizarNicho(i, {
                        termos_busca: e.target.value.split(",").map((t) => t.trim()).filter(Boolean),
                      })
                    }
                    placeholder="Termos de busca (separados por vírgula)"
                  />
                </div>
              ))}
              {nichos.length === 0 ? (
                <p className="text-xs text-muted">Nenhum nicho cadastrado.</p>
              ) : null}
            </div>
          </div>

          {/* Templates de mensagem */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold">Templates de mensagem</p>
              <button type="button" onClick={novoTemplate} className={btnGhost}>
                + Adicionar
              </button>
            </div>
            <div>
              <label className="text-[11px] text-muted">Template ativo</label>
              <select
                className={campo}
                value={templateAtivo}
                onChange={(e) => setTemplateAtivo(e.target.value)}
              >
                {templates.length === 0 ? <option value="">—</option> : null}
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-3">
              {templates.map((t, i) => (
                <div
                  key={t.id}
                  className={`space-y-1.5 rounded-lg border p-2.5 ${
                    t.id === templateAtivo ? "border-accent" : "border-line"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      className={`${campo} mt-0 flex-1`}
                      value={t.nome}
                      onChange={(e) => atualizarTemplate(i, { nome: e.target.value })}
                      placeholder="Nome do template"
                    />
                    {t.id === templateAtivo ? (
                      <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent">
                        ativo
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setTemplateAtivo(t.id)}
                        className="rounded-full px-2 py-0.5 text-[10px] text-muted hover:text-accent"
                      >
                        usar
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removerTemplate(i)}
                      className="rounded-full px-2 py-1 text-xs text-rose-600 hover:bg-rose-50"
                    >
                      ✕
                    </button>
                  </div>
                  <textarea
                    className={`${campo} min-h-[7rem] resize-y font-mono text-xs`}
                    value={t.texto}
                    onChange={(e) => atualizarTemplate(i, { texto: e.target.value })}
                    placeholder="Texto da mensagem. Use {{nome}}, {{cidade}}, {{nicho}}, {{modelo_url}}, {{remetente}}"
                  />
                  <p className="text-[10px] text-muted">
                    Variáveis: {"{{nome}}"}, {"{{cidade}}"}, {"{{nicho}}"}, {"{{modelo_url}}"}, {"{{remetente}}"}
                  </p>
                </div>
              ))}
              {templates.length === 0 ? (
                <p className="text-xs text-muted">Nenhum template cadastrado.</p>
              ) : null}
            </div>
          </div>

          {/* Remetente */}
          <div>
            <label className="text-xs font-semibold">Remetente das mensagens</label>
            <p className="text-[11px] text-muted">
              Nome exibido nas mensagens (variável {"{{remetente}}"}). Use o nome da equipe ou do responsável.
            </p>
            <input
              className={campo}
              value={remetente}
              onChange={(e) => setRemetente(e.target.value)}
              placeholder="Equipe GuiX"
              maxLength={80}
            />
          </div>

          {/* Período de recontato */}
          <div>
            <label className="text-xs font-semibold">
              Período mínimo entre recontatos (dias)
            </label>
            <input
              type="number"
              min={1}
              max={365}
              className={campo}
              value={periodo}
              onChange={(e) => setPeriodo(Number(e.target.value))}
            />
          </div>

          <button
            type="button"
            onClick={salvar}
            disabled={salvando}
            className="w-full rounded-full bg-accent px-4 py-2.5 text-xs font-semibold text-white hover:bg-accent-dark disabled:opacity-60"
          >
            {salvando ? "Salvando…" : "Salvar todas as configurações"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<main className="px-5 py-16 text-sm text-muted">Carregando painel…</main>}>
      <PainelProspeccao />
    </Suspense>
  );
}
