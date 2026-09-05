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
  const [expandido, setExpandido] = useState(false);

  // --- Já existe salário/aposentadoria detalhado ---------------------------
  if (salario) {
    return (
      <div>
        <h3 className="mb-2 text-lg font-bold">Salário / aposentadoria</h3>
        {editando ? (
          <FormSalario
            chaveMes={chaveMes}
            receitaInicial={salario}
            aoConcluir={() => setEditando(false)}
          />
        ) : (
          <Aviso tipo="ok" titulo="Já registrado neste mês">
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
                Editar
              </Botao>
              <BotaoExcluir
                acao={removerReceita.bind(null, chaveMes, salario.id)}
                confirmar="Apagar o salário/aposentadoria deste mês?"
                rotulo="Apagar"
              />
            </div>
          </Aviso>
        )}
      </div>
    );
  }

  // --- Ainda não há: mostra recolhido (nem todo mundo tem holerite) --------
  return (
    <div>
      <h3 className="mb-2 text-lg font-bold">Salário / aposentadoria</h3>
      {expandido ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-texto-suave">
            Liste os <strong>proventos</strong> (salário, aposentadoria, auxílios)
            e os <strong>descontos</strong> (INSS, imposto, plano de saúde,
            consignado). Entra como receita o valor <strong>líquido</strong>. Se
            teve aumento, use o valor novo a partir do mês em que passou a valer.
          </p>
          <FormSalario chaveMes={chaveMes} />
          <button
            onClick={() => setExpandido(false)}
            className="self-start text-sm font-semibold text-texto-suave underline"
          >
            Fechar — não tenho descontos
          </button>
        </div>
      ) : (
        <Aviso tipo="info">
          <p>
            Tem salário ou aposentadoria com <strong>descontos</strong> (INSS,
            plano de saúde, consignado, imposto)? Detalhe aqui para o sistema
            calcular o líquido — dá até para enviar o PDF do holerite.
          </p>
          <p className="mt-1">
            Se for um valor que cai <strong>limpo</strong> na conta, pule esta
            parte e use <strong>“Outras receitas”</strong> abaixo (aposentadoria,
            aluguel que você recebe, etc.).
          </p>
          <div className="mt-3">
            <Botao variante="secundario" onClick={() => setExpandido(true)}>
              Detalhar salário / aposentadoria
            </Botao>
          </div>
        </Aviso>
      )}
    </div>
  );
}
