"use client";

import { useActionState, useEffect, useRef } from "react";
import { adicionarReceita } from "@/app/actions/lancamentos";
import { CampoTexto, CampoSelect } from "@/components/campos";
import { Botao, Aviso } from "@/components/ui";
import type { EstadoForm } from "@/lib/forms";

export function FormReceita({ chaveMes }: { chaveMes: string }) {
  const action = adicionarReceita.bind(null, chaveMes);
  const [estado, formAction, pendente] = useActionState<EstadoForm, FormData>(
    action,
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
      action={formAction}
      className="grid gap-4 rounded-xl border border-borda bg-fundo p-4 sm:grid-cols-2"
    >
      <div className="sm:col-span-2">
        <CampoTexto
          id="r-descricao"
          name="descricao"
          rotulo="De onde vem esse dinheiro?"
          exemplo="Salário, aluguel que recebo, bico, pensão"
          required
          erro={campos?.descricao}
        />
      </div>

      <CampoTexto
        id="r-valor"
        name="valor"
        rotulo="Quanto?"
        prefixo="R$"
        inputMode="decimal"
        placeholder="0,00"
        exemplo="3.500,00"
        required
        erro={campos?.valor}
      />

      <CampoTexto
        id="r-dia"
        name="dia"
        rotulo="Em que dia do mês entra?"
        type="number"
        min={1}
        max={31}
        defaultValue={5}
        exemplo="5 (dia do pagamento)"
        required
        erro={campos?.dia}
      />

      <CampoSelect
        id="r-tipo"
        name="tipo"
        rotulo="Esse valor se repete todo mês?"
        defaultValue="fixa"
      >
        <option value="fixa">Sim, é fixo todo mês</option>
        <option value="variavel">Não, varia ou é eventual</option>
      </CampoSelect>

      <div className="sm:col-span-2 flex items-center gap-3">
        <Botao type="submit" disabled={pendente}>
          {pendente ? "Salvando..." : "Adicionar"}
        </Botao>
        {estado?.ok && estado.mensagem ? (
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
