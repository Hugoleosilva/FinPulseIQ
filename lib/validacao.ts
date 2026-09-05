import { z } from "zod";
import { NOMES_CATEGORIAS } from "./categorias";

const dinheiro = z.preprocess(
  (v) => {
    if (typeof v !== "string") return v;
    const limpo = v
      .trim()
      .replace(/\s/g, "")
      .replace(/^R\$/i, "")
      .replace(/\./g, "")
      .replace(",", ".");
    if (limpo === "") return 0;
    const n = Number(limpo);
    return Number.isNaN(n) ? v : n;
  },
  z
    .number({ error: "Informe um valor em reais (ex.: 149,90)." })
    .nonnegative("O valor não pode ser negativo."),
);

const dia = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : Number(v)),
  z
    .number({ error: "Informe o dia do mês (1 a 31)." })
    .int()
    .min(1, "Dia entre 1 e 31.")
    .max(31, "Dia entre 1 e 31."),
);

// --- Cadastro / login -----------------------------------------------------

export const cadastroSchema = z
  .object({
    nomeExibicao: z
      .string()
      .trim()
      .min(2, "Escreva seu nome (pelo menos 2 letras)."),
    login: z
      .string()
      .trim()
      .toLowerCase()
      .min(3, "O apelido de acesso precisa de pelo menos 3 caracteres.")
      .max(30, "Apelido muito longo.")
      .regex(
        /^[a-z0-9._-]+$/,
        "Use só letras, números, ponto, traço ou sublinhado (sem espaços).",
      ),
    senha: z.string().min(6, "A senha precisa de pelo menos 6 caracteres."),
    confirmarSenha: z.string(),
  })
  .refine((d) => d.senha === d.confirmarSenha, {
    path: ["confirmarSenha"],
    message: "As duas senhas não são iguais.",
  });

export const loginSchema = z.object({
  login: z.string().trim().toLowerCase().min(1, "Informe seu apelido de acesso."),
  senha: z.string().min(1, "Informe sua senha."),
});

// --- Receita -------------------------------------------------------------

export const receitaSchema = z.object({
  descricao: z.string().trim().min(1, "Diga de onde vem esse dinheiro."),
  valor: dinheiro.refine((n) => n > 0, "O valor precisa ser maior que zero."),
  dia,
  tipo: z.enum(["fixa", "variavel"]),
});

// --- Despesa ------------------------------------------------------------

export const despesaSchema = z.object({
  descricao: z.string().trim().min(1, "Diga o que foi esse gasto."),
  valor: dinheiro.refine((n) => n > 0, "O valor precisa ser maior que zero."),
  dia,
  categoria: z.enum(NOMES_CATEGORIAS as [string, ...string[]]),
  subcategoria: z.string().trim().min(1, "Escolha um tipo dentro da categoria."),
  meioPagamento: z.enum(["dinheiro", "debito", "pix", "cartao", "boleto"]),
  cartaoId: z.string().optional().nullable(),
  essencialidade: z.enum(["essencial", "reduzivel", "desnecessario"]),
  parcelaAtual: z.coerce.number().int().min(0).max(360).optional(),
  parcelaTotal: z.coerce.number().int().min(0).max(360).optional(),
});

export const saldoInicialSchema = z.object({
  saldoInicial: dinheiro,
});

// --- Cartão ------------------------------------------------------------

export const cartaoSchema = z.object({
  id: z.string().optional(),
  nome: z.string().trim().min(1, "Dê um nome para o cartão."),
  bandeira: z.string().trim().optional(),
  limite: dinheiro,
  diaFechamento: dia,
  diaVencimento: dia,
});

// --- Compromisso futuro ----------------------------------------------

export const compromissoSchema = z.object({
  id: z.string().optional(),
  descricao: z.string().trim().min(1, "Diga o que é esse compromisso."),
  valorParcela: dinheiro.refine((n) => n > 0, "Informe o valor da parcela."),
  parcelasRestantes: z.coerce
    .number()
    .int()
    .min(1, "Quantas parcelas ainda faltam?")
    .max(360),
  categoria: z.enum(NOMES_CATEGORIAS as [string, ...string[]]),
  cartaoId: z.string().optional().nullable(),
});

// --- Documento (fatura / nota / conta) ---------------------------------

export const documentoMetaSchema = z.object({
  descricao: z.string().trim().min(1, "Dê um nome ou descrição ao documento."),
  tipo: z.enum([
    "fatura_cartao",
    "boleto",
    "nota_fiscal",
    "conta_servico",
    "comprovante",
    "contrato",
    "outro",
  ]),
  mesRef: z.preprocess(
    (v) => {
      if (typeof v !== "string" || v.trim() === "") return null;
      return /^\d{4}-\d{2}$/.test(v.trim()) ? v.trim() : null;
    },
    z.string().nullable(),
  ),
  valor: z.preprocess(
    (v) => {
      if (typeof v !== "string" || v.trim() === "") return null;
      const n = Number(
        v.trim().replace(/\s/g, "").replace(/^R\$/i, "").replace(/\./g, "").replace(",", "."),
      );
      return Number.isNaN(n) ? null : n;
    },
    z.number().nonnegative().nullable(),
  ),
});

export type { EstadoForm } from "./forms";
