import "server-only";
import { getCategoria } from "./categorias";

export interface TransacaoFatura {
  data: string; // "DD/MM"
  descricao: string;
  valor: number;
  categoria: string; // já mapeada para as categorias do FinPulseIQ
  subcategoria: string;
  essencialidade: "essencial" | "reduzivel" | "desnecessario";
  parcela: { atual: number; total: number } | null;
  titular: string | null; // nome da seção (cartão compartilhado)
  origem: "compra" | "internacional" | "servico";
}

export interface FaturaLida {
  textoOk: boolean;
  banco: string | null;
  cartaoFinal: string | null;
  totalFatura: number | null;
  /** Total só dos lançamentos deste mês (sem saldo financiado nem encargos). */
  totalLancamentos: number | null;
  vencimento: string | null; // "DD/MM/AAAA"
  titulares: string[];
  transacoes: TransacaoFatura[];
}

const norm = (s: string) =>
  s
    .toUpperCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();

// --- Itaú imprime uma categoria em cada linha; mapeamos para as nossas -------

const MAPA_ITAU: Record<string, [string, string, TransacaoFatura["essencialidade"]]> =
  {
    RESTAURANTE: ["Alimentação", "Restaurante", "reduzivel"],
    ALIMENTACAO: ["Alimentação", "Mercado", "essencial"],
    SUPERMERCADO: ["Alimentação", "Mercado", "essencial"],
    TRANSPORTE: ["Transporte", "Aplicativo (Uber / 99)", "essencial"],
    VEICULOS: ["Transporte", "Manutenção", "essencial"],
    SAUDE: ["Saúde", "Farmácia / remédios", "essencial"],
    EDUCACAO: ["Educação", "Curso", "essencial"],
    ELETRONICOS: ["Compras", "Eletrônicos", "reduzivel"],
    VESTUARIO: ["Compras", "Roupas", "reduzivel"],
    CASA: ["Moradia", "Manutenção / reparos", "reduzivel"],
    LAZER: ["Lazer", "Passeios", "reduzivel"],
    "TURISMO E ENTRETENIM": ["Lazer", "Viagem", "reduzivel"],
    AIRLINE: ["Lazer", "Viagem", "reduzivel"],
    SERVICOS: ["Contas e serviços", "Taxas bancárias", "reduzivel"],
    DIVERSOS: ["Outros", "Diversos", "reduzivel"],
    OUTROS: ["Outros", "Diversos", "reduzivel"],
  };

const CATEGORIAS_ITAU = Object.keys(MAPA_ITAU);

// --- refinamento por nome do estabelecimento --------------------------------

interface RegraMerchant {
  re: RegExp;
  cat: string;
  sub: string;
  ess: TransacaoFatura["essencialidade"];
}

