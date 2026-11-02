"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Casa = "x" | "o" | null;
type Tabuleiro = Casa[];

const LINHAS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
] as const;

/** Traços de caneta cobrindo cada linha vencedora (viewBox 108). */
const RISCOS: Record<string, string> = {
  "0,1,2": "M10 22.5c28-2.2 56 1.4 88-0.6",
  "3,4,5": "M9.5 54c29 1.8 58-1.6 89 0.4",
  "6,7,8": "M10 85.5c27-1.4 55 2 88-0.8",
  "0,3,6": "M22.5 10c-1.6 28 1.8 56-0.4 88",
  "1,4,7": "M54 9.5c1.4 29-1.2 58 0.6 89",
  "2,5,8": "M85.5 10c-0.8 27 2.2 55-1 88",
  "0,4,8": "M12 12c26 24 52 52 84 84",
  "2,4,6": "M96 12c-26 24-52 52-84 84",
};

function vazio(): Tabuleiro {
  return Array(9).fill(null);
}

function linhaVencedora(tab: Tabuleiro): readonly [number, number, number] | null {
  for (const linha of LINHAS) {
    const [a, b, c] = linha;
    if (tab[a] && tab[a] === tab[b] && tab[a] === tab[c]) return linha;
  }
  return null;
}

function vencedor(tab: Tabuleiro): Casa {
  const linha = linhaVencedora(tab);
  return linha ? tab[linha[0]] : null;
}

function livres(tab: Tabuleiro) {
  return tab.map((c, i) => (c ? -1 : i)).filter((i) => i >= 0);
}

function pontuar(tab: Tabuleiro, maximizando: boolean, profundidade: number): number {
  const v = vencedor(tab);
  if (v === "o") return 10 - profundidade;
  if (v === "x") return profundidade - 10;
  if (livres(tab).length === 0) return 0;

  if (maximizando) {
    let melhor = -Infinity;
    for (const i of livres(tab)) {
      const prox = [...tab];
      prox[i] = "o";
      melhor = Math.max(melhor, pontuar(prox, false, profundidade + 1));
    }
    return melhor;
  }

  let pior = Infinity;
  for (const i of livres(tab)) {
    const prox = [...tab];
    prox[i] = "x";
    pior = Math.min(pior, pontuar(prox, true, profundidade + 1));
  }
  return pior;
}

function jogadaIa(tab: Tabuleiro): number {
  const opcoes = livres(tab);
  if (opcoes.length === 0) return -1;

  for (const i of opcoes) {
    const t = [...tab];
    t[i] = "o";
    if (vencedor(t) === "o") return i;
  }
  for (const i of opcoes) {
    const t = [...tab];
    t[i] = "x";
    if (vencedor(t) === "x") return i;
  }

  const ranqueadas = opcoes
    .map((i) => {
      const t = [...tab];
      t[i] = "o";
      return { i, nota: pontuar(t, false, 0) };
    })
    .sort((a, b) => b.nota - a.nota);

  const frouxo = Math.random() < 0.28 && ranqueadas.length > 1;
  if (frouxo) {
    const segundo = ranqueadas.filter((r) => r.nota < ranqueadas[0].nota);
    if (segundo.length) return segundo[Math.floor(Math.random() * Math.min(2, segundo.length))].i;
  }
  return ranqueadas[0].i;
}

