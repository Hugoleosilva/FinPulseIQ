"use client";

import { useActionState, useEffect, useRef } from "react";
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

  useEffect(() => {
    if (estado?.ok) ref.current?.reset();
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
