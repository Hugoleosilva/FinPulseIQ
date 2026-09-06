import "server-only";
import { randomUUID } from "node:crypto";
import { col } from "./db";
import type { Mes, Cartao, CompromissoFuturo, Receita, Despesa } from "./tipos";

// ---------------------------------------------------------------------------
// Meses
// ---------------------------------------------------------------------------

type MesDoc = Mes;

/** Garante o campo `natureza` em despesas gravadas antes dessa opção existir. */
function normalizaDespesa(d: Despesa): Despesa {
  if (d.natureza) return d;
  const natureza: Despesa["natureza"] = d.parcela
    ? "parcelada"
    : d.recorrente
      ? "fixa"
      : "normal";
  return { ...d, natureza };
}

function normalizaMes(userId: string, d: Partial<MesDoc> & { key: string }): Mes {
  return {
    userId,
    key: d.key,
    saldoInicial: d.saldoInicial ?? 0,
    receitas: d.receitas ?? [],
    despesas: (d.despesas ?? []).map(normalizaDespesa),
    criadoEm: d.criadoEm ?? "",
    atualizadoEm: d.atualizadoEm ?? "",
  };
}

export async function getMes(userId: string, key: string): Promise<Mes> {
  const c = await col<MesDoc>("months");
  const doc = await c.findOne({ userId, key });
  if (doc) return normalizaMes(userId, doc);
  return {
    userId,
    key,
    saldoInicial: 0,
    receitas: [],
    despesas: [],
    criadoEm: "",
    atualizadoEm: "",
  };
}

export async function listarMeses(userId: string): Promise<Mes[]> {
  const c = await col<MesDoc>("months");
  const docs = await c.find({ userId }).sort({ key: 1 }).toArray();
  return docs.map((d) => normalizaMes(userId, d));
}

/** Meses anteriores a `key`, do mais antigo para o mais novo. */
export async function historicoAntes(
  userId: string,
  key: string,
): Promise<Mes[]> {
  const todos = await listarMeses(userId);
  return todos.filter((m) => m.key < key);
}

interface PatchMes {
  saldoInicial?: number;
  receitas?: Receita[];
  despesas?: Despesa[];
}

export async function salvarMes(
  userId: string,
  key: string,
  patch: PatchMes,
): Promise<void> {
  const c = await col<MesDoc>("months");
  const agora = new Date().toISOString();
  await c.updateOne(
    { userId, key },
    {
      $set: { ...patch, atualizadoEm: agora },
      $setOnInsert: { userId, key, criadoEm: agora },
    },
    { upsert: true },
  );
}

// ---------------------------------------------------------------------------
// Cartões
// ---------------------------------------------------------------------------

export async function listarCartoes(userId: string): Promise<Cartao[]> {
  const c = await col<Cartao>("cards");
  const docs = await c.find({ userId }).sort({ nome: 1 }).toArray();
  return docs.map((d) => ({
    id: d.id,
    userId,
    nome: d.nome,
    bandeira: d.bandeira,
    limite: d.limite,
    diaFechamento: d.diaFechamento,
    diaVencimento: d.diaVencimento,
    compartilhado: d.compartilhado ?? false,
    titularFatura: d.titularFatura ?? "",
  }));
}

export async function salvarCartao(
  userId: string,
  dados: Omit<Cartao, "id" | "userId"> & { id?: string },
): Promise<void> {
  const c = await col<Cartao>("cards");
  const id = dados.id || randomUUID();
  await c.updateOne(
    { userId, id },
    {
      $set: {
        nome: dados.nome,
        bandeira: dados.bandeira,
        limite: dados.limite,
        diaFechamento: dados.diaFechamento,
        diaVencimento: dados.diaVencimento,
        compartilhado: dados.compartilhado ?? false,
        titularFatura: dados.compartilhado ? dados.titularFatura ?? "" : "",
      },
      $setOnInsert: { userId, id },
    },
    { upsert: true },
  );
}

export async function apagarCartao(userId: string, id: string): Promise<void> {
  const c = await col<Cartao>("cards");
  await c.deleteOne({ userId, id });
}

// ---------------------------------------------------------------------------
// Compromissos futuros
// ---------------------------------------------------------------------------

export async function listarCompromissos(
  userId: string,
): Promise<CompromissoFuturo[]> {
  const c = await col<CompromissoFuturo>("compromissos");
  const docs = await c.find({ userId }).sort({ descricao: 1 }).toArray();
  return docs.map((d) => ({
    id: d.id,
    userId,
    descricao: d.descricao,
    valorParcela: d.valorParcela,
    parcelasRestantes: d.parcelasRestantes,
    categoria: d.categoria,
    cartaoId: d.cartaoId ?? null,
  }));
}

export async function salvarCompromisso(
  userId: string,
  dados: Omit<CompromissoFuturo, "id" | "userId"> & { id?: string },
): Promise<void> {
  const c = await col<CompromissoFuturo>("compromissos");
  const id = dados.id || randomUUID();
  await c.updateOne(
    { userId, id },
    {
      $set: {
        descricao: dados.descricao,
        valorParcela: dados.valorParcela,
        parcelasRestantes: dados.parcelasRestantes,
        categoria: dados.categoria,
        cartaoId: dados.cartaoId ?? null,
      },
      $setOnInsert: { userId, id },
    },
    { upsert: true },
  );
}

export async function apagarCompromisso(
  userId: string,
  id: string,
): Promise<void> {
  const c = await col<CompromissoFuturo>("compromissos");
  await c.deleteOne({ userId, id });
}

// ---------------------------------------------------------------------------
// Usuários
// ---------------------------------------------------------------------------

interface UserDoc {
  id: string;
  login: string;
  nomeExibicao: string;
  senhaHash: string;
  criadoEm: string;
}

export async function buscarUsuarioPorLogin(
  login: string,
): Promise<UserDoc | null> {
  const c = await col<UserDoc>("users");
  return c.findOne({ login: login.toLowerCase() });
}

export async function criarUsuario(dados: {
  login: string;
  nomeExibicao: string;
  senhaHash: string;
}): Promise<UserDoc> {
  const c = await col<UserDoc>("users");
  const doc: UserDoc = {
    id: randomUUID(),
    login: dados.login.toLowerCase(),
    nomeExibicao: dados.nomeExibicao,
    senhaHash: dados.senhaHash,
    criadoEm: new Date().toISOString(),
  };
  await c.insertOne(doc);
  return doc;
}

/** Soma das parcelas mensais que continuam nos próximos meses. */
export function compromissoMensal(compromissos: CompromissoFuturo[]): number {
  return compromissos
    .filter((c) => c.parcelasRestantes > 0)
    .reduce((acc, c) => acc + c.valorParcela, 0);
}