function Marca({ tipo, atraso = 0 }: { tipo: "x" | "o"; atraso?: number }) {
  if (tipo === "x") {
    return (
      <svg viewBox="0 0 40 40" className="velha-marca h-full w-full" aria-hidden="true">
        <path
          className="velha-traco"
          style={{ animationDelay: `${atraso}ms` }}
          d="M8.4 9.2c2.2 1.6 5.8 5.9 8.1 8.7 1.1 1.3 2.6 3.4 3.7 4.9 1.4-1.6 4.9-6.2 7.4-9.1 1.8-2.1 4.6-5 5.9-6.2"
        />
        <path
          className="velha-traco"
          style={{ animationDelay: `${atraso + 170}ms` }}
          d="M31.2 8.8c-2.4 2.5-6.6 7.6-9.1 10.8-1.2 1.5-2.5 3.4-3.5 4.7-1.5-1.4-5.8-6.8-8.6-9.9C8.2 12.2 6.4 10 5.6 9"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 40 40" className="velha-marca h-full w-full" aria-hidden="true">
      <path
        className="velha-traco velha-traco--o"
        style={{ animationDelay: `${atraso}ms` }}
        d="M19.6 6.8c3.8-.6 7.6.4 10.1 3.1 2.6 2.8 3.2 6.6 2.4 10.1-.8 3.6-3.6 6.9-7.2 7.9-3.4 1-7.4.1-9.9-2.5-2.7-2.7-3.6-6.6-2.7-10.1.9-3.6 3.8-7.4 7.3-8.5z"
      />
    </svg>
  );
}

export function JogoDaVelha() {
  const [tab, setTab] = useState<Tabuleiro>(vazio);
  const [usuarioComeca, setUsuarioComeca] = useState(true);
  const [vez, setVez] = useState<"x" | "o">("x");
  const [travado, setTravado] = useState(false);
  const [nota, setNota] = useState("você começa!");
  const [risco, setRisco] = useState<string | null>(null);
  const rodada = useRef(0);
  const timers = useRef<number[]>([]);

  const limparTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  };

  const agendar = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timers.current.push(id);
  }, []);

  const reiniciar = useCallback(
    (proximoUsuarioComeca: boolean) => {
      limparTimers();
      setTravado(true);
      agendar(() => {
        rodada.current += 1;
        setTab(vazio());
        setRisco(null);
        setUsuarioComeca(proximoUsuarioComeca);
        setVez(proximoUsuarioComeca ? "x" : "o");
        setNota(proximoUsuarioComeca ? "você começa!" : "eu começo");
        setTravado(false);
      }, 1650);
    },
    [agendar],
  );

  const aposJogada = useCallback(
    (proximo: Tabuleiro, quem: "x" | "o") => {
      const linha = linhaVencedora(proximo);
      if (linha) {
        setRisco(linha.join(","));
        setNota(quem === "x" ? "você ganhou" : "ganhei essa, uhul");
        reiniciar(!usuarioComeca);
        return true;
      }
      if (livres(proximo).length === 0) {
        setNota("opa, esse deu velha!");
        reiniciar(!usuarioComeca);
        return true;
      }
      setVez(quem === "x" ? "o" : "x");
      setNota(quem === "o" ? "sua vez" : "…");
      return false;
    },
    [reiniciar, usuarioComeca],
  );

  const jogarO = useCallback(
    (atual: Tabuleiro) => {
      setTravado(true);
      agendar(() => {
        const i = jogadaIa(atual);
        if (i < 0) {
          setTravado(false);
          return;
        }
        const proximo = [...atual];
        proximo[i] = "o";
        setTab(proximo);
        const fim = aposJogada(proximo, "o");
        if (!fim) setTravado(false);
      }, 420 + Math.random() * 280);
    },
    [agendar, aposJogada],
  );

  useEffect(() => {
    if (travado) return;
    if (vez !== "o") return;
    if (vencedor(tab) || livres(tab).length === 0) return;
    jogarO(tab);
  }, [vez, tab, travado, jogarO]);

  useEffect(() => () => limparTimers(), []);

  function clicar(i: number) {
    if (travado || vez !== "x" || tab[i]) return;
    const proximo = [...tab];
    proximo[i] = "x";
    setTab(proximo);
    setTravado(true);
    const fim = aposJogada(proximo, "x");
    if (!fim) setTravado(false);
  }

  const riscoPath = risco ? RISCOS[risco] : null;

  return (
    <div className="velha flex items-center gap-3 select-none" aria-label="Jogo da velha GuiX.net">
      <div className="relative h-[56px] w-[56px] shrink-0 sm:h-[64px] sm:w-[64px]">
        <svg viewBox="0 0 108 108" className="absolute inset-0 h-full w-full" aria-hidden="true">
          <path className="velha-grade" d="M36.4 9.6c1.1 14.2-.6 29.8.3 44.2.6 12.8-.4 26.6.2 40.4" />
          <path
            className="velha-grade"
            d="M72.2 8.9c-.4 15.1.8 31.2-.2 46.1-.7 13.4.5 27.8-.1 41.6"
            style={{ animationDelay: "130ms" }}
          />
          <path
            className="velha-grade"
            d="M9.2 36.8c15.4.9 31.6-.5 47.1.3 14.1.6 28.8-.4 42.9.2"
            style={{ animationDelay: "70ms" }}
          />
          <path
            className="velha-grade"
            d="M8.6 72.4c16.1-.7 32.4.6 48.2-.2 13.8-.6 28.6.5 43.1-.1"
            style={{ animationDelay: "210ms" }}
          />
          {riscoPath ? <path key={risco} className="velha-risco" d={riscoPath} /> : null}
        </svg>
        <div className="absolute inset-[5px] grid grid-cols-3 grid-rows-3 gap-px">
          {tab.map((casa, i) => (
            <button
              key={`${rodada.current}-${i}`}
              type="button"
              className="velha-casa relative flex items-center justify-center p-0.5"
              aria-label={casa ? `Casa ${i + 1}, ${casa === "x" ? "xis" : "bolinha"}` : `Casa ${i + 1}, vazia`}
              disabled={Boolean(casa) || travado || vez !== "x"}
              onClick={() => clicar(i)}
            >
              {casa ? <Marca tipo={casa} /> : null}
            </button>
          ))}
        </div>
      </div>
      <p className="min-w-[7.5rem] text-left text-[10px] font-medium leading-4 tracking-wide text-slate-600">
        {nota}
      </p>
    </div>
  );
}
