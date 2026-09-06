"use client";

import { useState } from "react";
import {
  removerDespesa,
  alternarDespesaPaga,
  alternarFaturaCartaoPaga,
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

/** Chave do cartão de uma despesa, ou "" se não é gasto de cartão. */
function chaveCartao(d: Despesa): string {
  return d.cartaoId ?? (d.meioPagamento === "cartao" ? "__cartao__" : "");
}

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

  // Faturas de cartão: agrupa para pagar de uma vez, não uma a uma.
  const faturas = [...new Set(despesas.map(chaveCartao))]
    .filter((k) => k !== "")
    .map((k) => {
      const itens = despesas.filter((d) => chaveCartao(d) === k);
      const cartao = cartoes.find((c) => c.id === k);
      return {
        chave: k,
        nome: cartao ? cartao.nome : "Cartão de crédito",
        total: itens.reduce((a, d) => a + d.valor, 0),
        qtd: itens.length,
        todasPagas: itens.every((d) => d.pago),
      };
    })
    .sort((a, b) => b.total - a.total);

  const nomeFatura = (d: Despesa) =>
    faturas.find((f) => f.chave === chaveCartao(d))?.nome ?? null;

  return (
    <div className="flex flex-col gap-2">
      {algumMarcado ? (
        <p className="text-sm text-texto-suave">
          Já pago: <strong>{formatBRL(totalPago)}</strong> · Falta pagar:{" "}
          <strong>{formatBRL(totalGeral - totalPago)}</strong>
        </p>
      ) : null}

      {faturas.length > 0 ? (
        <div className="flex flex-col gap-2 rounded-xl border border-borda bg-fundo p-3">
          <p className="text-sm font-semibold text-texto-suave">
            Faturas de cartão — marque a fatura inteira de uma vez
          </p>
          {faturas.map((f) => (
            <div
              key={f.chave}
              className="flex flex-wrap items-center justify-between gap-2"
            >
              <span>
                💳 <span className="font-semibold">{f.nome}</span>
                <span className="ml-1 text-sm text-texto-suave">
                  {f.qtd} lançamento(s)
                </span>
                {f.todasPagas ? (
                  <span className="ml-2 rounded bg-ok/15 px-1.5 py-0.5 text-xs font-bold text-ok">
                    paga
                  </span>
                ) : null}
              </span>
              <span className="flex items-center gap-2">
                <span
                  className={`tabular font-bold ${
                    f.todasPagas ? "text-texto-suave line-through" : "text-texto"
                  }`}
                >
                  {formatBRL(f.total)}
                </span>
                <form
                  action={alternarFaturaCartaoPaga.bind(
                    null,
                    chaveMes,
                    f.chave,
                  )}
                >
                  <button
                    type="submit"
                    className={`rounded-lg px-2 py-1 text-sm font-bold ${
                      f.todasPagas
                        ? "text-texto-suave hover:bg-superficie"
                        : "bg-ok/10 text-ok hover:bg-ok/20"
                    }`}
                  >
                    {f.todasPagas ? "Desmarcar fatura" : "Marcar fatura paga"}
                  </button>
                </form>
              </span>
            </div>
          ))}
        </div>
      ) : null}

      <ul className="divide-y divide-borda rounded-xl border border-borda">
        {despesas.map((d) => {
          const daFatura = chaveCartao(d) !== "";
          return (
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
                      {daFatura ? ` · 💳 ${nomeFatura(d)}` : ""}
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
                    {daFatura ? null : (
                      <form
                        action={alternarDespesaPaga.bind(null, chaveMes, d.id)}
                      >
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
                    )}
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
          );
        })}
      </ul>
    </div>
  );
}
