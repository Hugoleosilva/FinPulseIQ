import type { Mes, Despesa, Essencialidade } from "./tipos";
import {
  getCategoria,
  emojiCategoria,
  PESO_ESSENCIALIDADE,
  CATEGORIA_FATURA_CARTAO,
  CATEGORIA_EMPRESTIMOS,
} from "./categorias";

/** Uma despesa "conta como cartão de crédito"? */
function ehGastoCartao(d: Despesa): boolean {
  return (
    d.meioPagamento === "cartao" || d.categoria === CATEGORIA_FATURA_CARTAO
  );
}

/** Uma despesa é empréstimo / financiamento / consórcio? */
function ehGastoEmprestimo(d: Despesa): boolean {
  return d.categoria === CATEGORIA_EMPRESTIMOS;
}

export type TipoDivida = "cartao" | "emprestimo" | "outra";

export function classificarDivida(categoria: string, meio?: string): TipoDivida {
  if (categoria === CATEGORIA_EMPRESTIMOS) return "emprestimo";
  if (categoria === CATEGORIA_FATURA_CARTAO || meio === "cartao") return "cartao";
  return "outra";
}

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

const soma = (ns: number[]) => ns.reduce((a, b) => a + b, 0);

const arred = (n: number) => Math.round(n);

// ---------------------------------------------------------------------------
// Resumo do mês
// ---------------------------------------------------------------------------

export interface LinhaSubcategoria {
  nome: string;
  total: number;
}

export interface LinhaCategoria {
  categoria: string;
  emoji: string;
  total: number;
  pctDespesas: number;
  pctRenda: number;
  subcategorias: LinhaSubcategoria[];
  /** Total gasto "fora de casa" quando a categoria tem esse conceito (Alimentação). */
  foraDeCasa: number | null;
}

export interface ResumoMes {
  saldoInicial: number;
  receitaTotal: number;
  despesaTotal: number;
  saldo: number;
  taxaPoupanca: number;
  gastoCartao: number;
  comprometimentoCartao: number;
  gastoEmprestimo: number;
  comprometimentoEmprestimo: number;
  despesasEssenciais: number;
  despesasReduziveis: number;
  despesasDesnecessarias: number;
  /** Gastos grandes que não fazem parte do mês normal (ex.: antecipar parcelas). */
  despesaExtraordinaria: number;
  /** Parte dos extraordinários que caiu no cartão de crédito. */
  despesaExtraordinariaCartao: number;
  /** Parte dos extraordinários que era empréstimo/financiamento. */
  despesaExtraordinariaEmprestimo: number;
  porCategoria: LinhaCategoria[];
}

function totalPorSubcategoria(despesas: Despesa[]): LinhaSubcategoria[] {
  const mapa = new Map<string, number>();
  for (const d of despesas) {
    mapa.set(d.subcategoria, (mapa.get(d.subcategoria) ?? 0) + d.valor);
  }
  return [...mapa.entries()]
    .map(([nome, total]) => ({ nome, total }))
    .sort((a, b) => b.total - a.total);
}

