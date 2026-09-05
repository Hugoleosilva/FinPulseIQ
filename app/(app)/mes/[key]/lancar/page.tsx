import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { exigirSessao } from "@/lib/dal";
import { getMes, listarCartoes } from "@/lib/repo";
import { keyValida, nomeMes, formatBRL, deslocaMes } from "@/lib/format";
import { andamentoMes } from "@/lib/calculos";
import { Card, Aviso } from "@/components/ui";
import { AvisoAndamento } from "@/components/AvisoAndamento";
import { WizardLancamento, type PassoWizard } from "./WizardLancamento";
import { FormSaldoInicial } from "./FormSaldoInicial";
import { FormReceita } from "./FormReceita";
import { SecaoSalario } from "./SecaoSalario";
import { FormDespesa } from "./FormDespesa";
import { CopiarMesAnterior } from "./CopiarMesAnterior";
import { ListaReceitas } from "./ListaReceitas";
import { ListaDespesas } from "./ListaDespesas";

export const metadata: Metadata = { title: "Preencher o mês — FinPulseIQ" };

export default async function PaginaLancar({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  if (!keyValida(key)) notFound();

  const { userId } = await exigirSessao();
  const [mes, cartoes, mesAnterior] = await Promise.all([
    getMes(userId, key),
    listarCartoes(userId),
    getMes(userId, deslocaMes(key, -1)),
  ]);

  const receitasFixasAnt = mesAnterior.receitas.filter(
    (r) => r.tipo === "fixa",
  ).length;
  const despesasRecorrentesAnt = mesAnterior.despesas.filter(
    (d) => d.natureza === "fixa" || d.natureza === "parcelada",
  ).length;

  const salario = mes.receitas.find((r) => r.detalhe != null);
  const outrasReceitas = mes.receitas.filter((r) => r.detalhe == null);

  const totalReceitas = mes.receitas.reduce((a, r) => a + r.valor, 0);
  const totalDespesas = mes.despesas.reduce((a, d) => a + d.valor, 0);
  const saldo = mes.saldoInicial + totalReceitas - totalDespesas;
  const andamento = andamentoMes(mes);

  const passos: PassoWizard[] = [
    {
      titulo: "Começo do mês",
      subtitulo: `Vamos organizar ${nomeMes(key)}.`,
      conteudo: (
        <FormSaldoInicial chaveMes={key} valorAtual={mes.saldoInicial} />
      ),
    },
    {
      titulo: "Dinheiro que entra",
      subtitulo:
        "Cadastre tudo o que você recebe no mês: salário, bicos, ajuda, aluguel que recebe.",
      conteudo: (
        <div className="flex flex-col gap-6">
          <CopiarMesAnterior
            chaveMes={key}
            nomeAnterior={nomeMes(deslocaMes(key, -1))}
            qtdReceitasFixas={receitasFixasAnt}
            qtdDespesasRecorrentes={despesasRecorrentesAnt}
          />
          <SecaoSalario chaveMes={key} salario={salario} />

          <div>
            <h3 className="mb-2 text-lg font-bold">Outras receitas</h3>
            <p className="mb-3 text-sm text-texto-suave">
              Aposentadoria ou pensão (sem descontos), aluguel que você recebe,
              bicos, ajuda de familiares, vendas, rendimentos.
            </p>
            <FormReceita chaveMes={key} />
          </div>

          {outrasReceitas.length > 0 ? (
            <ListaReceitas chaveMes={key} receitas={outrasReceitas} />
          ) : null}
        </div>
      ),
    },
    {
      titulo: "Dinheiro que sai",
      subtitulo:
        "Cadastre seus gastos, um por um. Quanto mais completo, melhor o diagnóstico. Comece pelos maiores.",
      conteudo: (
        <div className="flex flex-col gap-4">
          <Aviso tipo="info" titulo="Já tem tudo numa planilha?">
            Você pode{" "}
            <a
              href={`/mes/${key}/importar`}
              className="font-bold text-acento-escuro underline"
            >
              importar de um arquivo Excel ou CSV
            </a>{" "}
            em vez de digitar um por um.
          </Aviso>
          {cartoes.length === 0 ? (
            <Aviso tipo="info">
              Dica: cadastre seus cartões em <strong>Cartões e documentos</strong>{" "}
              para o sistema calcular quanto da sua renda está comprometida com
              eles.
            </Aviso>
          ) : null}
          <FormDespesa chaveMes={key} cartoes={cartoes} />
          <ListaDespesas
            chaveMes={key}
            despesas={mes.despesas}
            cartoes={cartoes}
          />
        </div>
      ),
    },
    {
      titulo: "Conferir",
      subtitulo: "Veja se os números batem com a sua realidade.",
      conteudo: (
        <div className="flex flex-col gap-4">
          <AvisoAndamento andamento={andamento} nomeMes={nomeMes(key)} />
          <Card>
            <dl className="grid gap-3 sm:grid-cols-2">
              <Linha
                rotulo="Você tinha no começo"
                valor={formatBRL(mes.saldoInicial)}
              />
              <Linha
                rotulo={
                  andamento.emAndamento ? "Entra no mês (previsto)" : "Entrou no mês"
                }
                valor={formatBRL(totalReceitas)}
              />
              <Linha
                rotulo={
                  andamento.emAndamento ? "Sai no mês (previsto)" : "Saiu no mês"
                }
                valor={formatBRL(totalDespesas)}
              />
              <Linha
                rotulo={
                  andamento.emAndamento
                    ? "Sobra prevista no fim do mês"
                    : "Sobra no fim do mês"
                }
                valor={formatBRL(saldo)}
                destaque={saldo < 0 ? "perigo" : "ok"}
              />
            </dl>
            <p className="mt-4 text-sm text-texto-suave">
              {mes.despesas.length} gasto(s) e {mes.receitas.length} receita(s)
              cadastrados. Quando terminar, clique em “Concluir” para ver seu
              diagnóstico.
            </p>
          </Card>
        </div>
      ),
    },
  ];

  return <WizardLancamento passos={passos} chaveMes={key} />;
}

function Linha({
  rotulo,
  valor,
  destaque,
}: {
  rotulo: string;
  valor: string;
  destaque?: "ok" | "perigo";
}) {
  return (
    <div className="rounded-xl border border-borda bg-fundo p-3">
      <dt className="text-sm text-texto-suave">{rotulo}</dt>
      <dd
        className={`tabular text-xl font-extrabold ${
          destaque === "perigo"
            ? "text-perigo"
            : destaque === "ok"
              ? "text-ok"
              : "text-texto"
        }`}
      >
        {valor}
      </dd>
    </div>
  );
}
