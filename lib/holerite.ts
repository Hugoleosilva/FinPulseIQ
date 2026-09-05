import "server-only";
import type { ItemHolerite } from "./tipos";

export interface HoleriteLido {
  /** Conseguiu extrair texto do PDF? (false = provavelmente é imagem/escaneado) */
  textoOk: boolean;
  proventos: ItemHolerite[];
  descontos: ItemHolerite[];
  /** "Valor líquido" que apareceu impresso no holerite, se encontrado. */
  liquidoDetectado: number | null;
}

const norm = (s: string) =>
  s
    .toUpperCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

// Palavras que indicam a linha do líquido final
const CHAVE_LIQUIDO = [
  "LIQUIDO A RECEBER",
  "VALOR LIQUIDO",
  "LIQUIDO A CREDITAR",
  "TOTAL LIQUIDO",
  "LIQUIDO",
];

// Linhas que são totais/bases e NÃO devem virar item
const IGNORAR = [
  "TOTAL DE VENCIMENTOS",
  "TOTAL DE PROVENTOS",
  "TOTAL VENCIMENTOS",
  "TOTAL PROVENTOS",
  "TOTAL DE DESCONTOS",
  "TOTAL DESCONTOS",
  "TOTAL BRUTO",
  "BASE INSS",
  "BASE FGTS",
  "BASE PARA FGTS",
  "BASE IRRF",
  "BASE CALC",
  "BASE DE CALCULO",
  "BASE IR PLR",
  "BASE PARA CALCULO",
  "FGTS DO MES",
  "FGTS MES",
  "DEPOSITO FGTS",
  "SAL. BASE",
  "SAL. DO CALCULO",
  "SAL DO CALCULO",
  "SALARIO BASE INSS",
  "SALARIO CONTRIB",
  "SAL. CONTRIBUICAO",
  "SALARIO DE CONTRIBUICAO",
  "SALARIO CONTRIBUICAO",
  "MARGEM CONSIG",
  "SALARIO FAMILIA BASE",
  "PLR ANUAL",
  "PENSAO ALIMENTICIA JUDICIAL",
  "DEP. SAL. FAMILIA",
  "DEP. IRRF",
];

const CHAVE_DESCONTO = [
  "INSS",
  "I.N.S.S",
  "IRRF",
  "I.R.R.F",
  "IMPOSTO DE RENDA",
  "IMP. RENDA",
  "PREVIDENCIA",
  "PLANO DE SAUDE",
  "PLANO SAUDE",
  "ASSIST. MEDICA",
  "ASSISTENCIA MEDICA",
  "ASSIST MEDICA",
  "ODONTO",
  "UNIMED",
  "AMIL",
  "SULAMERICA",
  "HAPVIDA",
  "BRADESCO SAUDE",
  "COPARTICIPACAO",
  "COOPARTICIPACAO",
  "CO-PARTICIPACAO",
  "COPARTIC",
  "COOPARTIC",
  "COPART ",
  "DESC COOP",
  "DESC. COOP",
  "VALE TRANSPORTE",
  "VALE-TRANSPORTE",
  "VT ",
  "V.T.",
  "ADIANTAMENTO",
  "VALE SALARIO",
  "FALTA",
  "ATRASO",
  "D.S.R. DESC",
  "DSR DESCONTO",
  "PENSAO ALIMENTICIA",
  "PENSAO",
  "EMPRESTIMO",
  "CONSIGNADO",
  "CONTRIB. SINDICAL",
  "CONTRIBUICAO SINDICAL",
  "CONTRIB SINDICAL",
  "MENSALIDADE SINDICAL",
  "SEGURO DE VIDA",
  "FARMACIA",
  "REFEICAO",
  "CESTA",
  "DESCONTO",
];

const CHAVE_PROVENTO = [
  "SALARIO",
  "ORDENADO",
  "VENCIMENTO",
  "VENC.",
  "HORAS NORMAIS",
  "AUXILIO",
  "AUX.",
  "AUX ",
  "ADICIONAL",
  "AD. NOTURNO",
  "ADIC NOTURNO",
  "HORA EXTRA",
  "H. EXTRA",
  "H.EXTRA",
  "HE ",
  "H.E.",
  "GRATIFICACAO",
  "GRATIF",
  "COMISSAO",
  "PREMIO",
  "BONUS",
  "ABONO",
  "AJUDA DE CUSTO",
  "FERIAS",
  "13. SALARIO",
  "13 SALARIO",
  "DECIMO TERCEIRO",
  "INSALUBRIDADE",
  "PERICULOSIDADE",
  "QUEBRA DE CAIXA",
  "REEMBOLSO",
  "D.S.R.",
  "DSR ",
  "REPOUSO SEMANAL",
  "SALARIO FAMILIA",
  "DIARIAS",
];

