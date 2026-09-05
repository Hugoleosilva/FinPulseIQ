// Tipos compartilhados entre servidor e cliente.

export type Essencialidade = "essencial" | "reduzivel" | "desnecessario";

export type MeioPagamento =
  | "dinheiro"
  | "debito"
  | "pix"
  | "cartao"
  | "boleto";

export type TipoReceita = "fixa" | "variavel";

export interface Parcela {
  atual: number;
  total: number;
}

export interface ItemHolerite {
  descricao: string;
  valor: number;
}

export interface Receita {
  id: string;
  descricao: string;
  valor: number;
  dia: number; // dia do mês (1 a 31)
  tipo: TipoReceita;
  /** Preenchido quando a receita foi cadastrada pelo detalhamento do holerite.
   *  `valor` acima já é o líquido (proventos - descontos). */
  detalhe?: {
    proventos: ItemHolerite[];
    descontos: ItemHolerite[];
  } | null;
}

export interface Despesa {
  id: string;
  descricao: string;
  valor: number;
  dia: number;
  categoria: string;
  subcategoria: string;
  meioPagamento: MeioPagamento;
  cartaoId?: string | null;
  essencialidade: Essencialidade;
  recorrente: boolean;
  parcela?: Parcela | null;
}

export interface Mes {
  userId: string;
  key: string; // "AAAA-MM", ex.: "2026-09"
  saldoInicial: number;
  receitas: Receita[];
  despesas: Despesa[];
  criadoEm: string;
  atualizadoEm: string;
}

export interface Cartao {
  id: string;
  userId: string;
  nome: string;
  bandeira?: string;
  limite: number;
  diaFechamento: number;
  diaVencimento: number;
}

export interface CompromissoFuturo {
  id: string;
  userId: string;
  descricao: string;
  valorParcela: number;
  parcelasRestantes: number;
  categoria: string;
  cartaoId?: string | null;
}

export interface Usuario {
  id: string;
  login: string;
  nomeExibicao: string;
}
