"use client";

import { useState, type ReactNode } from "react";
import { Botao, BotaoLink } from "@/components/ui";

export interface PassoWizard {
  titulo: string;
  subtitulo: string;
  conteudo: ReactNode;
}

export function WizardLancamento({
  passos,
  chaveMes,
}: {
  passos: PassoWizard[];
  chaveMes: string;
}) {
  const [i, setI] = useState(0);
  const passo = passos[i];
  const ultimo = i === passos.length - 1;

  return (
    <div className="flex flex-col gap-5">
      <ol className="flex flex-wrap gap-2">
        {passos.map((p, idx) => (
          <li key={p.titulo}>
            <button
              onClick={() => setI(idx)}
              className={`rounded-full px-3 py-1 text-sm font-bold ${
                idx === i
                  ? "bg-acento text-white"
                  : idx < i
                    ? "bg-ok/15 text-ok"
                    : "bg-fundo text-texto-suave"
              }`}
            >
              {idx + 1}. {p.titulo}
            </button>
          </li>
        ))}
      </ol>

      <div>
        <h1 className="text-2xl font-extrabold">{passo.titulo}</h1>
        <p className="mt-1 text-texto-suave">{passo.subtitulo}</p>
      </div>

      <div>{passo.conteudo}</div>

      <div className="flex items-center justify-between gap-3 border-t border-borda pt-4">
        <Botao
          variante="secundario"
          onClick={() => setI((v) => Math.max(0, v - 1))}
          disabled={i === 0}
        >
          Voltar
        </Botao>
        {ultimo ? (
          <BotaoLink href={`/mes/${chaveMes}`}>Concluir</BotaoLink>
        ) : (
          <Botao onClick={() => setI((v) => Math.min(passos.length - 1, v + 1))}>
            Próximo passo
          </Botao>
        )}
      </div>
    </div>
  );
}