const MERCHANTS: RegraMerchant[] = [
  { re: /IFD\*|IFOOD|ZE DELIVERY|99FOOD|RAPPI/, cat: "Alimentação", sub: "Delivery (iFood, etc.)", ess: "desnecessario" },
  { re: /DL\*UBER|UBER\*|UBERRIDES|\bUBER\b|\b99\s?TAXI|\b99\s?POP|\b99APP/, cat: "Transporte", sub: "Aplicativo (Uber / 99)", ess: "reduzivel" },
  { re: /POSTO|SHELL|IPIRANGA|PETROBRAS|ALESAT|BR MANIA/, cat: "Transporte", sub: "Combustível", ess: "essencial" },
  { re: /SPOTIFY|NETFLIX|GLOBOPLAY|GLOBO COMBO|GLOBO\*|TELECINE|HBOMAX|HBO MAX|DISNEY|PARAMOUNT|YOUTUBE PREM|GOOGLE ONE|KINDLE|AMAZON PRIME|AMAZONPRIME|PRIME CANAIS|MELIMAIS|MELI\+|MERCADO LIVRE\*MELI/, cat: "Assinaturas", sub: "Streaming (Netflix, etc.)", ess: "reduzivel" },
  { re: /ANTHROPIC|CLAUDE|OPENAI|CHATGPT|CURSOR|GITHUB|VERCEL|NOTION|FIGMA|ADOBE|CANVA|GOOGLE\s?\*?GSUITE|WORKSPACE/, cat: "Assinaturas", sub: "Aplicativos / assinaturas digitais", ess: "reduzivel" },
  { re: /DROGASIL|DROGARIA|DROGA RAIA|RAIA DROGASIL|PACHECO|PANVEL|PAGUE MENOS|FARMACIA|EXTRAFARMA|DROGATIM/, cat: "Saúde", sub: "Farmácia / remédios", ess: "essencial" },
  { re: /UNIMED|HAPVIDA|AMIL|BRADESCO SAUDE|SULAMERICA|ODONTO|LABORATORIO|EXAME|HOSPITAL|CLINICA/, cat: "Saúde", sub: "Plano de saúde", ess: "essencial" },
  { re: /X1 FITNESS|VFITNESS|SMART ?FIT|SMARTFIT|BODYTECH|ACADEMIA|BLUEFIT|PANOBIANCO/, cat: "Saúde", sub: "Academia", ess: "reduzivel" },
  { re: /COMPESA|SANEAGO|SABESP|CAGECE|EMBASA|CAESB/, cat: "Moradia", sub: "Água", ess: "essencial" },
  { re: /CELPE|NEOENERGIA|ENEL|LIGHT|CEMIG|COPEL|EQUATORIAL|ENERGISA/, cat: "Moradia", sub: "Luz", ess: "essencial" },
  { re: /VIVO|CLARO|TIM |OI |NEXTEL|ALGAR/, cat: "Contas e serviços", sub: "Telefone / celular", ess: "essencial" },
  { re: /AMAZON|SHOPEE|MERCADOLIVRE|MERCADO LIVRE|ALIEXPRESS|MAGALU|MAGAZINE LUIZA|AMERICANAS|CASAS BAHIA|SHEIN/, cat: "Compras", sub: "Outros", ess: "reduzivel" },
  { re: /GRAN EDUCACAO|COD3R|ALURA|UDEMY|COURSERA|HOTMART|ENSINO|CURSO|FACULDADE|COLEGIO|ESCOLA/, cat: "Educação", sub: "Curso", ess: "essencial" },
  { re: /LIVRARIA|SARAIVA|CULTURA|AMAZON.*KINDLE|LEITURA/, cat: "Educação", sub: "Livros", ess: "reduzivel" },
  { re: /AZUL LINHAS|GOL LINHAS|LATAM|TAM |AVIANCA|123 ?MILHAS|DECOLAR|HURB|BOOKING|AIRBNB|CVC/, cat: "Lazer", sub: "Viagem", ess: "reduzivel" },
  { re: /PARKING|ESTACIONAMENTO|ZONA AZUL|PEDAGIO|SEM PARAR|VELOE|CONECTCAR/, cat: "Transporte", sub: "Estacionamento / pedágio", ess: "essencial" },
  { re: /SEGURO/, cat: "Contas e serviços", sub: "Seguro de vida", ess: "reduzivel" },
  { re: /ANUIDADE/, cat: "Fatura de cartão (sem detalhar)", sub: "Anuidade", ess: "reduzivel" },
  { re: /PARCELAMEN.* FATURA|PARCELAMENTO DE FATURA|ENVIO MENS|JUROS|IOF|ENCARGOS|ROTATIVO/, cat: "Empréstimos e financiamentos", sub: "Juros do cartão / rotativo", ess: "essencial" },
  { re: /LOTERIA|LOTERIAS ?ONLINE|APP DA SORTE|DA SORTE|BET|APOSTA/, cat: "Lazer", sub: "Jogos", ess: "desnecessario" },
  { re: /RESTAURANTE|PIZZA|BURGER|LANCHE|PADARIA|CAFE|BAR |CHOPP|CHURRAS/, cat: "Alimentação", sub: "Restaurante", ess: "reduzivel" },
  { re: /MERCEARIA|MERCADO|SUPERMERC|HORTIFRUTI|ATACAD|SACOLAO|EMPORIO/, cat: "Alimentação", sub: "Mercado", ess: "essencial" },
];

