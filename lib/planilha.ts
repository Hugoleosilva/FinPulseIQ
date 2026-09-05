import "server-only";
import ExcelJS from "exceljs";
import { CATEGORIAS, getCategoria } from "./categorias";
import type {
  Receita,
  Despesa,
  Essencialidade,
  MeioPagamento,
} from "./tipos";

export interface ItemImportado {
  linha: number;
  tipo: "receita" | "despesa";
  receita?: Omit<Receita, "id">;
  despesa?: Omit<Despesa, "id">;
}

export interface ResultadoParse {
  itens: ItemImportado[];
  erros: { linha: number; mensagem: string }[];
}

export const COLUNAS_MODELO = [
  "tipo",
  "descricao",
  "valor",
  "dia",
  "categoria",
  "subcategoria",
  "classificacao",
  "forma de pagamento",
];

const norm = (s: unknown) =>
  String(s ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

function acharColuna(cabecalho: string[], nomes: string[]): number {
  for (let i = 0; i < cabecalho.length; i++) {
    if (nomes.includes(norm(cabecalho[i]))) return i;
  }
  return -1;
}

function parseValor(v: unknown): number {
  if (typeof v === "number") return v;
  const limpo = norm(v)
    .replace(/r\$/g, "")
    .replace(/\s/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "")
    .replace(",", ".");
  const n = Number(limpo);
  return Number.isFinite(n) ? n : NaN;
}

function parseDia(v: unknown, padrao: number): number {
  const n = Math.round(Number(v));
  if (Number.isFinite(n) && n >= 1 && n <= 31) return n;
  return padrao;
}

function acharCategoria(v: unknown): string | null {
  const alvo = norm(v);
  if (!alvo) return null;
  const exata = CATEGORIAS.find((c) => norm(c.nome) === alvo);
  if (exata) return exata.nome;
  const parcial = CATEGORIAS.find(
    (c) => norm(c.nome).includes(alvo) || alvo.includes(norm(c.nome)),
  );
  return parcial?.nome ?? null;
}

function parseEssencialidade(
  v: unknown,
  padrao: Essencialidade,
): Essencialidade {
  const s = norm(v);
  if (!s) return padrao;
  if (s.startsWith("essenc")) return "essencial";
  if (s.includes("reduz") || s.includes("pode")) return "reduzivel";
  if (s.includes("desnec") || s.includes("superflu") || s.includes("viver sem"))
    return "desnecessario";
  return padrao;
}

function parseMeio(v: unknown): MeioPagamento {
  const s = norm(v);
  if (s.includes("credito") || s === "cartao") return "cartao";
  if (s.includes("debito")) return "debito";
  if (s.includes("pix") || s.includes("transfer")) return "pix";
  if (s.includes("boleto")) return "boleto";
  if (s.includes("dinheiro") || s.includes("especie")) return "dinheiro";
  return "debito";
}

function linhasParaResultado(linhas: string[][]): ResultadoParse {
  const itens: ItemImportado[] = [];
  const erros: { linha: number; mensagem: string }[] = [];

  if (linhas.length < 2) {
    return { itens, erros: [{ linha: 0, mensagem: "A planilha está vazia." }] };
  }

  const cab = linhas[0];
  const cTipo = acharColuna(cab, ["tipo", "entrada/saida", "movimento"]);
  const cDesc = acharColuna(cab, [
    "descricao",
    "descriçao",
    "historico",
    "nome",
    "item",
  ]);
  const cValor = acharColuna(cab, ["valor", "valor (r$)", "r$", "quantia"]);
  const cDia = acharColuna(cab, ["dia", "data", "vencimento"]);
  const cCat = acharColuna(cab, ["categoria", "area"]);
  const cSub = acharColuna(cab, ["subcategoria", "subcategoria", "tipo de gasto"]);
  const cClass = acharColuna(cab, [
    "classificacao",
    "essencialidade",
    "necessidade",
  ]);
  const cMeio = acharColuna(cab, [
    "forma de pagamento",
    "pagamento",
    "meio de pagamento",
    "forma",
  ]);

  if (cDesc === -1 || cValor === -1) {
    return {
      itens,
      erros: [
        {
          linha: 1,
          mensagem:
            "Não encontrei as colunas obrigatórias 'descricao' e 'valor'. Use o modelo.",
        },
      ],
    };
  }

  for (let i = 1; i < linhas.length; i++) {
    const row = linhas[i];
    const nLinha = i + 1;
    const desc = String(row[cDesc] ?? "").trim();
    const brutoValor = row[cValor];
    if (!desc && (brutoValor === undefined || brutoValor === "")) continue; // linha vazia

    if (!desc) {
      erros.push({ linha: nLinha, mensagem: "Sem descrição." });
      continue;
    }
    const valor = parseValor(brutoValor);
    if (!Number.isFinite(valor) || valor <= 0) {
      erros.push({ linha: nLinha, mensagem: `Valor inválido ("${brutoValor}").` });
      continue;
    }

    const tipoTxt = cTipo >= 0 ? norm(row[cTipo]) : "";
    const ehReceita =
      tipoTxt.startsWith("receita") ||
      tipoTxt.startsWith("entrada") ||
      tipoTxt.includes("salario") ||
      tipoTxt === "credito";

    if (ehReceita) {
      itens.push({
        linha: nLinha,
        tipo: "receita",
        receita: {
          descricao: desc,
          valor: Math.round(valor * 100) / 100,
          dia: parseDia(cDia >= 0 ? row[cDia] : undefined, 5),
          tipo: "fixa",
        },
      });
      continue;
    }

    const catNome =
      (cCat >= 0 ? acharCategoria(row[cCat]) : null) ?? "Outros";
    const def = getCategoria(catNome)!;
    const sub =
      (cSub >= 0 ? String(row[cSub] ?? "").trim() : "") ||
      def.subcategorias[0];

    itens.push({
      linha: nLinha,
      tipo: "despesa",
      despesa: {
        descricao: desc,
        valor: Math.round(valor * 100) / 100,
        dia: parseDia(cDia >= 0 ? row[cDia] : undefined, 15),
        categoria: catNome,
        subcategoria: sub,
        meioPagamento: cMeio >= 0 ? parseMeio(row[cMeio]) : "debito",
        cartaoId: null,
        essencialidade: parseEssencialidade(
          cClass >= 0 ? row[cClass] : undefined,
          def.essencialidadePadrao,
        ),
        recorrente: false,
        parcela: null,
      },
    });
  }

  return { itens, erros };
}

function parseCSV(texto: string): string[][] {
  const linhas: string[][] = [];
  let campo = "";
  let atual: string[] = [];
  let dentroAspas = false;
  const sep = texto.includes(";") && !texto.includes(",") ? ";" : ",";

  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (dentroAspas) {
      if (c === '"') {
        if (texto[i + 1] === '"') {
          campo += '"';
          i++;
        } else dentroAspas = false;
      } else campo += c;
    } else if (c === '"') {
      dentroAspas = true;
    } else if (c === sep) {
      atual.push(campo);
      campo = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && texto[i + 1] === "\n") i++;
      atual.push(campo);
      linhas.push(atual);
      atual = [];
      campo = "";
    } else {
      campo += c;
    }
  }
  if (campo !== "" || atual.length) {
    atual.push(campo);
    linhas.push(atual);
  }
  return linhas.filter((l) => l.some((c) => c.trim() !== ""));
}

