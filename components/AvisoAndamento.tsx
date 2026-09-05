import { Aviso } from "@/components/ui";
import { formatBRL } from "@/lib/format";
import type { AndamentoMes } from "@/lib/calculos";

/** Aviso mostrado quando o mês analisado ainda está em andamento. */
export function AvisoAndamento({
  andamento,
  nomeMes,
}: {
  andamento: AndamentoMes;
  nomeMes: string;
}) {
  if (!andamento.emAndamento) return null;
  const { receitaPrevista, despesaPrevista, saldoHoje } = andamento;
  if (receitaPrevista <= 0 && despesaPrevista <= 0) return null;

  return (
    <Aviso
      tipo="info"
      titulo={`${nomeMes} ainda está em andamento (hoje é dia ${andamento.diaDeHoje})`}
    >
      <p>
        Os números abaixo são a <strong>projeção do mês inteiro</strong>. Parte
        ainda <strong>não aconteceu</strong>:
      </p>
      <ul className="ml-4 mt-1 list-disc space-y-0.5">
        {receitaPrevista > 0 ? (
          <li>
            ainda vai entrar: <strong>{formatBRL(receitaPrevista)}</strong> (ex.:
            salário do fim do mês)
          </li>
        ) : null}
        {despesaPrevista > 0 ? (
          <li>
            ainda vai sair: <strong>{formatBRL(despesaPrevista)}</strong> em
            contas com vencimento à frente
          </li>
        ) : null}
      </ul>
      <p className="mt-1">
        Na conta hoje você deve ter por volta de{" "}
        <strong>{formatBRL(saldoHoje)}</strong> — dá para comparar com o extrato
        do banco.
      </p>
    </Aviso>
  );
}

/** Linha curta "(X até hoje · Y previsto)" para pôr sob um valor. */
export function DetalheAndamento({
  realizada,
  prevista,
  emAndamento,
}: {
  realizada: number;
  prevista: number;
  emAndamento: boolean;
}) {
  if (!emAndamento || prevista <= 0) return null;
  return (
    <span className="mt-0.5 block text-xs font-normal text-texto-suave">
      {formatBRL(realizada)} até hoje · {formatBRL(prevista)} previsto
    </span>
  );
}