function classificar(
  descricao: string,
  catItau: string | null,
): { categoria: string; subcategoria: string; essencialidade: TransacaoFatura["essencialidade"] } {
  const N = norm(descricao);

  const generico =
    !catItau ||
    catItau === "OUTROS" ||
    catItau === "DIVERSOS" ||
    catItau === "SERVICOS";

  if (generico) {
    for (const m of MERCHANTS) {
      if (m.re.test(N)) {
        return { categoria: m.cat, subcategoria: m.sub, essencialidade: m.ess };
      }
    }
  }

  if (catItau && MAPA_ITAU[catItau]) {
    const [c, s, e] = MAPA_ITAU[catItau];
    return { categoria: c, subcategoria: s, essencialidade: e };
  }

  // ainda tenta merchant mesmo sem categoria genérica
  for (const m of MERCHANTS) {
    if (m.re.test(N)) {
      return { categoria: m.cat, subcategoria: m.sub, essencialidade: m.ess };
    }
  }

  const def = getCategoria("Outros")!;
  return {
    categoria: "Outros",
    subcategoria: def.subcategorias[0],
    essencialidade: "reduzivel",
  };
}

// --- parsing ---------------------------------------------------------------

// grupos: 1=data 2=descrição 3=parcelaAtual 4=parcelaTotal 5=sinal("-") 6=valor
const RE_TRANSACAO =
  /^(\d{2}\/\d{2})\s+(.+?)(?:\s*(\d{2})\/(\d{2}))?\s+(-\s*)?(\d{1,3}(?:\.\d{3})*,\d{2})\s*$/;

const RE_NOME = /^[A-ZÀ-Ú][A-ZÀ-Ú.\s]{4,}$/;

const PARAR = [
  "COMPRAS PARCELADAS",
  "PROXIMAS FATURAS",
  "TOTAL DOS LANCAMENTOS ATUAIS",
  "TOTAL PARA PROXIMAS FATURAS",
  "PROXIMA FATURA ",
  "DEMAIS FATURAS",
  "LIMITES DE CREDITO",
  "LIMITE TOTAL DE CREDITO",
  "ENCARGOS COBRADOS NESTA FATURA",
  "DEMAIS TAXAS DE JUROS",
  "NOVO TETO DE JUROS",
  "SIMULACAO DE COMPRAS",
  "SIMULACAO SAQUE",
  "FIQUE ATENTO AOS ENCARGOS",
];

const CABECALHOS_IGNORAR = [
  "DATA ESTABELECIMENTO",
  "DATA PRODUTOS",
  "VALOR EM R",
  "LANCAMENTOS NO CARTAO",
  "TOTAL DOS PAGAMENTOS",
  "TOTAL DAS COMPRAS",
  "TOTAL TRANSACOES INTER",
  "REPASSE DE IOF",
  "TOTAL LANCAMENTOS INTER",
  "DOLAR DE CONVERSAO",
];

function parcelaValida(a?: string, t?: string) {
  if (!a || !t) return null;
  const atual = Number(a);
  const total = Number(t);
  if (!Number.isFinite(atual) || !Number.isFinite(total) || total < 1) return null;
  if (atual < 1 || atual > total || total > 420) return null;
  return { atual, total };
}

