import Link from "next/link";
import {
  getMes,
  listarMeses,
  listarCompromissos,
  compromissoMensal,
} from "@/lib/repo";
import {
  resumoMes,
  fluxoCaixa,
  oportunidades,
  nivelSaude,
  economiaPotencialTotal,
  resumoSemExtraordinarios,
} from "@/lib/calculos";
import { ROTULO_FAIXA } from "@/lib/calculos";
import { nomeMes, formatBRL } from "@/lib/format";
import { Card, Aviso, BotaoLink, ValorGrande, TituloSecao } from "@/components/ui";
import { SeloNivel } from "@/components/SeloNivel";
import { BarraCategorias } from "@/components/BarraCategorias";
import { GraficoFluxo } from "@/components/graficos";
import { NavegadorMes } from "@/components/NavegadorMes";

export interface VistaMesProps {
  userId: string;
  chaveMes: string;
  somenteLeitura?: boolean;
  nomeArea?: string;
  navBase: string;
  navSufixo?: string;
  hrefDiagnostico: string;
  hrefLancar?: string;
  hrefHistorico: string;
}

export async function VistaMes(props: VistaMesProps) {
  const { userId, chaveMes: key, somenteLeitura } = props;

  const [mes, todosMeses, compromissos] = await Promise.all([
    getMes(userId, key),
    listarMeses(userId),
    listarCompromissos(userId),
  ]);

  const vazio = mes.receitas.length === 0 && mes.despesas.length === 0;
  const anteriores = todosMeses.filter((m) => m.key < key);
  const compFuturo = compromissoMensal(compromissos);

  const resumo = resumoMes(mes);
  const fluxo = fluxoCaixa(mes);
  const ops = oportunidades(mes, anteriores);
  const nivel = nivelSaude({
    resumo,
    fluxo,
    compromissoMensalFuturo: compFuturo,
  });
  const nivelNormal =
    resumo.despesaExtraordinaria > 0
      ? nivelSaude({
          resumo: resumoSemExtraordinarios(resumo),
          fluxo,
          compromissoMensalFuturo: compFuturo,
        })
      : null;

  const topCategorias = resumo.porCategoria.slice(0, 8);
  const maxCategoria = topCategorias[0]?.total ?? 0;
  const topVazamentos = ops.filter((o) => o.potencial > 0).slice(0, 3);

  return (
    <div className="flex flex-col gap-6">
      {somenteLeitura && props.nomeArea ? (
        <Aviso tipo="info" titulo={`Você está vendo a área de ${props.nomeArea}`}>
          Modo somente leitura — para acompanhamento e análise. Você não pode
          alterar estes lançamentos.
        </Aviso>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <NavegadorMes
          chaveMes={key}
          base={props.navBase}
          sufixo={props.navSufixo ?? ""}
        />
        {!somenteLeitura && props.hrefLancar ? (
          <BotaoLink href={props.hrefLancar} variante="secundario">
            {vazio ? "Começar a preencher" : "Adicionar / editar lançamentos"}
          </BotaoLink>
        ) : null}
      </div>

      {vazio ? (
        <Card>
          <TituloSecao
            ajuda={
              somenteLeitura
                ? undefined
                : `Vamos organizar ${nomeMes(key)} em 4 passos rápidos.`
            }
          >
            {somenteLeitura
              ? "Sem lançamentos neste mês"
              : "Este mês ainda está vazio"}
          </TituloSecao>
          {!somenteLeitura && props.hrefLancar ? (
            <>
              <p className="mb-4 text-texto-suave">
                Primeiro você diz o que <strong>entra</strong>. Depois cadastra o
                que <strong>sai</strong>. O FinPulseIQ cuida do resto.
              </p>
              <div className="flex flex-wrap gap-3">
                <BotaoLink href={props.hrefLancar}>Preencher agora</BotaoLink>
                <BotaoLink
                  href={`/mes/${key}/importar`}
                  variante="secundario"
                >
                  Importar de uma planilha
                </BotaoLink>
              </div>
            </>
          ) : (
            <p className="text-texto-suave">
              {props.nomeArea} ainda não preencheu este mês.
            </p>
          )}
        </Card>
      ) : (
        <>
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-texto-suave">
                  Pulso financeiro de {nomeMes(key)}
                </p>
                <div className="mt-1">
                  <SeloNivel
                    faixa={nivel.faixa}
                    rotulo={nivel.rotulo}
                    score={nivel.score}
                    tamanho="lg"
                  />
                </div>
              </div>
              <p className="max-w-xs text-sm text-texto-suave">{nivel.resumo}</p>
            </div>

            <dl className="mt-5 grid gap-4 sm:grid-cols-4">
              <ValorGrande
                rotulo="Tinha no início"
                valor={formatBRL(resumo.saldoInicial)}
              />
              <ValorGrande
                rotulo="Entrou no mês"
                valor={formatBRL(resumo.receitaTotal)}
                cor="ok"
              />
              <ValorGrande
                rotulo="Saiu no mês"
                valor={formatBRL(resumo.despesaTotal)}
                cor="alerta"
              />
              <ValorGrande
                rotulo="Sobra no fim do mês"
                valor={formatBRL(resumo.saldo)}
                cor={resumo.saldo < 0 ? "perigo" : "ok"}
              />
            </dl>
          </Card>

          {nivelNormal && (
            <Aviso
              tipo="info"
              titulo={`Este mês teve ${formatBRL(resumo.despesaExtraordinaria)} em gastos que não se repetem`}
            >
              Isso derruba o resultado do mês, mas não é o seu ritmo normal —
              muitas vezes é até um bom movimento (como antecipar parcelas).
              Sem esses gastos, a sobra teria sido{" "}
              <strong>
                {formatBRL(resumoSemExtraordinarios(resumo).saldo)}
              </strong>{" "}
              e o nível ficaria em{" "}
              <strong>{ROTULO_FAIXA[nivelNormal.faixa]}</strong> (
              {nivelNormal.score}/100).
            </Aviso>
          )}

          {fluxo.diasNegativos.length > 0 && (
            <Aviso tipo="alerta" titulo="Risco de ficar no vermelho durante o mês">
              Em {fluxo.diasNegativos.length} dia(s) o saldo previsto fica
              negativo — o menor ponto é {formatBRL(fluxo.menorSaldo)} por volta
              do dia {fluxo.diaMenorSaldo}.
            </Aviso>
          )}

          <Card>
            <TituloSecao ajuda="Ordenado do maior para o menor. É aqui que mora o dinheiro.">
              Para onde vai o dinheiro
            </TituloSecao>
            <BarraCategorias categorias={topCategorias} maximo={maxCategoria} />
          </Card>

          <Card>
            <TituloSecao ajuda="O sistema estima onde há mais espaço para cortar sem apertar o essencial.">
              Onde a torneira está pingando
            </TituloSecao>
            {topVazamentos.length === 0 ? (
              <p className="text-texto-suave">
                Nenhum vazamento relevante encontrado neste mês. 👏
              </p>
            ) : (
              <>
                <ul className="flex flex-col gap-2">
                  {topVazamentos.map((o) => (
                    <li
                      key={o.categoria}
                      className="flex items-center justify-between gap-3 rounded-xl border border-borda p-3"
                    >
                      <span>
                        <span className="font-semibold">
                          {o.emoji} {o.categoria}
                        </span>
                        {o.foco ? (
                          <span className="block text-sm text-texto-suave">
                            {o.foco}
                          </span>
                        ) : null}
                      </span>
                      <span className="text-right">
                        <span className="block text-xs text-texto-suave">
                          dá para economizar até
                        </span>
                        <span className="tabular font-extrabold text-acento-escuro">
                          {formatBRL(o.potencial)}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-sm text-texto-suave">
                  Potencial total estimado:{" "}
                  <strong>{formatBRL(economiaPotencialTotal(ops))}/mês</strong>.
                </p>
                <div className="mt-4">
                  <BotaoLink href={props.hrefDiagnostico}>
                    Ver diagnóstico completo{somenteLeitura ? "" : " e simular"}
                  </BotaoLink>
                </div>
              </>
            )}
          </Card>

          <Card>
            <TituloSecao ajuda="Como o saldo caminha ao longo do mês, considerando os dias de cada entrada e saída.">
              Saldo durante o mês
            </TituloSecao>
            <GraficoFluxo dias={fluxo.dias} />
          </Card>

          <p className="text-center text-sm text-texto-suave">
            <Link href={props.hrefHistorico} className="font-semibold underline">
              Ver a evolução mês a mês
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
