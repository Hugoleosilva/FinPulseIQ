"use client";

import { useState } from "react";
import { removerReceita } from "@/app/actions/lancamentos";
import { formatBRL } from "@/lib/format";
import { BotaoExcluir } from "@/components/BotaoExcluir";
import { FormReceita } from "./FormReceita";
import { FormSalario } from "./FormSalario";
import type { Receita } from "@/lib/tipos";

export function ListaReceitas({
  chaveMes,
  receitas,
}: {
  chaveMes: string;
  receitas: Receita[];
}) {
  const [editId, setEditId] = useState<string | null>(null);

  if (receitas.length === 0) {
    return (
      <p className="text-sm text-texto-suave">
        Nenhuma receita cadastrada ainda.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-borda rounded-xl border border-borda">
      {receitas.map((r) => {
        const temDetalhe =
          !!r.detalhe &&
          (r.detalhe.proventos.length > 0 || r.detalhe.descontos.length > 0);
        return (
          <li key={r.id} className="p-3">
            {editId === r.id ? (
              temDetalhe ? (
                <FormSalario
                  chaveMes={chaveMes}
                  receitaInicial={r}
                  aoConcluir={() => setEditId(null)}
                />
              ) : (
                <FormReceita
                  chaveMes={chaveMes}
                  receitaInicial={r}
                  aoConcluir={() => setEditId(null)}
                />
              )
            ) : (
              <>
                <div className="flex items-center justify-between gap-3">
                  <span>
                    <span className="font-semibold">{r.descricao}</span>
                    <span className="block text-sm text-texto-suave">
                      dia {r.dia}
                      {r.tipo === "fixa" ? " · fixo todo mês" : ""}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1">
                    <span className="tabular font-bold text-ok">
                      {formatBRL(r.valor)}
                    </span>
                    <button
                      onClick={() => setEditId(r.id)}
                      className="rounded-lg px-2 py-1 text-sm font-semibold text-acento-escuro hover:bg-acento/10"
                    >
                      Editar
                    </button>
                    <BotaoExcluir
                      acao={removerReceita.bind(null, chaveMes, r.id)}
                      confirmar={`Apagar a receita "${r.descricao}"?`}
                    />
                  </span>
                </div>
                {temDetalhe ? (
                  <details className="mt-2 text-sm text-texto-suave">
                    <summary className="cursor-pointer">Ver detalhamento</summary>
                    <div className="mt-1 grid gap-1 pl-3">
                      {r.detalhe!.proventos.map((p, i) => (
                        <span key={`p${i}`}>
                          + {p.descricao}: {formatBRL(p.valor)}
                        </span>
                      ))}
                      {r.detalhe!.descontos.map((d, i) => (
                        <span key={`d${i}`} className="text-alerta">
                          − {d.descricao}: {formatBRL(d.valor)}
                        </span>
                      ))}
                    </div>
                  </details>
                ) : null}
              </>
            )}
          </li>
        );
      })}
    </ul>
  );
}