export function interpretarFaturaItau(texto: string): FaturaLida {
  const linhas = texto
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const out: FaturaLida = {
    textoOk: true,
    banco: /ITA[UÚ]/i.test(texto) ? "Itaú" : null,
    cartaoFinal: null,
    totalFatura: null,
    totalLancamentos: null,
    vencimento: null,
    titulares: [],
    transacoes: [],
  };

  // Cabeçalho
  for (let li = 0; li < linhas.length; li++) {
    const l = linhas[li];
    // "Cartão 5487.XXXX.XXXX.2516" ou o número na linha seguinte a "Cartão",
    // ou "(final 2516)".
    const mCartao =
      l.match(/CART[AÃ]O\s+[\dX.]*?(\d{4})\s*$/i) ||
      l.match(/\(FINAL\s+(\d{4})\)/i) ||
      (/^CART[AÃ]O\s*$/i.test(norm(l))
        ? (linhas[li + 1] ?? "").match(/[\dX.]*?(\d{4})\s*$/)
        : null);
    if (mCartao && !out.cartaoFinal) out.cartaoFinal = mCartao[1];
    const mVenc = l.match(/VENCIMENTO[:\s]+(\d{2}\/\d{2}\/\d{4})/i);
    if (mVenc && !out.vencimento) out.vencimento = mVenc[1];
    const mTotal =
      l.match(/TOTAL DESTA FATURA\s+(\d{1,3}(?:\.\d{3})*,\d{2})/i) ||
      l.match(/O TOTAL DA SUA FATURA[^\d]+(\d{1,3}(?:\.\d{3})*,\d{2})/i);
    if (mTotal && out.totalFatura == null) {
      out.totalFatura = Number(mTotal[1].replace(/\./g, "").replace(",", "."));
    }
    const mLanc = l.match(
      /(?:TOTAL DOS LAN[ÇC]AMENTOS ATUAIS|LAN[ÇC]AMENTOS ATUAIS)\s+(\d{1,3}(?:\.\d{3})*,\d{2})/i,
    );
    if (mLanc && out.totalLancamentos == null) {
      out.totalLancamentos = Number(
        mLanc[1].replace(/\./g, "").replace(",", "."),
      );
    }
  }

  let secao: TransacaoFatura["origem"] | "pagamentos" | null = null;
  let titularAtual: string | null = null;
  let pendente: TransacaoFatura | null = null;

  const empurra = (t: TransacaoFatura | null) => {
    if (t) out.transacoes.push(t);
  };

  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i];
    const N = norm(linha);

    // "PARAR" só encerra DEPOIS de já estarmos numa seção de lançamentos —
    // senão rótulos do cabeçalho da 1ª página (ex.: "Limite total de crédito:")
    // abortariam a leitura antes das transações.
    const emTransacoes =
      secao === "compra" || secao === "internacional" || secao === "servico";
    if (emTransacoes && PARAR.some((p) => N.startsWith(p))) {
      empurra(pendente);
      pendente = null;
      break;
    }

    if (N.startsWith("PAGAMENTOS EFETUADOS")) {
      secao = "pagamentos";
      continue;
    }
    if (N.startsWith("LANCAMENTOS: COMPRAS E SAQUES") || N.startsWith("LANCAMENTOS COMPRAS E SAQUES")) {
      empurra(pendente);
      pendente = null;
      secao = "compra";
      continue;
    }
    if (N.startsWith("LANCAMENTOS INTERNACIONAIS")) {
      empurra(pendente);
      pendente = null;
      secao = "internacional";
      continue;
    }
    if (N.startsWith("LANCAMENTOS: PRODUTOS E SERVICOS") || N.startsWith("LANCAMENTOS PRODUTOS E SERVICOS")) {
      empurra(pendente);
      pendente = null;
      secao = "servico";
      continue;
    }
    if (CABECALHOS_IGNORAR.some((c) => N.includes(c))) continue;
    if (secao === "pagamentos") continue;

    // Layout co-branded (Pão de Açúcar): transações vêm antes do cabeçalho.
    if (secao === null) {
      if (RE_TRANSACAO.test(linha)) secao = "compra";
      else continue;
    }

    const primeira = N.split(/\s+/)[0];
    const doisPrimeiros = N.split(/\s+/).slice(0, 2).join(" ");
    const catItauNaLinha =
      CATEGORIAS_ITAU.find((c) => c === doisPrimeiros) ??
      CATEGORIAS_ITAU.find((c) => c === primeira) ??
      null;

    // linha "categoria CIDADE" logo abaixo de uma transação
    if (pendente && catItauNaLinha) {
      const c = classificar(pendente.descricao, catItauNaLinha);
      pendente.categoria = c.categoria;
      pendente.subcategoria = c.subcategoria;
      pendente.essencialidade = c.essencialidade;
      empurra(pendente);
      pendente = null;
      continue;
    }

    // nome do titular de uma seção compartilhada
    if (
      !catItauNaLinha &&
      linha.includes(" ") &&
      RE_NOME.test(linha) &&
      !RE_TRANSACAO.test(linha)
    ) {
      titularAtual = linha.replace(/\s+/g, " ").trim();
      if (!out.titulares.includes(titularAtual)) out.titulares.push(titularAtual);
      empurra(pendente);
      pendente = null;
      continue;
    }

    const m = linha.match(RE_TRANSACAO);
    if (m) {
      empurra(pendente);
      const negativo = Boolean(m[5]);
      const valor = Number(m[6].replace(/\./g, "").replace(",", "."));
      // negativos = estornos/descontos/créditos de parcelamento, ignora
      if (negativo || valor <= 0) {
        pendente = null;
        continue;
      }
      const descricao = m[2].replace(/\s+/g, " ").replace(/[\s*-]+$/, "").trim();
      pendente = {
        data: m[1],
        descricao,
        valor,
        categoria: "Outros",
        subcategoria: "Diversos",
        essencialidade: "reduzivel",
        parcela: parcelaValida(m[3], m[4]),
        titular: titularAtual,
        origem: secao === "internacional" ? "internacional" : secao === "servico" ? "servico" : "compra",
      };
      // classifica já (pode ser refinado pela linha de categoria seguinte)
      const c = classificar(descricao, null);
      pendente.categoria = c.categoria;
      pendente.subcategoria = c.subcategoria;
      pendente.essencialidade = c.essencialidade;
      continue;
    }
  }
  empurra(pendente);

  out.transacoes = dedupTransacoes(out.transacoes);
  return out;
}