export async function parsePlanilha(
  arquivo: File,
): Promise<ResultadoParse> {
  const nome = arquivo.name.toLowerCase();
  const buf = Buffer.from(await arquivo.arrayBuffer());

  if (nome.endsWith(".csv") || arquivo.type === "text/csv") {
    return linhasParaResultado(parseCSV(buf.toString("utf-8")));
  }

  const wb = new ExcelJS.Workbook();
  await (wb.xlsx.load as (data: unknown) => Promise<unknown>)(buf);
  const ws = wb.worksheets[0];
  if (!ws) {
    return { itens: [], erros: [{ linha: 0, mensagem: "Planilha sem abas." }] };
  }

  const linhas: string[][] = [];
  ws.eachRow((row) => {
    const valores: string[] = [];
    row.eachCell({ includeEmpty: true }, (cell) => {
      const v = cell.value;
      if (v == null) valores.push("");
      else if (typeof v === "object" && "text" in v)
        valores.push(String((v as { text: string }).text));
      else if (v instanceof Date) valores.push(String(v.getDate()));
      else valores.push(String(v));
    });
    linhas.push(valores);
  });

  return linhasParaResultado(linhas);
}

export function modeloCSV(): string {
  const cab = COLUNAS_MODELO.join(",");
  const exemplos = [
    "Despesa,Aluguel,1200.00,10,Moradia,Aluguel,essencial,boleto",
    "Despesa,Compras no mercado,550.00,8,Alimentação,Mercado,essencial,debito",
    "Despesa,Pizza no sábado,90.00,14,Alimentação,Delivery (iFood; etc.),desnecessario,cartao",
    "Receita,Salário,5000.00,5,,,,",
  ];
  return [cab, ...exemplos].join("\n");
}
