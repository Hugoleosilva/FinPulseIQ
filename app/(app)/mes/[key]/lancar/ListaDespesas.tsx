"use client";

import { useState } from "react";
import {
  removerDespesa,
  alternarDespesaPaga,
} from "@/app/actions/lancamentos";
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

  const totalPago = despesas
    .filter((d) => d.pago)
    .reduce((a, d) => a + d.valor, 0);
  const totalGeral = despesas.reduce((a, d) => a + d.valor, 0);
  const algumMarcado = despesas.some((d) => d.pago != null);

  return (
    <div className="flex flex-col gap-2">
      {algumMarcado ? (
        <p className="text-sm text-texto-suave">
          Já pago: <strong>{formatBRL(totalPago)}</strong> · Falta pagar:{" "}
          <strong>{formatBRL(totalGeral - totalPago)}</strong>
        </p>
      ) : null}
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
                  {d.pago ? (
                    <span className="ml-2 rounded bg-ok/15 px-1.5 py-0.5 text-xs font-bold text-ok">
                      pago
                    </span>
                  ) : null}
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
                <span
                  className={`tabular font-bold ${
                    d.pago ? "text-texto-suave line-through" : "text-texto"
                  }`}
                >
                  {formatBRL(d.valor)}
                </span>
                <form action={alternarDespesaPaga.bind(null, chaveMes, d.id)}>
                  <button
                    type="submit"
                    className={`rounded-lg px-2 py-1 text-sm font-semibold ${
                      d.pago
                        ? "text-texto-suave hover:bg-fundo"
                        : "text-ok hover:bg-ok/10"
                    }`}
                  >
                    {d.pago ? "Desmarcar" : "Marcar pago"}
                  </button>
                </form>
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
    </div>
  );
}
