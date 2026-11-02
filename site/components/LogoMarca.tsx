"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

const ESPERA_INICIAL_MS = 5000;

export function LogoMarca() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const tocando = useRef(false);
  const afastou = useRef(false);
  const ocultou = useRef(false);

  useEffect(() => {
    const video = videoRef.current;
    const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!video || reduzido) return;

    function reproduzir() {
      const atual = videoRef.current;
      if (!atual || tocando.current) return;
      tocando.current = true;
      atual.currentTime = 0;
      atual.play().catch(() => {
        tocando.current = false;
      });
    }

    const inicio = window.setTimeout(reproduzir, ESPERA_INICIAL_MS);

    function aoVisibilidade() {
      if (document.visibilityState === "hidden") ocultou.current = true;
      if (document.visibilityState === "visible" && ocultou.current) {
        ocultou.current = false;
        reproduzir();
      }
    }

    function aoRolar() {
      if (window.scrollY > 520) afastou.current = true;
      else if (afastou.current && window.scrollY < 48) {
        afastou.current = false;
        reproduzir();
      }
    }

    function aoVoltar(evento: PageTransitionEvent) {
      if (evento.persisted) reproduzir();
    }

    document.addEventListener("visibilitychange", aoVisibilidade);
    window.addEventListener("scroll", aoRolar, { passive: true });
    window.addEventListener("pageshow", aoVoltar);

    return () => {
      window.clearTimeout(inicio);
      document.removeEventListener("visibilitychange", aoVisibilidade);
      window.removeEventListener("scroll", aoRolar);
      window.removeEventListener("pageshow", aoVoltar);
    };
  }, []);

  function aoTerminar() {
    const video = videoRef.current;
    tocando.current = false;
    if (!video || !Number.isFinite(video.duration)) return;
    const fim = Math.max(0, video.duration - 0.05);
    video.pause();
    if (video.currentTime < fim - 0.2) video.currentTime = fim;
  }

  function inicio(evento: React.MouseEvent<HTMLAnchorElement>) {
    if (window.location.pathname !== "/") return;
    evento.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <Link href="/" aria-label="GuiX.net, início" onClick={inicio} className="block shrink-0">
      <video
        ref={videoRef}
        className="logo-marca h-10 w-auto sm:h-12"
        poster="/midia/logo-estatico.webp"
        muted
        playsInline
        preload="auto"
        disablePictureInPicture
        onEnded={aoTerminar}
      >
        <source src="/midia/logo-header.mp4" type="video/mp4" />
      </video>
    </Link>
  );
}
