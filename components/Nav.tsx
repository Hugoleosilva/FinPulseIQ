"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "./Logo";
import { sair } from "@/app/actions/auth";
import { entrarNaArea } from "@/app/actions/area";

interface LinkNav {
  href: string;
  rotulo: string;
  combina: (p: string) => boolean;
}

const LINKS: LinkNav[] = [
  {
    href: "/mes",
    rotulo: "Meu mês",
    combina: (p) => p.startsWith("/mes") && !p.includes("/diagnostico"),
  },
  {
    href: "/diagnostico",
    rotulo: "Diagnóstico",
    combina: (p) => p.startsWith("/mes") && p.includes("/diagnostico"),
  },
  { href: "/historico", rotulo: "Histórico", combina: (p) => p === "/historico" },
  {
    href: "/cartoes",
    rotulo: "Cartões e documentos",
    combina: (p) => p.startsWith("/cartoes"),
  },
  { href: "/ajuda", rotulo: "Ajuda", combina: (p) => p.startsWith("/ajuda") },
];

export function Nav({
  nome,
  mesAtual,
  parceiro,
}: {
  nome: string;
  mesAtual: string;
  parceiro: { login: string; nome: string } | null;
}) {
  const pathname = usePathname() ?? "";
  const [aberto, setAberto] = useState(false);

  const hrefDe = (base: string) => {
    if (base === "/mes") return `/mes/${mesAtual}`;
    if (base === "/diagnostico") return `/mes/${mesAtual}/diagnostico`;
    return base;
  };

  return (
    <header className="border-b border-borda bg-superficie">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href={`/mes/${mesAtual}`}>
          <Logo tamanho={26} />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={hrefDe(l.href)}
              className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                l.combina(pathname)
                  ? "bg-acento/10 text-acento-escuro"
                  : "text-texto-suave hover:text-texto"
              }`}
            >
              {l.rotulo}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {parceiro ? (
            <form action={entrarNaArea.bind(null, parceiro.login)}>
              <button className="rounded-lg border border-acento/40 px-3 py-1.5 text-sm font-semibold text-acento-escuro hover:bg-acento/5">
                Área de {parceiro.nome}
              </button>
            </form>
          ) : null}
          <span className="text-sm text-texto-suave">Olá, {nome}</span>
          <form action={sair}>
            <button className="text-sm font-semibold text-texto-suave underline hover:text-texto">
              Sair
            </button>
          </form>
        </div>

        <button
          className="rounded-lg border border-borda px-3 py-2 text-sm font-semibold lg:hidden"
          onClick={() => setAberto((v) => !v)}
          aria-expanded={aberto}
        >
          Menu
        </button>
      </div>

      {aberto ? (
        <div className="border-t border-borda px-4 py-2 lg:hidden">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={hrefDe(l.href)}
              onClick={() => setAberto(false)}
              className="block rounded-lg px-3 py-2 font-semibold text-texto-suave"
            >
              {l.rotulo}
            </Link>
          ))}
          {parceiro ? (
            <form
              action={entrarNaArea.bind(null, parceiro.login)}
              className="px-3 py-2"
            >
              <button className="font-semibold text-acento-escuro underline">
                Ir para a área de {parceiro.nome}
              </button>
            </form>
          ) : null}
          <form action={sair} className="px-3 py-2">
            <button className="font-semibold text-texto-suave underline">
              Sair ({nome})
            </button>
          </form>
        </div>
      ) : null}
    </header>
  );
}
