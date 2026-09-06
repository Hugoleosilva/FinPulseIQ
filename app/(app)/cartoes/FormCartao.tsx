"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { salvarCartaoAction } from "@/app/actions/cartoes";
import { CampoTexto } from "@/components/campos";
import { Botao, Aviso } from "@/components/ui";
import type { EstadoForm } from "@/lib/forms";

export function FormCartao() {
  const [estado, action, pendente] = useActionState<EstadoForm, FormData>(
    salvarCartaoAction,
    null,
  );
  const ref = useRef<HTMLFormElement>(null);
  const campos = estado && !estado.ok ? estado.campos : undefined;
  const [compartilhado, setCompartilhado] = useState(false);

  useEffect(() => {
    if (estado?.ok) {
      ref.current?.reset();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCompartilhado(false);
    }
  }, [estado]);

  return (
    <form
      ref={ref}
      action={action}
      className="grid gap-4 rounded-xl border border-borda bg-fundo p-4 sm:grid-cols-2"
    >
      <div className="sm:col-span-2">
        <CampoTexto
          id="c-nome"
          name="nome"
          rotulo="Nome do cartão"
          exemplo="Nubank, Itaú Gold"
          required
          erro={campos?.nome}
        />
      </div>
      <CampoTexto
        id="c-limite"
        name="limite"
        rotulo="Limite total"
        prefixo="R$"
        inputMode="decimal"
        placeholder="0,00"
        exemplo="3.000,00"
        erro={campos?.limite}
      />
      <CampoTexto
        id="c-bandeira"
        name="bandeira"
        rotulo="Bandeira (opcional)"
        exemplo="Visa, Mastercard"
      />
      <CampoTexto
        id="c-fecha"
        name="diaFechamento"
        rotulo="Dia em que a fatura fecha"
        type="number"
        min={1}
        max={31}
        defaultValue={1}
        exemplo="Vem escrito na fatura"
        erro={campos?.diaFechamento}
      />
      <CampoTexto
        id="c-vence"
        name="diaVencimento"
        rotulo="Dia em que a fatura vence"
        type="number"
        min={1}
        max={31}
        defaultValue={10}
        exemplo="Data limite para pagar"
        erro={campos?.diaVencimento}
      />

      <div className="sm:col-span-2 flex flex-col gap-2 rounded-xl border border-borda bg-white p-3">
        <label className="flex items-center gap-3 font-semibold">
          <input
            type="checkbox"
            name="compartilhado"
            checked={compartilhado}
            onChange={(e) => setCompartilhado(e.target.checked)}
            className="h-5 w-5 accent-acento"
          />
          Este cartão é compartilhado com outra pessoa
        </label>
        {compartilhado ? (
          <CampoTexto
            id="c-titular"
            name="titularFatura"
            rotulo="Nome do titular a extrair da fatura"
            ajuda="Ao importar a fatura desse cartão, só as compras dessa pessoa entram. Use o nome como aparece na fatura."
            exemplo="Angélica  (ou Angélica Silva)"
          />
        ) : null}
      </div>

      <div className="sm:col-span-2 flex items-center gap-3">
        <Botao type="submit" disabled={pendente}>
          {pendente ? "Salvando..." : "Adicionar cartão"}
        </Botao>
        {estado?.ok ? (
          <span className="text-sm font-semibold text-ok">
            {estado.mensagem}
          </span>
        ) : null}
      </div>
      {estado && !estado.ok && estado.erro ? (
        <div className="sm:col-span-2">
          <Aviso tipo="perigo">{estado.erro}</Aviso>
        </div>
      ) : null}
    </form>
  );
}
