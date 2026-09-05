"use client";

import { useActionState, useEffect, useRef } from "react";
import { salvarCompromissoAction } from "@/app/actions/cartoes";
import { CampoTexto, CampoSelect } from "@/components/campos";
import { Botao, Aviso } from "@/components/ui";
import { CATEGORIAS } from "@/lib/categorias";
import type { EstadoForm } from "@/lib/forms";

export function FormCompromisso() {
  const [estado, action, pendente] = useActionState<EstadoForm, FormData>(
    salvarCompromissoAction,
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
          id="cp-descricao"
          name="descricao"
          rotulo="O que você está pagando parcelado?"
          exemplo="Geladeira nova, conserto do carro"
          required
          erro={campos?.descricao}
        />
      </div>
      <CampoTexto
        id="cp-valor"
        name="valorParcela"
        rotulo="Valor de cada parcela"
        prefixo="R$"
        inputMode="decimal"
        placeholder="0,00"
        exemplo="250,00"
        required
        erro={campos?.valorParcela}
      />
      <CampoTexto
        id="cp-restantes"
        name="parcelasRestantes"
        rotulo="Quantas parcelas ainda faltam?"
        type="number"
        min={1}
        max={360}
        defaultValue={6}
        exemplo="Se faltam 6, escreva 6"
        required
        erro={campos?.parcelasRestantes}
      />
      <CampoSelect
        id="cp-categoria"
        name="categoria"
        rotulo="Categoria"
        defaultValue="Compras"
      >
        {CATEGORIAS.map((c) => (
          <option key={c.nome} value={c.nome}>
            {c.emoji} {c.nome}
          </option>
        ))}
      </CampoSelect>
      <div className="sm:col-span-2 flex items-center gap-3">
        <Botao type="submit" disabled={pendente}>
          {pendente ? "Salvando..." : "Adicionar compromisso"}
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