export function resumoMes(mes: Mes): ResumoMes {
  const receitaTotal = soma(mes.receitas.map((r) => r.valor));
  const despesaTotal = soma(mes.despesas.map((d) => d.valor));
  const saldo = mes.saldoInicial + receitaTotal - despesaTotal;

  const gastoCartao = soma(
    mes.despesas.filter(ehGastoCartao).map((d) => d.valor),
  );
  const gastoEmprestimo = soma(
    mes.despesas.filter(ehGastoEmprestimo).map((d) => d.valor),
  );

  const porEssencialidade = (e: Essencialidade) =>
    soma(mes.despesas.filter((d) => d.essencialidade === e).map((d) => d.valor));

  const grupos = new Map<string, Despesa[]>();
  for (const d of mes.despesas) {
    const arr = grupos.get(d.categoria) ?? [];
    arr.push(d);
    grupos.set(d.categoria, arr);
  }

  const porCategoria: LinhaCategoria[] = [...grupos.entries()]
    .map(([categoria, despesas]) => {
      const total = soma(despesas.map((d) => d.valor));
      const def = getCategoria(categoria);
      const foraLista = def?.subcategoriasForaDeCasa;
      const foraDeCasa = foraLista
        ? soma(
            despesas
              .filter((d) => foraLista.includes(d.subcategoria))
              .map((d) => d.valor),
          )
        : null;
      return {
        categoria,
        emoji: emojiCategoria(categoria),
        total,
        pctDespesas: despesaTotal > 0 ? total / despesaTotal : 0,
        pctRenda: receitaTotal > 0 ? total / receitaTotal : 0,
        subcategorias: totalPorSubcategoria(despesas),
        foraDeCasa,
      };
    })
    .sort((a, b) => b.total - a.total);

  return {
    saldoInicial: mes.saldoInicial,
    receitaTotal,
    despesaTotal,
    saldo,
    taxaPoupanca: receitaTotal > 0 ? saldo / receitaTotal : 0,
    gastoCartao,
    comprometimentoCartao: receitaTotal > 0 ? gastoCartao / receitaTotal : 0,
    gastoEmprestimo,
    comprometimentoEmprestimo:
      receitaTotal > 0 ? gastoEmprestimo / receitaTotal : 0,
    despesasEssenciais: porEssencialidade("essencial"),
    despesasReduziveis: porEssencialidade("reduzivel"),
    despesasDesnecessarias: porEssencialidade("desnecessario"),
    despesaExtraordinaria: soma(
      mes.despesas
        .filter((d) => d.natureza === "extraordinaria")
        .map((d) => d.valor),
    ),
    despesaExtraordinariaCartao: soma(
      mes.despesas
        .filter((d) => d.natureza === "extraordinaria" && ehGastoCartao(d))
        .map((d) => d.valor),
    ),
    despesaExtraordinariaEmprestimo: soma(
      mes.despesas
        .filter((d) => d.natureza === "extraordinaria" && ehGastoEmprestimo(d))
        .map((d) => d.valor),
    ),
    porCategoria,
  };
}

/**
 * Como o mês teria ficado sem os gastos extraordinários — o "ritmo normal".
 * Ajusta só o necessário para recalcular o nível de saúde.
 */
export function resumoSemExtraordinarios(r: ResumoMes): ResumoMes {
  if (r.despesaExtraordinaria <= 0) return r;
  const despesaTotal = r.despesaTotal - r.despesaExtraordinaria;
  const saldo = r.saldoInicial + r.receitaTotal - despesaTotal;
  const gastoCartao = Math.max(0, r.gastoCartao - r.despesaExtraordinariaCartao);
  const gastoEmprestimo = Math.max(
    0,
    r.gastoEmprestimo - r.despesaExtraordinariaEmprestimo,
  );
  return {
    ...r,
    despesaTotal,
    saldo,
    taxaPoupanca: r.receitaTotal > 0 ? saldo / r.receitaTotal : 0,
    gastoCartao,
    comprometimentoCartao: r.receitaTotal > 0 ? gastoCartao / r.receitaTotal : 0,
    gastoEmprestimo,
    comprometimentoEmprestimo:
      r.receitaTotal > 0 ? gastoEmprestimo / r.receitaTotal : 0,
    despesaExtraordinaria: 0,
    despesaExtraordinariaCartao: 0,
    despesaExtraordinariaEmprestimo: 0,
  };
}

// ---------------------------------------------------------------------------
// Andamento do mês (o que já aconteceu × o que ainda é previsão)
// ---------------------------------------------------------------------------

export interface AndamentoMes {
  /** true quando o mês analisado é o mês corrente. */
  emAndamento: boolean;
  /** dia de referência (hoje, se em andamento). */
  diaDeHoje: number;
  receitaRealizada: number;
  receitaPrevista: number;
  despesaRealizada: number;
  despesaPrevista: number;
  /** saldoInicial + o que já entrou − o que já saiu (estimativa do saldo de hoje). */
  saldoHoje: number;
}

