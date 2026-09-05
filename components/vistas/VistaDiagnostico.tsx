import { montarDiagnostico } from "@/lib/diagnostico";
import {
  nivelSaude,
  resumoSemExtraordinarios,
  ROTULO_FAIXA,
} from "@/lib/calculos";
import { gerarDiagnosticoMarkdown, economiaPotencial } from "@/lib/exportar";
import { nomeMes, slugMes, formatBRL, formatPct } from "@/lib/format";
import { Card, TituloSecao, Aviso, BotaoLink } from "@/components/ui";
import { SeloNivel } from "@/components/SeloNivel";
import { TabelaOportunidades } from "@/components/TabelaOportunidades";
import { Simulador } from "@/components/Simulador";
import { ExportarDiagnostico } from "@/components/ExportarDiagnostico";
import { NavegadorMes } from "@/components/NavegadorMes";

export interface VistaDiagnosticoProps {
  userId: string;
  nome: string;
  chaveMes: string;
  somenteLeitura?: boolean;
  nomeArea?: string;
  navBase: string;
  navSufixo: string;
  hrefMes: string;
  hrefLancar?: string;
}

export async function VistaDiagnostico(props: VistaDiagnosticoProps) {
  const { userId, nome, chaveMes: key, somenteLeitura } = props;
  const dados = await montarDiagnostico(userId, nome, key);
  const { resumo, nivel, fluxo, oportunidades: ops } = dados;

  const semDados = resumo.receitaTotal === 0 && resumo.despesaTotal === 0;
  const nivelNormal =
    resumo.despesaExtraordinaria > 0
      ? nivelSaude({
          resumo: resumoSemExtraordinarios(resumo),
          fluxo,
          compromissoMensalFuturo: dados.compromissoMensalFuturo,
        })
      : null;
  const markdown = gerarDiagnosticoMarkdown(dados);
  const opsSimples = ops.map((o) => ({
    categoria: o.categoria,
    emoji: o.emoji,
    potencial: o.potencial,
    prioridade: o.prioridade,
    foco: o.foco,
  }));

  return (
    <div className="flex flex-col gap-6">
      {somenteLeitura && props.nomeArea ? (
        <Aviso tipo="info" titulo={`Diagnóstico de ${props.nomeArea}`}>
          Modo somente leitura, para acompanhamento. Você pode baixar este
          diagnóstico para analisar.
        </Aviso>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <NavegadorMes chaveMes={key} base={props.navBase} sufixo={props.navSufixo} />
        <BotaoLink href={props.hrefMes} variante="secundario">
          Voltar ao mês
        </BotaoLink>
      </div>

      <h1 className="text-2xl font-extrabold">Diagnóstico de {nomeMes(key)}</h1>

      {semDados ? (
        <Card>
          <p className="text-texto-suave">
            Ainda não há lançamentos neste mês.
            {!somenteLeitura && props.hrefLancar ? (
              <>
                {" "}
                <a
                  href={props.hrefLancar}
                  className="font-semibold text-acento-escuro underline"
                >
                  Preencha o mês
                </a>{" "}
                para ver o diagnóstico.
              </>
            ) : null}
          </p>
        </Card>
      ) : (
        <>
          <Card>
            <TituloSecao>1. Como estão as contas</TituloSecao>
            <div className="flex flex-wrap items-center gap-4">
              <SeloNivel
                faixa={nivel.faixa}
                rotulo={nivel.rotulo}
                score={nivel.score}
                tamanho="lg"
              />
              <p className="text-texto-suave">{nivel.resumo}</p>
            </div>
            {nivelNormal ? (
              <div className="mt-3">
                <Aviso tipo="info">
                  Este mês teve{" "}
                  <strong>{formatBRL(resumo.despesaExtraordinaria)}</strong> em
                  gastos extraordinários (não se repetem). Tirando eles, a sobra
                  seria{" "}
                  <strong>
                    {formatBRL(resumoSemExtraordinarios(resumo).saldo)}
                  </strong>{" "}
                  e o nível ficaria{" "}
                  <strong>{ROTULO_FAIXA[nivelNormal.faixa]}</strong> (
                  {nivelNormal.score}/100).
                </Aviso>
              </div>
            ) : null}
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {nivel.componentes.map((c) => (
                <li key={c.rotulo} className="rounded-xl border border-borda p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{c.rotulo}</span>
                    <span className="tabular font-bold">{c.valor}</span>
                  </div>
                  <p className="mt-1 text-sm text-texto-suave">{c.comentario}</p>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <TituloSecao ajuda="Da maior para a menor oportunidade. O sistema nunca sugere cortar o que foi marcado como essencial.">
              2. Onde atacar primeiro
            </TituloSecao>
            <TabelaOportunidades ops={ops} />
            {ops.some((o) => o.potencial > 0) ? (
              <p className="mt-4 rounded-xl bg-fundo p-3 text-sm">
                Somando tudo, há um potencial estimado de{" "}
                <strong>{formatBRL(economiaPotencial(ops))} por mês</strong> — é
                onde existe mais espaço para respirar, não uma ordem de corte.
              </p>
            ) : null}
          </Card>

          <Card>
            <TituloSecao>3. Simule o resultado</TituloSecao>
            <Simulador
              ops={opsSimples}
              saldoAntes={resumo.saldo}
              despesaAntes={resumo.despesaTotal}
            />
          </Card>

          <Card>
            <TituloSecao ajuda="Quanto da renda já está prometido, e o que continua pesando nos próximos meses.">
              4. Dívidas: cartão, empréstimos e parcelas
            </TituloSecao>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-borda p-3">
                <p className="text-sm text-texto-suave">
                  Cartão de crédito neste mês
                </p>
                <p className="tabular text-2xl font-extrabold">
                  {formatPct(resumo.comprometimentoCartao)}
                </p>
                <p className="text-sm text-texto-suave">
                  {formatBRL(resumo.gastoCartao)} da renda
                </p>
              </div>
              <div className="rounded-xl border border-borda p-3">
                <p className="text-sm text-texto-suave">
                  Empréstimos e financiamentos
                </p>
                <p className="tabular text-2xl font-extrabold">
                  {formatPct(resumo.comprometimentoEmprestimo)}
                </p>
                <p className="text-sm text-texto-suave">
                  {formatBRL(resumo.gastoEmprestimo)} da renda
                </p>
              </div>
              <div className="rounded-xl border border-borda p-3">
                <p className="text-sm text-texto-suave">
                  Já comprometido nos próximos meses
                </p>
                <p className="tabular text-2xl font-extrabold">
                  {formatBRL(dados.compromissoFuturo.mensal)}
                  <span className="text-base font-semibold">/mês</span>
                </p>
                <p className="text-sm text-texto-suave">
                  {formatBRL(dados.compromissoFuturo.cartao)} cartão ·{" "}
                  {formatBRL(dados.compromissoFuturo.emprestimo)} empréstimo
                </p>
              </div>
            </div>
            {dados.parcelasFuturas.length > 0 && (
              <ul className="mt-3 space-y-1 text-sm text-texto-suave">
                {dados.parcelasFuturas.map((p) => (
                  <li key={p.descricao}>
                    • {p.descricao}: {formatBRL(p.valorMensal)}/mês por mais{" "}
                    {p.parcelasRestantes} mês(es) ({formatBRL(p.totalRestante)}{" "}
                    no total)
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {fluxo.diasNegativos.length > 0 && (
            <Aviso tipo="alerta" titulo="Risco de caixa">
              Em {fluxo.diasNegativos.length} dia(s) do mês o saldo previsto fica
              negativo (menor ponto: {formatBRL(fluxo.menorSaldo)} perto do dia{" "}
              {fluxo.diaMenorSaldo}).
            </Aviso>
          )}

          <Card>
            <TituloSecao ajuda="O sistema faz a conta. A IA ajuda a montar o plano.">
              5. Leve para uma IA montar o plano de ação
            </TituloSecao>
            <ExportarDiagnostico
              markdown={markdown}
              nomeArquivo={`diagnostico-financeiro-${slugMes(key)}.md`}
            />
          </Card>

          <details className="rounded-2xl border border-borda p-4 text-sm">
            <summary className="cursor-pointer font-bold">
              Como o FinPulseIQ calcula o “onde atacar”?
            </summary>
            <div className="mt-3 space-y-2 text-texto-suave">
              <p>
                Para cada área olhamos: quanto se gasta, que fatia da renda isso
                representa, se está crescendo em relação aos meses anteriores e,
                principalmente, como cada gasto foi classificado (essencial, dá
                para reduzir, ou dá para viver sem).
              </p>
              <p>
                Gastos essenciais nunca entram na conta de redução. Cada área tem
                um limite realista de corte (dá para mexer bem mais em
                assinaturas do que em moradia).
              </p>
              <p>
                O resultado é uma <strong>estimativa</strong> e uma ordem de
                prioridade. A decisão é sempre de quem gasta.
              </p>
            </div>
          </details>
        </>
      )}
    </div>
  );
}
