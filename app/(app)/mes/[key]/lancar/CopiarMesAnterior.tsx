"use client";

import { useActionState } from "react";
import { copiarRecorrentes, type EstadoCopia } from "@/app/actions/lancamentos";
import { Aviso, Botao } from "@/components/ui";

export function CopiarMesAnterior({
  chaveMes,
  nomeAnterior,
  qtdReceitasFixas,
  qtdDespesasRecorrentes,
}: {
  chaveMes: string;
  nomeAnterior: string;
  qtdReceitasFixas: number;
  qtdDespesasRecorrentes: number;
}) {
  const [estado, formAction, pendente] = useActionState<EstadoCopia, FormData>(
    () => copiarRecorrentes(chaveMes),
    null,
  );

  if (qtdReceitasFixas === 0 && qtdDespesasRecorrentes === 0) return null;

  return (
    <Aviso tipo="info" titulo={`Repetir o que era fixo em ${nomeAnterior}`}>
      <p>
        {nomeAnterior} tinha {qtdReceitasFixas} receita(s) fixa(s) e{" "}
        {qtdDespesasRecorrentes} gasto(s) recorrente(s). Como sua renda é fixa,
        dá para trazer tudo de uma vez e só ajustar o que mudou.
      </p>
      <form action={formAction} className="mt-2">
        <Botao type="submit" variante="secundario" disabled={pendente}>
          {pendente ? "Copiando..." : "Copiar do mês anterior"}
        </Botao>
      </form>
      {estado?.ok ? (
        <p className="mt-2 font-semibold text-ok">
          Copiados: {estado.receitas} receita(s) e {estado.despesas} gasto(s).
        </p>
      ) : null}
      {estado && !estado.ok ? (
        <p className="mt-2 font-semibold text-alerta">{estado.erro}</p>
      ) : null}
    </Aviso>
  );
}
