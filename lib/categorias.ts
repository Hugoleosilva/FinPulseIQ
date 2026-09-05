import type { Essencialidade } from "./tipos";

export interface CategoriaDef {
  nome: string;
  emoji: string;
  /** Teto de redução: quanto, no máximo, o sistema estima que dá para cortar. */
  tetoReducao: number;
  essencialidadePadrao: Essencialidade;
  ajuda: string;
  subcategorias: string[];
  /** Subcategorias consideradas "supérfluas" dentro de uma categoria essencial
   *  (ex.: restaurante/delivery dentro de Alimentação). Usado nos vazamentos. */
  subcategoriasForaDeCasa?: string[];
}

export const CATEGORIAS: CategoriaDef[] = [
  {
    nome: "Moradia",
    emoji: "🏠",
    tetoReducao: 0.1,
    essencialidadePadrao: "essencial",
    ajuda: "Tudo ligado à casa onde você mora.",
    subcategorias: [
      "Aluguel",
      "Financiamento",
      "Condomínio",
      "Luz",
      "Água",
      "Gás",
      "Internet",
      "IPTU",
      "Manutenção / reparos",
    ],
  },
  {
    nome: "Alimentação",
    emoji: "🍽️",
    tetoReducao: 0.35,
    essencialidadePadrao: "reduzivel",
    ajuda: "Comida em geral. Separe o que é mercado do que é comer fora.",
    subcategorias: [
      "Mercado",
      "Feira / hortifruti",
      "Padaria",
      "Restaurante",
      "Delivery (iFood, etc.)",
      "Lanches / fast-food",
      "Café / bar",
    ],
    subcategoriasForaDeCasa: [
      "Restaurante",
      "Delivery (iFood, etc.)",
      "Lanches / fast-food",
      "Café / bar",
    ],
  },
  {
    nome: "Transporte",
    emoji: "🚗",
    tetoReducao: 0.2,
    essencialidadePadrao: "essencial",
    ajuda: "Como você se locomove no dia a dia.",
    subcategorias: [
      "Combustível",
      "Aplicativo (Uber / 99)",
      "Ônibus / Metrô",
      "Estacionamento / pedágio",
      "Manutenção",
      "Seguro do carro",
      "IPVA / licenciamento",
    ],
  },
  {
    nome: "Saúde",
    emoji: "💊",
    tetoReducao: 0.1,
    essencialidadePadrao: "essencial",
    ajuda: "Cuidados com o corpo e a mente.",
    subcategorias: [
      "Plano de saúde",
      "Farmácia / remédios",
      "Consultas",
      "Exames",
      "Dentista",
      "Terapia",
      "Academia",
    ],
  },
  {
    nome: "Educação",
    emoji: "📚",
    tetoReducao: 0.1,
    essencialidadePadrao: "essencial",
    ajuda: "Estudos seus ou de dependentes.",
    subcategorias: [
      "Escola / faculdade",
      "Curso",
      "Livros",
      "Material escolar",
    ],
  },
  {
    nome: "Assinaturas",
    emoji: "📺",
    tetoReducao: 0.6,
    essencialidadePadrao: "reduzivel",
    ajuda: "Serviços que cobram todo mês automaticamente.",
    subcategorias: [
      "Streaming (Netflix, etc.)",
      "Música (Spotify, etc.)",
      "Aplicativos / assinaturas digitais",
      "Armazenamento na nuvem",
      "Revistas / jornais",
      "Clube de assinatura",
      "Outros",
    ],
  },
  {
    nome: "Compras",
    emoji: "🛍️",
    tetoReducao: 0.4,
    essencialidadePadrao: "reduzivel",
    ajuda: "Coisas que você compra de vez em quando.",
    subcategorias: [
      "Roupas",
      "Calçados",
      "Eletrônicos",
      "Casa / decoração",
      "Beleza / cosméticos",
      "Presentes",
      "Outros",
    ],
  },
  {
    nome: "Lazer",
    emoji: "🎬",
    tetoReducao: 0.4,
    essencialidadePadrao: "reduzivel",
    ajuda: "Diversão e descanso.",
    subcategorias: [
      "Cinema / teatro / shows",
      "Bar / balada",
      "Viagem",
      "Passeios",
      "Jogos",
      "Hobbies",
    ],
  },
  {
    nome: "Contas e serviços",
    emoji: "🧾",
    tetoReducao: 0.15,
    essencialidadePadrao: "essencial",
    ajuda: "Contas fixas e serviços contratados.",
    subcategorias: [
      "Telefone / celular",
      "Seguro de vida",
      "Empréstimo / consórcio",
      "Taxas bancárias",
      "Impostos",
      "Contador / advogado",
    ],
  },
  {
    nome: "Família e filhos",
    emoji: "👨‍👩‍👧",
    tetoReducao: 0.15,
    essencialidadePadrao: "essencial",
    ajuda: "Gastos com filhos e outros dependentes.",
    subcategorias: [
      "Mensalidade escola",
      "Material escolar",
      "Fardamento / uniforme escolar",
      "Passeios e excursões escolares",
      "Atividades extracurriculares (reforço, música, esporte)",
      "Creche / babá",
      "Mesada",
      "Roupas das crianças",
      "Brinquedos",
      "Pensão",
      "Outros",
    ],
  },
  {
    nome: "Pets",
    emoji: "🐶",
    tetoReducao: 0.2,
    essencialidadePadrao: "reduzivel",
    ajuda: "Gastos com animais de estimação.",
    subcategorias: ["Ração", "Veterinário", "Banho e tosa", "Acessórios"],
  },
  {
    nome: "Doações e presentes",
    emoji: "🎁",
    tetoReducao: 0.5,
    essencialidadePadrao: "reduzivel",
    ajuda: "Dinheiro que você dá a pessoas ou instituições.",
    subcategorias: ["Doações", "Presentes", "Igreja / dízimo"],
  },
  {
    nome: "Fatura de cartão (sem detalhar)",
    emoji: "💳",
    tetoReducao: 0.15,
    essencialidadePadrao: "reduzivel",
    ajuda:
      "Use só quando não quiser detalhar as compras do cartão. O ideal é lançar cada compra na categoria certa e marcar a forma de pagamento como 'Cartão de crédito'.",
    subcategorias: [
      "Fatura do mês",
      "Anuidade",
      "Juros / rotativo",
      "IOF",
    ],
  },
  {
    nome: "Outros",
    emoji: "❓",
    tetoReducao: 0.3,
    essencialidadePadrao: "reduzivel",
    ajuda: "Quando nenhuma categoria acima serve.",
    subcategorias: ["Não sei classificar", "Diversos", "Emergências"],
  },
];

export const NOMES_CATEGORIAS = CATEGORIAS.map((c) => c.nome);

export function getCategoria(nome: string): CategoriaDef | undefined {
  return CATEGORIAS.find((c) => c.nome === nome);
}

export function emojiCategoria(nome: string): string {
  return getCategoria(nome)?.emoji ?? "•";
}

/** Peso de "quanto dá para mexer" por classificação de necessidade. */
export const PESO_ESSENCIALIDADE: Record<Essencialidade, number> = {
  essencial: 0, // não sugerimos cortar o essencial
  reduzivel: 0.5,
  desnecessario: 0.9,
};

export const ROTULO_ESSENCIALIDADE: Record<Essencialidade, string> = {
  essencial: "Essencial",
  reduzivel: "Pode reduzir",
  desnecessario: "Dá para viver sem",
};

export const ROTULO_MEIO_PAGAMENTO: Record<string, string> = {
  dinheiro: "Dinheiro",
  debito: "Cartão de débito",
  pix: "Pix / transferência",
  cartao: "Cartão de crédito",
  boleto: "Boleto",
};