export function andamentoMes(mes: Mes, hoje: Date = new Date()): AndamentoMes {
  const mesKey = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
  const emAndamento = mes.key === mesKey;
  const dia = emAndamento ? hoje.getDate() : mes.key < mesKey ? 31 : 0;

  const ate = (arr: { dia: number; valor: number }[]) =>
    soma(arr.filter((x) => x.dia <= dia).map((x) => x.valor));
  const depois = (arr: { dia: number; valor: number }[]) =>
    soma(arr.filter((x) => x.dia > dia).map((x) => x.valor));

  const receitaRealizada = ate(mes.receitas);
  const despesaRealizada = ate(mes.despesas);

  return {
    emAndamento,
    diaDeHoje: dia,
    receitaRealizada,
    receitaPrevista: depois(mes.receitas),
    despesaRealizada,
    despesaPrevista: depois(mes.despesas),
    saldoHoje:
      Math.round((mes.saldoInicial + receitaRealizada - despesaRealizada) * 100) /
      100,
  };
}

// ---------------------------------------------------------------------------
// Fluxo de caixa dia a dia
// ---------------------------------------------------------------------------

export interface DiaFluxo {
  dia: number;
  entrada: number;
  saida: number;
  saldoAcumulado: number;
}

export interface FluxoCaixa {
  dias: DiaFluxo[];
  diasNegativos: number[];
  menorSaldo: number;
  diaMenorSaldo: number;
}

export function fluxoCaixa(mes: Mes): FluxoCaixa {
  const dias: DiaFluxo[] = [];
  let acumulado = mes.saldoInicial;
  let menorSaldo = acumulado;
  let diaMenorSaldo = 0;
  const diasNegativos: number[] = [];

  for (let dia = 1; dia <= 31; dia++) {
    const entrada = soma(
      mes.receitas.filter((r) => r.dia === dia).map((r) => r.valor),
    );
    const saida = soma(
      mes.despesas.filter((d) => d.dia === dia).map((d) => d.valor),
    );
    acumulado += entrada - saida;
    dias.push({ dia, entrada, saida, saldoAcumulado: arred(acumulado * 100) / 100 });
    if (acumulado < 0) diasNegativos.push(dia);
    if (acumulado < menorSaldo) {
      menorSaldo = acumulado;
      diaMenorSaldo = dia;
    }
  }

  return {
    dias,
    diasNegativos,
    menorSaldo: arred(menorSaldo * 100) / 100,
    diaMenorSaldo,
  };
}

// ---------------------------------------------------------------------------
// Vazamentos + índice de oportunidade de redução
// ---------------------------------------------------------------------------

export type Prioridade = "alta" | "media" | "baixa";

export interface Oportunidade {
  categoria: string;
  emoji: string;
  gasto: number;
  pctRenda: number;
  pctDespesas: number;
  /** Crescimento sobre a média dos meses anteriores (0 se não há histórico). */
  crescimento: number;
  /** 0 (tudo essencial) a ~0.9 (tudo dispensável). */
  necessidade: number;
  /** Fração final estimada como redutível. */
  fator: number;
  potencial: number;
  prioridade: Prioridade;
  /** Descrição curta de onde está o vazamento dentro da categoria. */
  foco: string | null;
}

function necessidadeCategoria(despesas: Despesa[]): number {
  const total = soma(despesas.map((d) => d.valor));
  if (total === 0) return 0;
  const ponderado = soma(
    despesas.map((d) => d.valor * PESO_ESSENCIALIDADE[d.essencialidade]),
  );
  return ponderado / total;
}

function mediaHistoricaCategoria(historico: Mes[], categoria: string): number {
  const valores = historico
    .map((m) =>
      soma(
        m.despesas.filter((d) => d.categoria === categoria).map((d) => d.valor),
      ),
    )
    .filter((v) => v > 0);
  if (valores.length === 0) return 0;
  return soma(valores) / valores.length;
}

