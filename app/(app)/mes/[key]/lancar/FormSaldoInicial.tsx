"use client";

import { useActionState } from "react";
import { definirSaldoInicial } from "@/app/actions/lancamentos";
import { CampoTexto } from "@/components/campos";
import { Botao, Aviso } from "@/components/ui";
import type { EstadoForm } from "@/lib/forms";

export function FormSaldoInicial({
  chaveMes,
  valorAtual,
}: {
  chaveMes: string;
  valorAtual: number;
}) {
  const action = definirSaldoInicial.bind(null, chaveMes);
  const [estado, formAction, pendente] = useActionState<EstadoForm, FormData>(
    action,
    null,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Aviso tipo="info" titulo="O que é isso?">
        É quanto você tinha na conta (e no dinheiro) no primeiro dia do mês,
        antes de receber ou gastar qualquer coisa. Se não souber o valor exato,
        coloque uma estimativa. Pode ajustar depois.
      </Aviso>

      <CampoTexto
        id="saldoInicial"
        name="saldoInicial"
        rotulo="Quanto você tinha no começo do mês?"
        prefixo="R$"
        inputMode="decimal"
        placeholder="0,00"
        defaultValue={valorAtual ? String(valorAtual).replace(".", ",") : ""}
        exemplo="800,00"
      />

      <div className="flex items-center gap-3">
        <Botao type="submit" disabled={pendente}>
          {pendente ? "Salvando..." : "Salvar"}
        </Botao>
        {estado?.ok ? (
          <span className="text-sm font-semibold text-ok">
            {estado.mensagem}
          </span>
        ) : null}
        {estado && !estado.ok && estado.erro ? (
          <span className="text-sm font-semibold text-perigo">
            {estado.erro}
          </span>
        ) : null}
      </div>
    </form>
  );
}
