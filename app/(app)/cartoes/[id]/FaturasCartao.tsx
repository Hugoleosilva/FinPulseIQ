"use client";

import { useState } from "react";
import { useActionState } from "react";
import {
  lancarFaturaTotal,
  apagarFaturaTotal,
  type EstadoTotal,
} from "@/app/actions/fatura";
import { nomeMes, formatBRL, deslocaMes } from "@/lib/format";
import { Botao, Aviso } from "@/components/ui";
import { CampoTexto } from "@/components/campos";
import { BotaoExcluir } from "@/components/BotaoExcluir";

export interface FaturaTotalItem {
  key: string;
  valor: number;
  aberta: boolean;
  despesaId: string;
}

export function FaturasCartao({
  cartaoId,
  cartaoNome,
  mesAtual,
  faturas,
}: {
  cartaoId: string;
  cartaoNome: string;
  mesAtual: string;
  faturas: FaturaTotalItem[];
}) {
  const opcoes = [-1, 0, 1, 2].map((n) => deslocaMes(mesAtual, n));
  const [mes, setMes] = useState(mesAtual);
  const existente = faturas.find((f) => f.key === mes);

  const [estado, action, pendente] = useActionState<EstadoTotal, FormData>(
    lancarFaturaTotal.bind(null, cartaoId, mes),
    null,
  );

  return (
    <div className="flex flex-col gap-4">
      {faturas.length > 0 ? (
        <ul className="divide-y divide-borda rounded-xl border border-borda">
          {faturas.map((f) => (
            <li
              key={f.key}
              className="flex items-center justify-between gap-3 p-3"
            >
              <span>
                <span className="font-semibold capitalize">
                  {nomeMes(f.key)}
                </span>
                <span
                  className={`ml-2 rounded px-1.5 py-0.5 text-xs font-bold ${
                    f.aberta
                      ? "bg-alerta/15 text-alerta"
                      : "bg-ok/15 text-ok"
                  }`}
                >
                  {f.aberta ? "em aberto" : "fechada"}
                </span>
              </span>
              <span className="flex items-center gap-2">
                <span className="tabular font-bold">{formatBRL(f.valor)}</span>
                <BotaoExcluir
                  acao={apagarFaturaTotal.bind(null, cartaoId, f.key, f.despesaId)}
                  confirmar={`Apagar a fatura de ${nomeMes(f.key)}?`}
                />
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      <form
        action={action}
        className="grid gap-3 rounded-xl border border-borda bg-fundo p-4 sm:grid-cols-2"
      >
        <label className="text-sm font-bold">
          Mês da fatura
          <select
            value={mes}
            onChange={(e) => setMes(e.target.value)}
            className="mt-1 w-full rounded-xl border border-borda bg-white px-3 py-2"
          >
            {opcoes.map((k) => (
              <option key={k} value={k}>
                {nomeMes(k)}
              </option>
            ))}
          </select>
        </label>

        <CampoTexto
          id="fc-valor"
          name="valor"
          rotulo="Valor total da fatura"
          prefixo="R$"
          inputMode="decimal"
          placeholder="0,00"
          defaultValue={
            existente
              ? existente.valor
                  .toLocaleString("pt-BR", { minimumFractionDigits: 2 })
              : ""
          }
          key={mes}
        />

        <fieldset className="sm:col-span-2 flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              name="aberta"
              defaultChecked={existente ? existente.aberta : true}
              key={`ab-${mes}`}
              className="h-5 w-5 accent-acento"
            />
            Fatura ainda em aberto (o valor pode mudar até fechar)
          </label>
        </fieldset>

        <div className="sm:col-span-2">
          <Botao type="submit" disabled={pendente}>
            {pendente
              ? "Salvando..."
              : existente
                ? `Atualizar a fatura de ${nomeMes(mes)}`
                : `Salvar a fatura de ${nomeMes(mes)}`}
          </Botao>
        </div>

        {estado?.ok ? (
          <div className="sm:col-span-2">
            <Aviso tipo="ok">Fatura de {nomeMes(mes)} salva.</Aviso>
          </div>
        ) : null}
        {estado && !estado.ok ? (
          <div className="sm:col-span-2">
            <Aviso tipo="perigo">{estado.erro}</Aviso>
          </div>
        ) : null}
      </form>

      <p className="text-xs text-texto-suave">
        Isso lança um único gasto “Fatura {cartaoNome}” no mês escolhido. Se você
        também importar o PDF detalhado desse mês, apague este para não contar
        duas vezes.
      </p>
    </div>
  );
}