function focoDoVazamento(categoria: string, despesas: Despesa[]): string | null {
  const def = getCategoria(categoria);
  if (def?.subcategoriasForaDeCasa) {
    const fora = soma(
      despesas
        .filter((d) => def.subcategoriasForaDeCasa!.includes(d.subcategoria))
        .map((d) => d.valor),
    );
    if (fora > 0) return `Consumo fora de casa: ${moeda(fora)}`;
  }
  const dispensavel = soma(
    despesas
      .filter((d) => d.essencialidade === "desnecessario")
      .map((d) => d.valor),
  );
  if (dispensavel > 0) return `Marcado como dispensável: ${moeda(dispensavel)}`;
  const reduzivel = soma(
    despesas.filter((d) => d.essencialidade === "reduzivel").map((d) => d.valor),
  );
  if (reduzivel > 0) return `Marcado como redutível: ${moeda(reduzivel)}`;
  return null;
}

function moeda(v: number): string {
  return v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

function classificaPrioridade(potencial: number, receita: number): Prioridade {
  if (potencial >= 0.04 * receita || potencial >= 200) return "alta";
  if (potencial >= 0.015 * receita || potencial >= 75) return "media";
  return "baixa";
}

export function oportunidades(mes: Mes, historico: Mes[] = []): Oportunidade[] {
  const receita = soma(mes.receitas.map((r) => r.valor));
  // Gastos extraordinários não entram: são pontuais, não há o que "reduzir"
  // nos próximos meses.
  const relevantes = mes.despesas.filter(
    (d) => d.natureza !== "extraordinaria",
  );
  const despesaTotal = soma(relevantes.map((d) => d.valor));

  const grupos = new Map<string, Despesa[]>();
  for (const d of relevantes) {
    const arr = grupos.get(d.categoria) ?? [];
    arr.push(d);
    grupos.set(d.categoria, arr);
  }

  const lista: Oportunidade[] = [];
  for (const [categoria, despesas] of grupos) {
    const gasto = soma(despesas.map((d) => d.valor));
    if (gasto <= 0) continue;
    const def = getCategoria(categoria);
    const teto = def?.tetoReducao ?? 0.3;

    const necessidade = necessidadeCategoria(despesas);
    const pctDespesas = despesaTotal > 0 ? gasto / despesaTotal : 0;
    const pctRenda = receita > 0 ? gasto / receita : 0;

    const media = mediaHistoricaCategoria(historico, categoria);
    const crescimento =
      media > 0 ? Math.max(0, (gasto - media) / media) : 0;

    // Multiplicador: base 0,6 + peso do crescimento + peso do tamanho na despesa.
    const mult =
      0.6 +
      0.2 * Math.min(crescimento, 1) +
      0.2 * Math.min(pctDespesas * 3, 1);

    const fator = clamp(necessidade * mult, 0, teto);
    const potencial = arred(gasto * fator);

    lista.push({
      categoria,
      emoji: emojiCategoria(categoria),
      gasto: arred(gasto),
      pctRenda,
      pctDespesas,
      crescimento,
      necessidade,
      fator,
      potencial,
      prioridade: classificaPrioridade(potencial, receita),
      foco: focoDoVazamento(categoria, despesas),
    });
  }

  return lista.sort((a, b) => b.potencial - a.potencial);
}

export function economiaPotencialTotal(ops: Oportunidade[]): number {
  return soma(ops.map((o) => o.potencial));
}

// ---------------------------------------------------------------------------
// Simulação "e se eu agir nos vazamentos?"
// ---------------------------------------------------------------------------

export interface Simulacao {
  categorias: string[];
  despesaAntes: number;
  despesaDepois: number;
  saldoAntes: number;
  saldoDepois: number;
  economia: number;
}

export function simular(
  mes: Mes,
  ops: Oportunidade[],
  categoriasSelecionadas: string[],
): Simulacao {
  const receita = soma(mes.receitas.map((r) => r.valor));
  const despesaAntes = soma(mes.despesas.map((d) => d.valor));
  const saldoAntes = mes.saldoInicial + receita - despesaAntes;

  const economia = soma(
    ops
      .filter((o) => categoriasSelecionadas.includes(o.categoria))
      .map((o) => o.potencial),
  );

  return {
    categorias: categoriasSelecionadas,
    despesaAntes: arred(despesaAntes),
    despesaDepois: arred(despesaAntes - economia),
    saldoAntes: arred(saldoAntes),
    saldoDepois: arred(saldoAntes + economia),
    economia: arred(economia),
  };
}

// ---------------------------------------------------------------------------
// Nível de saúde do mês
// ---------------------------------------------------------------------------

export type Faixa = "otimo" | "bom" | "normal" | "ruim" | "critico";

export interface ComponenteNivel {
  rotulo: string;
  valor: string;
  nota: number; // 0 a 1
  comentario: string;
}

export interface NivelSaude {
  score: number; // 0 a 100
  faixa: Faixa;
  rotulo: string;
  resumo: string;
  componentes: ComponenteNivel[];
}

export const ROTULO_FAIXA: Record<Faixa, string> = {
  otimo: "Ótimo",
  bom: "Bom",
  normal: "Normal",
  ruim: "Ruim",
  critico: "Crítico",
};

function faixaDoScore(score: number): Faixa {
  if (score >= 80) return "otimo";
  if (score >= 65) return "bom";
  if (score >= 50) return "normal";
  if (score >= 35) return "ruim";
  return "critico";
}

const faixaLinear = (x: number, bom: number, ruim: number) =>
  clamp((x - ruim) / (bom - ruim), 0, 1);

export interface EntradaNivel {
  resumo: ResumoMes;
  fluxo: FluxoCaixa;
  /** Soma das parcelas mensais que continuam nos próximos meses. */
  compromissoMensalFuturo: number;
}

export function nivelSaude({
  resumo,
  fluxo,
  compromissoMensalFuturo,
}: EntradaNivel): NivelSaude {
  const receita = resumo.receitaTotal || 1;

  const notaPoupanca = clamp(resumo.taxaPoupanca / 0.25, 0, 1);
  const notaCartao = faixaLinear(resumo.comprometimentoCartao, 0.15, 0.5);
  const notaEmprestimo = faixaLinear(
    resumo.comprometimentoEmprestimo,
    0.1,
    0.4,
  );
  const notaParcelas = faixaLinear(compromissoMensalFuturo / receita, 0.1, 0.6);
  const notaEssenciais = faixaLinear(
    resumo.despesasEssenciais / receita,
    0.5,
    0.95,
  );
  const notaRisco = clamp(1 - fluxo.diasNegativos.length / 5, 0, 1);

  const componentes: ComponenteNivel[] = [
    {
      rotulo: "Sobra no fim do mês",
      valor: pct(resumo.taxaPoupanca),
      nota: notaPoupanca,
      comentario:
        resumo.taxaPoupanca <= 0
          ? "Você não está conseguindo guardar nada."
          : resumo.taxaPoupanca < 0.1
            ? "Sobra pouco: menos de 10% do que entra."
            : "Boa folga entre o que entra e o que sai.",
    },
    {
      rotulo: "Comprometido com cartão",
      valor: pct(resumo.comprometimentoCartao),
      nota: notaCartao,
      comentario:
        resumo.gastoCartao <= 0
          ? "Sem gasto no cartão de crédito neste mês."
          : resumo.comprometimentoCartao >= 1
            ? "A fatura do cartão passou da sua renda do mês."
            : resumo.comprometimentoCartao > 0.6
              ? "Fatia altíssima da renda vai para o cartão."
              : resumo.comprometimentoCartao > 0.35
                ? "Fatia alta da renda vai para o cartão."
                : "Uso do cartão sob controle.",
    },
    {
      rotulo: "Comprometido com empréstimos e financiamentos",
      valor: pct(resumo.comprometimentoEmprestimo),
      nota: notaEmprestimo,
      comentario:
        resumo.gastoEmprestimo <= 0
          ? "Sem parcela de empréstimo ou financiamento neste mês."
          : resumo.comprometimentoEmprestimo > 0.3
            ? "Fatia alta da renda vai para dívidas com juros."
            : "Parcelas de dívidas sob controle.",
    },
    {
      rotulo: "Parcelas para os próximos meses",
      valor: pct(compromissoMensalFuturo / receita),
      nota: notaParcelas,
      comentario:
        compromissoMensalFuturo / receita > 0.4
          ? "Boa parte dos próximos meses já está comprometida com parcelas."
          : compromissoMensalFuturo > 0
            ? "Há parcelas comprometendo os próximos meses."
            : "Nada parcelado para frente.",
    },
    {
      rotulo: "Gastos essenciais",
      valor: pct(resumo.despesasEssenciais / receita),
      nota: notaEssenciais,
      comentario:
        resumo.despesasEssenciais / receita > 0.85
          ? "Quase tudo o que entra já vai para contas essenciais."
          : "Sobra espaço na renda depois do essencial.",
    },
    {
      rotulo: "Dias no vermelho durante o mês",
      valor: `${fluxo.diasNegativos.length} dia(s)`,
      nota: notaRisco,
      comentario:
        fluxo.diasNegativos.length > 0
          ? "Em alguns dias o saldo projetado fica negativo."
          : "O saldo se mantém positivo o mês todo.",
    },
  ];

  const score = arred(
    100 *
      (0.45 * notaPoupanca +
        0.12 * notaCartao +
        0.1 * notaEmprestimo +
        0.08 * notaParcelas +
        0.1 * notaEssenciais +
        0.15 * notaRisco),
  );
  const faixa = faixaDoScore(score);

  const resumoTexto: Record<Faixa, string> = {
    otimo: "Suas contas estão saudáveis. Continue assim.",
    bom: "Situação boa, com pequenos ajustes possíveis.",
    normal: "Dá para viver, mas há gorduras para cortar.",
    ruim: "Sinal de alerta: os gastos estão apertando o mês.",
    critico: "Situação delicada. Vale agir logo nos principais vazamentos.",
  };

  return {
    score,
    faixa,
    rotulo: ROTULO_FAIXA[faixa],
    resumo: resumoTexto[faixa],
    componentes,
  };
}

function pct(fracao: number): string {
  return `${arred(clamp(fracao, -9.99, 9.99) * 100)}%`;
}

// ---------------------------------------------------------------------------
// Compromissos futuros a partir das parcelas do mês
// ---------------------------------------------------------------------------

export interface ParcelaFutura {
  descricao: string;
  valorMensal: number;
  parcelasRestantes: number;
  totalRestante: number;
  tipo: TipoDivida;
}

export function parcelasFuturasDoMes(mes: Mes): ParcelaFutura[] {
  return mes.despesas
    .filter((d) => d.parcela && d.parcela.atual < d.parcela.total)
    .map((d) => {
      const restantes = d.parcela!.total - d.parcela!.atual;
      return {
        descricao: `${d.descricao} (${d.parcela!.atual}/${d.parcela!.total})`,
        valorMensal: d.valor,
        parcelasRestantes: restantes,
        totalRestante: arred(d.valor * restantes),
        tipo: classificarDivida(d.categoria, d.meioPagamento),
      };
    });
}

export interface CompromissoFuturoTotal {
  /** Valor mensal que continua nos próximos meses. */
  mensal: number;
  cartao: number;
  emprestimo: number;
  outras: number;
}

interface EntradaCompromisso {
  valorMensal: number;
  tipo: TipoDivida;
  ativo: boolean;
}

export function somarCompromissoFuturo(
  itens: EntradaCompromisso[],
): CompromissoFuturoTotal {
  const ativos = itens.filter((i) => i.ativo && i.valorMensal > 0);
  const porTipo = (t: TipoDivida) =>
    soma(ativos.filter((i) => i.tipo === t).map((i) => i.valorMensal));
  return {
    mensal: soma(ativos.map((i) => i.valorMensal)),
    cartao: porTipo("cartao"),
    emprestimo: porTipo("emprestimo"),
    outras: porTipo("outra"),
  };
}

// ---------------------------------------------------------------------------
// Histórico mês a mês
// ---------------------------------------------------------------------------

export interface PontoHistorico {
  key: string;
  receita: number;
  despesa: number;
  saldo: number;
  score: number;
  faixa: Faixa;
}
