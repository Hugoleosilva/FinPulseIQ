"use client";

import { useState } from "react";
import { removerDespesa } from "@/app/actions/lancamentos";
import { emojiCategoria, ROTULO_ESSENCIALIDADE } from "@/lib/categorias";
import { formatBRL } from "@/lib/format";
import { BotaoExcluir } from "@/components/BotaoExcluir";
import { FormDespesa } from "./FormDespesa";
import type { Despesa, Cartao } from "@/lib/tipos";

const ETIQUETA_NATUREZA: Record<Despesa["natureza"], string> = {
  normal: "",
  fixa: "conta fixa",
  parcelada: "parcelada",
  extraordinaria: "não se repete",
};

export function ListaDespesas({
  chaveMes,
  despesas,
  cartoes,
}: {
  chaveMes: string;
  despesas: Despesa[];
  cartoes: Cartao[];
}) {
  const [editId, setEditId] = useState<string | null>(null);

  if (despesas.length === 0) {
    return (
      <p className="text-sm text-texto-suave">Nenhum gasto cadastrado ainda.</p>
    );
  }

  return (
    <ul className="divide-y divide-borda rounded-xl border border-borda">
      {despesas.map((d) => (
        <li key={d.id} className="p-3">
          {editId === d.id ? (
            <FormDespesa
              chaveMes={chaveMes}
              cartoes={cartoes}
              despesaInicial={d}
              aoConcluir={() => setEditId(null)}
            />
          ) : (
            <div className="flex items-center justify-between gap-3">
              <span className="min-w-0">
                <span className="font-semibold">
                  {emojiCategoria(d.categoria)} {d.descricao}
                </span>
                <span className="block text-sm text-texto-suave">
                  {d.categoria} · {d.subcategoria} ·{" "}
                  {ROTULO_ESSENCIALIDADE[d.essencialidade]}
                  {ETIQUETA_NATUREZA[d.natureza]
                    ? ` · ${ETIQUETA_NATUREZA[d.natureza]}`
                    : ""}
                  {d.parcela
                    ? ` (${d.parcela.atual}/${d.parcela.total})`
                    : ""}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-1">
                <span className="tabular font-bold text-texto">
                  {formatBRL(d.valor)}
                </span>
                <button
                  onClick={() => setEditId(d.id)}
                  className="rounded-lg px-2 py-1 text-sm font-semibold text-acento-escuro hover:bg-acento/10"
                >
                  Editar
                </button>
                <BotaoExcluir
                  acao={removerDespesa.bind(null, chaveMes, d.id)}
                  confirmar={`Apagar o gasto "${d.descricao}"?`}
                />
              </span>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
