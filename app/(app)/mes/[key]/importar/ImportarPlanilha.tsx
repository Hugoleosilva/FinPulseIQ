"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  importarPlanilha,
  type EstadoImport,
} from "@/app/actions/importar";
import { Botao, Aviso, Card } from "@/components/ui";

const MODELO_LINHAS = [
  "tipo,descricao,valor,dia,categoria,subcategoria,classificacao,forma de pagamento",
  "Despesa,Aluguel,1200.00,10,Moradia,Aluguel,essencial,boleto",
  "Despesa,Mercado do mês,550.00,8,Alimentação,Mercado,essencial,debito",
  "Despesa,Pizza,90.00,14,Alimentação,Delivery,desnecessario,cartao",
  "Receita,Salário,5000.00,5,,,,",
];

export function ImportarPlanilha({ chaveMes }: { chaveMes: string }) {
  const action = importarPlanilha.bind(null, chaveMes);
  const [estado, formAction, pendente] = useActionState<EstadoImport, FormData>(
    action,
    null,
  );

  const baixarModelo = () => {
    const blob = new Blob([MODELO_LINHAS.join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "modelo-finpulse.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-5">
      <Aviso tipo="info" titulo="Como funciona">
        Se você já controla seus gastos numa planilha, dá para trazer tudo de uma
        vez. O arquivo precisa ter, no mínimo, uma coluna de{" "}
        <strong>descrição</strong> e uma de <strong>valor</strong>. As outras
        colunas ajudam a classificar melhor. O jeito mais fácil é baixar o
        modelo abaixo, colar seus dados nele e enviar.
      </Aviso>

      <Card>
        <p className="font-bold">Colunas que o FinPulseIQ entende</p>
        <ul className="mt-2 space-y-1 text-sm text-texto-suave">
          <li>
            <strong>tipo</strong>: “Receita” ou “Despesa” (se ficar em branco,
            é tratado como despesa)
          </li>
          <li>
            <strong>descricao</strong> e <strong>valor</strong> — obrigatórias
          </li>
          <li>
            <strong>dia</strong>: dia do mês (1 a 31)
          </li>
          <li>
            <strong>categoria</strong> e <strong>subcategoria</strong>: se não
            bater com as do sistema, cai em “Outros”
          </li>
          <li>
            <strong>classificacao</strong>: “essencial”, “pode reduzir” ou
            “dá para viver sem”
          </li>
          <li>
            <strong>forma de pagamento</strong>: dinheiro, débito, pix, cartão,
            boleto
          </li>
        </ul>
        <div className="mt-3">
          <Botao variante="secundario" onClick={baixarModelo}>
            Baixar modelo (.csv)
          </Botao>
        </div>
      </Card>

      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="planilha" className="text-base font-bold">
            Seu arquivo (.xlsx ou .csv)
          </label>
          <input
            id="planilha"
            name="planilha"
            type="file"
            accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            required
            className="rounded-xl border border-borda bg-white p-2 text-sm"
          />
        </div>
        <Botao type="submit" disabled={pendente}>
          {pendente ? "Importando..." : "Importar para este mês"}
        </Botao>
      </form>

      {estado && !estado.ok ? <Aviso tipo="perigo">{estado.erro}</Aviso> : null}

      {estado && estado.ok ? (
        <Aviso
          tipo={estado.erros.length ? "alerta" : "ok"}
          titulo={`Importado: ${estado.receitas} receita(s) e ${estado.despesas} gasto(s)`}
        >
          {estado.erros.length ? (
            <>
              <p>Algumas linhas foram ignoradas:</p>
              <ul className="ml-4 mt-1 list-disc">
                {estado.erros.slice(0, 12).map((e, i) => (
                  <li key={i}>
                    Linha {e.linha}: {e.mensagem}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p>Tudo certo!</p>
          )}
          <p className="mt-2">
            <Link
              href={`/mes/${chaveMes}`}
              className="font-bold text-acento-escuro underline"
            >
              Ver o resultado no meu mês
            </Link>
          </p>
        </Aviso>
      ) : null}
    </div>
  );
}
