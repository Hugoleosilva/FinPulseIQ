import { formatBRL, formatPct, nomeMes } from "./format";
import { ROTULO_FAIXA, resumoSemExtraordinarios } from "./calculos";
import type {
  ResumoMes,
  Oportunidade,
  NivelSaude,
  FluxoCaixa,
  ParcelaFutura,
  PontoHistorico,
} from "./calculos";

export interface DadosDiagnostico {
  key: string;
  nomeUsuario: string;
  resumo: ResumoMes;
  nivel: NivelSaude;
  fluxo: FluxoCaixa;
  oportunidades: Oportunidade[];
  parcelasFuturas: ParcelaFutura[];
  compromissoMensalFuturo: number;
  historico: PontoHistorico[];
}

const ICONE_PRIORIDADE = { alta: "🔴", media: "🟠", baixa: "🟢" } as const;

export function economiaPotencial(ops: Oportunidade[]): number {
  return ops.reduce((a, o) => a + o.potencial, 0);
}

/** Texto pronto para o usuário colar em uma IA (ChatGPT, Claude, etc.). */
export function perguntaParaIA(): string {
  return [
    "Com base no diagnóstico financeiro abaixo, quero que você:",
    "",
    "1. Analise minha situação e diga, em linguagem simples, como estão minhas contas.",
    "2. Aponte por onde eu deveria começar a cortar gastos, na ordem de prioridade.",
    "3. Para cada área, sugira ações concretas para reduzir sem comprometer o essencial.",
    "4. Proponha metas realistas para os próximos 3 meses.",
    "5. Me dê uma estratégia para lidar com os cartões e as parcelas futuras.",
    "",
    "Considere que as estimativas de redução são apenas um ponto de partida — a decisão final é minha.",
  ].join("\n");
}

export function gerarDiagnosticoMarkdown(d: DadosDiagnostico): string {
  const { resumo, nivel, fluxo, oportunidades: ops } = d;
  const L: string[] = [];
  const add = (s = "") => L.push(s);

  add(`# Diagnóstico financeiro — ${nomeMes(d.key)}`);
  add();
  add(`Gerado pelo FinPulseIQ para ${d.nomeUsuario}.`);
  add();

  add("## Resumo do mês");
  add();
  add(`- Dinheiro que entrou: ${formatBRL(resumo.receitaTotal)}`);
  add(`- Dinheiro que saiu: ${formatBRL(resumo.despesaTotal)}`);
  add(`- Sobra no fim do mês: ${formatBRL(resumo.saldo)}`);
  add(
    `- Taxa de sobra (quanto da renda sobrou): ${formatPct(resumo.taxaPoupanca, 1)}`,
  );
  if (resumo.despesaExtraordinaria > 0) {
    const semExtra = resumoSemExtraordinarios(resumo);
    add(
      `- Deste total, ${formatBRL(resumo.despesaExtraordinaria)} foram gastos extraordinários (não se repetem — ex.: antecipação de parcelas, conserto, compra grande).`,
    );
    add(
      `- Sem os extraordinários, o "ritmo normal" do mês seria: despesas ${formatBRL(semExtra.despesaTotal)}, sobra ${formatBRL(semExtra.saldo)}.`,
    );
  }
  add(
    `- Nível de saúde deste mês: ${nivel.rotulo} (${nivel.score}/100) — ${nivel.resumo}`,
  );
  add();
  add("Composição da nota:");
  for (const c of nivel.componentes) {
    add(`- ${c.rotulo}: ${c.valor} — ${c.comentario}`);
  }
  add();

  add("## Para onde vai o dinheiro");
  add();
  add("| Área | Gasto no mês | % da renda | Classificação |");
  add("| --- | ---: | ---: | --- |");
  for (const cat of resumo.porCategoria) {
    add(
      `| ${cat.categoria} | ${formatBRL(cat.total)} | ${formatPct(cat.pctRenda)} | |`,
    );
  }
  add();

  add("## Principais vazamentos (onde a torneira está pingando)");
  add();
  const comPotencial = ops.filter((o) => o.potencial > 0);
  if (comPotencial.length === 0) {
    add("Nenhum vazamento relevante identificado neste mês.");
  } else {
    add("| Prioridade | Área | Gasto | Potencial de redução | Foco |");
    add("| --- | --- | ---: | ---: | --- |");
    for (const o of comPotencial) {
      add(
        `| ${ICONE_PRIORIDADE[o.prioridade]} ${o.prioridade} | ${o.categoria} | ${formatBRL(
          o.gasto,
        )} | ${formatBRL(o.potencial)} | ${o.foco ?? "-"} |`,
      );
    }
    add();
    const [primeiro, segundo] = comPotencial;
    add(
      `Ataque primeiro: **${primeiro.categoria}** (potencial estimado de ${formatBRL(primeiro.potencial)}/mês).`,
    );
    if (segundo) {
      add(
        `Depois: **${segundo.categoria}** (potencial estimado de ${formatBRL(segundo.potencial)}/mês).`,
      );
    }
  }
  add();

  add("## Cartões e parcelas");
  add();
  add(
    `- Comprometimento da renda com cartão de crédito neste mês: ${formatPct(resumo.comprometimentoCartao)}`,
  );
  add(
    `- Valor mensal já comprometido com parcelas nos próximos meses: ${formatBRL(d.compromissoMensalFuturo)}`,
  );
  if (d.parcelasFuturas.length) {
    add();
    for (const p of d.parcelasFuturas) {
      add(
        `  - ${p.descricao}: ${formatBRL(p.valorMensal)}/mês por mais ${p.parcelasRestantes} mês(es) (${formatBRL(p.totalRestante)} no total)`,
      );
    }
  }
  add();

  add("## Fluxo de caixa e riscos");
  add();
  if (fluxo.diasNegativos.length === 0) {
    add("- O saldo se mantém positivo durante todo o mês.");
  } else {
    add(
      `- Atenção: em ${fluxo.diasNegativos.length} dia(s) o saldo projetado fica negativo (menor saldo: ${formatBRL(
        fluxo.menorSaldo,
      )} por volta do dia ${fluxo.diaMenorSaldo}).`,
    );
    add(
      "- Isso costuma indicar que contas grandes caem antes do dinheiro entrar. Vale negociar datas de vencimento.",
    );
  }
  add();

  add("## Oportunidade total");
  add();
  add(
    `Somando os vazamentos, há um potencial estimado de redução de **${formatBRL(
      economiaPotencial(ops),
    )} por mês**.`,
  );
  add(
    `Se isso se concretizasse, a sobra mensal passaria de ${formatBRL(resumo.saldo)} para cerca de ${formatBRL(
      resumo.saldo + economiaPotencial(ops),
    )}.`,
  );
  add();

  if (d.historico.length > 0) {
    add("## Acompanhamento mês a mês");
    add();
    add("| Mês | Entrou | Saiu | Sobrou | Nível |");
    add("| --- | ---: | ---: | ---: | --- |");
    for (const p of d.historico) {
      add(
        `| ${nomeMes(p.key)} | ${formatBRL(p.receita)} | ${formatBRL(p.despesa)} | ${formatBRL(
          p.saldo,
        )} | ${ROTULO_FAIXA[p.faixa]} |`,
      );
    }
    add();
  }

  add("---");
  add();
  add("## Pergunta para a IA");
  add();
  add(perguntaParaIA());
  add();

  return L.join("\n");
}
