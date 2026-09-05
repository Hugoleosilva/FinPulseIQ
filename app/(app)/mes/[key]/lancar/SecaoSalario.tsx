"use client";

import { useState } from "react";
import { removerReceita } from "@/app/actions/lancamentos";
import { formatBRL } from "@/lib/format";
import { Botao, Aviso } from "@/components/ui";
import { BotaoExcluir } from "@/components/BotaoExcluir";
import { FormSalario } from "./FormSalario";
import type { Receita } from "@/lib/tipos";

export function SecaoSalario({
  chaveMes,
  salario,
}: {
  chaveMes: string;
  salario?: Receita;
}) {
  const [editando, setEditando] = useState(false);

  if (!salario) {
    return (
      <div>
        <h3 className="mb-2 text-lg font-bold">Seu salário</h3>
        <p className="mb-3 text-sm text-texto-suave">
          Preencha proventos e descontos (ou envie o PDF do holerite). Entra como
          receita o valor <strong>líquido</strong>, que é o que cai na conta. Se
          você teve aumento, use o valor novo a partir do mês em que passou a
          valer.
        </p>
        <FormSalario chaveMes={chaveMes} />
      </div>
    );
  }

  return (
    <div>
      <h3 className="mb-2 text-lg font-bold">Seu salário</h3>
      {editando ? (
        <FormSalario
          chaveMes={chaveMes}
          receitaInicial={salario}
          aoConcluir={() => setEditando(false)}
        />
      ) : (
        <Aviso tipo="ok" titulo="Salário deste mês já registrado">
          <p className="text-base">
            <strong>{salario.descricao}</strong> — líquido de{" "}
            <strong>{formatBRL(salario.valor)}</strong>, dia {salario.dia}.
          </p>
          {salario.detalhe &&
          (salario.detalhe.proventos.length ||
            salario.detalhe.descontos.length) ? (
            <details className="mt-2 text-sm">
              <summary className="cursor-pointer">Ver detalhamento</summary>
              <div className="mt-1 grid gap-1 pl-3">
                {salario.detalhe.proventos.map((p, i) => (
                  <span key={`p${i}`}>
                    + {p.descricao}: {formatBRL(p.valor)}
                  </span>
                ))}
                {salario.detalhe.descontos.map((dd, i) => (
                  <span key={`d${i}`} className="text-alerta">
                    − {dd.descricao}: {formatBRL(dd.valor)}
                  </span>
                ))}
              </div>
            </details>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Botao variante="secundario" onClick={() => setEditando(true)}>
              Editar salário
            </Botao>
            <BotaoExcluir
              acao={removerReceita.bind(null, chaveMes, salario.id)}
              confirmar="Apagar o salário deste mês?"
              rotulo="Apagar salário"
            />
          </div>
        </Aviso>
      )}
    </div>
  );
}