/**
 * Remove duplicatas de compras PARCELADAS que aparecem tanto na fatura atual
 * quanto na lista de "próximas faturas" (layout co-branded). Só mexe em
 * parceladas — compras avulsas de mesmo valor podem ser legítimas (cartão
 * compartilhado, duas corridas de app etc.).
 */
function dedupTransacoes(t: TransacaoFatura[]): TransacaoFatura[] {
  const chave = (x: TransacaoFatura) =>
    `${norm(x.descricao).replace(/\d+$/, "").slice(0, 16)}|${x.valor}|${x.parcela!.total}`;

  const melhorParcela = new Map<string, number>();
  for (const x of t) {
    if (!x.parcela) continue;
    const k = chave(x);
    const atual = melhorParcela.get(k);
    if (atual == null || x.parcela.atual < atual) {
      melhorParcela.set(k, x.parcela.atual);
    }
  }

  const usados = new Set<string>();
  const out: TransacaoFatura[] = [];
  for (const x of t) {
    if (!x.parcela) {
      out.push(x);
      continue;
    }
    const k = chave(x);
    if (x.parcela.atual !== melhorParcela.get(k)) continue; // é a versão "futura"
    if (usados.has(k)) continue; // já pegou uma cópia dessa parcela
    usados.add(k);
    out.push(x);
  }
  return out;
}

export async function lerFaturaPDF(arquivo: File): Promise<FaturaLida> {
  const vazio: FaturaLida = {
    textoOk: false,
    banco: null,
    cartaoFinal: null,
    totalFatura: null,
    totalLancamentos: null,
    vencimento: null,
    titulares: [],
    transacoes: [],
  };
  try {
    const { extractText, getDocumentProxy } = await import("unpdf");
    const buf = new Uint8Array(await arquivo.arrayBuffer());
    const pdf = await getDocumentProxy(buf);
    const { text } = await extractText(pdf, { mergePages: true });
    const txt = Array.isArray(text) ? text.join("\n") : text;
    if (!txt || txt.replace(/\s/g, "").length < 50) return vazio;
    return interpretarFaturaItau(txt);
  } catch {
    return vazio;
  }
}