/** Encontra todos os números no formato "1.234,56" / "1234,56" / "1234.56" numa linha. */
function valoresNaLinha(linha: string): number[] {
  const re = /(?<![\d.,])(\d{1,3}(?:\.\d{3})+,\d{2}|\d+,\d{2}|\d+\.\d{2})(?![\d.,])/g;
  const out: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(linha))) {
    const bruto = m[1];
    let n: number;
    if (bruto.includes(",")) {
      n = Number(bruto.replace(/\./g, "").replace(",", "."));
    } else {
      n = Number(bruto);
    }
    if (Number.isFinite(n)) out.push(n);
  }
  return out;
}

/** Rótulo da linha = trecho antes do primeiro número, limpo. */
function rotuloDaLinha(linha: string): string {
  const semNum = linha.split(
    /\s+\d{1,3}(?:\.\d{3})*(?:,\d{2})|\s+\d+[.,]\d{2}/,
  )[0];
  return semNum
    .replace(/^\s*[\d.]+\s+/, "") // código no início
    .replace(/\s{2,}/g, " ")
    .replace(/[|:;]+$/, "")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function contem(alvo: string, lista: string[]): boolean {
  return lista.some((k) => alvo.includes(k));
}

/** Código do lançamento no início da linha ("1038 Auxilio Creche..."). */
function codigoDaLinha(linha: string): number | null {
  const m = linha.match(/^\s*(\d{2,5})\s+\D/);
  return m ? Number(m[1]) : null;
}

/** Linha só com números / datas / hífens — a "linha de valores" de um bloco. */
function soNumeros(linha: string): boolean {
  return /^[\s\d.,/:-]+$/.test(linha);
}

type Tipo = "provento" | "desconto" | null;

function classificar(N: string, codigo: number | null): Tipo {
  const desc = contem(N, CHAVE_DESCONTO);
  const prov = contem(N, CHAVE_PROVENTO);
  if (desc && !prov) return "desconto";
  if (prov && !desc) return "provento";
  // Convenção comum: 1xxx = provento, 2xxx–9xxx = desconto
  if (codigo != null) {
    if (codigo >= 1000 && codigo <= 1899) return "provento";
    if (codigo >= 1900 && codigo <= 9999) return "desconto";
  }
  if (desc) return "desconto";
  if (prov) return "provento";
  if (/\b(DESC|DEDUC|CONTRIB|IMPOSTO|PENSAO|EMPREST|CONSIG)/.test(N)) {
    return "desconto";
  }
  return null;
}

export function interpretarTextoHolerite(texto: string): HoleriteLido {
  const linhas = texto
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const proventos: ItemHolerite[] = [];
  const descontos: ItemHolerite[] = [];
  let liquidoDetectado: number | null = null;
  let liquidoNaProxima = false;

  for (const linha of linhas) {
    const N = norm(linha);
    const valores = valoresNaLinha(linha);

    // Linha de rótulos (sem valor): guarda se o último rótulo é "líquido"
    if (valores.length === 0) {
      liquidoNaProxima = contem(N, CHAVE_LIQUIDO);
      continue;
    }

    const valor = valores[valores.length - 1];

    // "... Líquido a Receber" numa linha, e os valores na linha seguinte
    if (liquidoNaProxima && soNumeros(linha)) {
      if (valor > 0) liquidoDetectado = valor;
      liquidoNaProxima = false;
      continue;
    }
    liquidoNaProxima = false;

    if (contem(N, CHAVE_LIQUIDO)) {
      if (valor > 0) liquidoDetectado = valor;
      continue;
    }

    if (contem(N, IGNORAR)) continue;
    if (valor <= 0) continue;
    // linha de valores solta, sem rótulo: ignora
    if (soNumeros(linha)) continue;

    const codigo = codigoDaLinha(linha);
    const tipo = classificar(N, codigo);
    if (!tipo) continue;

    const rotulo = rotuloDaLinha(linha) || "Item";
    (tipo === "desconto" ? descontos : proventos).push({
      descricao: rotulo,
      valor,
    });
  }

  return {
    textoOk: true,
    proventos: dedup(proventos),
    descontos: dedup(descontos),
    liquidoDetectado,
  };
}

function dedup(itens: ItemHolerite[]): ItemHolerite[] {
  const vistos = new Set<string>();
  const out: ItemHolerite[] = [];
  for (const it of itens) {
    const chave = `${it.descricao}|${it.valor}`;
    if (vistos.has(chave)) continue;
    vistos.add(chave);
    out.push(it);
  }
  return out;
}

export async function lerHoleritePDF(arquivo: File): Promise<HoleriteLido> {
  const vazio: HoleriteLido = {
    textoOk: false,
    proventos: [],
    descontos: [],
    liquidoDetectado: null,
  };
  try {
    const { extractText, getDocumentProxy } = await import("unpdf");
    const buf = new Uint8Array(await arquivo.arrayBuffer());
    const pdf = await getDocumentProxy(buf);
    const { text } = await extractText(pdf, { mergePages: true });
    const txt = Array.isArray(text) ? text.join("\n") : text;
    if (!txt || txt.replace(/\s/g, "").length < 20) return vazio;
    return interpretarTextoHolerite(txt);
  } catch {
    return vazio;
  }
}
