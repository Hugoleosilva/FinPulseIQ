"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { exigirSessao } from "@/lib/dal";
import { getMes, salvarMes, listarCartoes } from "@/lib/repo";
import { lerFaturaPDF, type FaturaLida } from "@/lib/fatura";
import { NOMES_CATEGORIAS, getCategoria } from "@/lib/categorias";
import { logAlteracao } from "@/lib/atividade";
import type { Despesa } from "@/lib/tipos";

export type EstadoFatura =
  | { ok: true; dados: FaturaLida }
  | { ok: false; erro: string };

export async function analisarFatura(
  formData: FormData,
): Promise<EstadoFatura> {
  await exigirSessao();
  const arquivo = formData.get("fatura");
  if (!(arquivo instanceof File) || arquivo.size === 0) {
    return { ok: false, erro: "Escolha o PDF da fatura." };
  }
  if (arquivo.type !== "application/pdf") {
    return { ok: false, erro: "A leitura funciona só com PDF (não com foto)." };
  }
  if (arquivo.size > 8 * 1024 * 1024) {
    return { ok: false, erro: "Arquivo muito grande (limite de 8 MB)." };
  }
  const dados = await lerFaturaPDF(arquivo);
  if (!dados.textoOk || dados.transacoes.length === 0) {
    return {
      ok: false,
      erro:
        "Não consegui ler as transações (PDF escaneado ou layout diferente). Use o valor total ou lance manualmente.",
    };
  }
  return { ok: true, dados };
}

interface LinhaConfirmada {
  descricao: string;
  valor: number;
  categoria: string;
  subcategoria: string;
  essencialidade: Despesa["essencialidade"];
  parcelaAtual?: number;
  parcelaTotal?: number;
  dia: number;
}

export type EstadoImportFatura =
  | { ok: true; quantidade: number }
  | { ok: false; erro: string }
  | null;

export async function importarFatura(
  cartaoId: string,
  key: string,
  _prev: EstadoImportFatura,
  formData: FormData,
): Promise<EstadoImportFatura> {
  const { userId } = await exigirSessao();

  const cartoes = await listarCartoes(userId);
  const cartao = cartoes.find((c) => c.id === cartaoId);
  if (!cartao) return { ok: false, erro: "Cartão não encontrado." };

  let linhas: LinhaConfirmada[];
  try {
    linhas = JSON.parse(String(formData.get("linhas") || "[]"));
  } catch {
    return { ok: false, erro: "Dados inválidos." };
  }
  linhas = linhas.filter(
    (l) =>
      l &&
      typeof l.descricao === "string" &&
      l.descricao.trim() &&
      Number.isFinite(l.valor) &&
      l.valor > 0 &&
      NOMES_CATEGORIAS.includes(l.categoria),
  );
  if (linhas.length === 0) {
    return { ok: false, erro: "Nenhuma transação marcada para importar." };
  }

  const novas: Despesa[] = linhas.map((l) => {
    const parcela =
      l.parcelaTotal && l.parcelaTotal > 1 && l.parcelaAtual && l.parcelaAtual >= 1
        ? {
            atual: Math.min(l.parcelaAtual, l.parcelaTotal),
            total: l.parcelaTotal,
          }
        : null;
    const def = getCategoria(l.categoria);
    return {
      id: randomUUID(),
      descricao: l.descricao.trim().slice(0, 80),
      valor: Math.round(l.valor * 100) / 100,
      dia: Math.min(31, Math.max(1, Math.round(l.dia) || cartao.diaVencimento)),
      categoria: l.categoria,
      subcategoria:
        l.subcategoria?.trim() || def?.subcategorias[0] || "Diversos",
      meioPagamento: "cartao",
      cartaoId,
      essencialidade: l.essencialidade || "reduzivel",
      natureza: parcela ? "parcelada" : "normal",
      recorrente: false,
      parcela,
    };
  });

  const mes = await getMes(userId, key);
  await salvarMes(userId, key, { despesas: [...mes.despesas, ...novas] });
  revalidatePath(`/mes/${key}`);
  revalidatePath(`/mes/${key}/diagnostico`);
  revalidatePath("/cartoes");
  await logAlteracao(`importou ${novas.length} gasto(s) da fatura do cartão (${key})`);
  return { ok: true, quantidade: novas.length };
}

export type EstadoTotal = { ok: boolean; erro?: string } | null;

export async function lancarFaturaTotal(
  cartaoId: string,
  key: string,
  _prev: EstadoTotal,
  formData: FormData,
): Promise<EstadoTotal> {
  const { userId } = await exigirSessao();
  const cartoes = await listarCartoes(userId);
  const cartao = cartoes.find((c) => c.id === cartaoId);
  if (!cartao) return { ok: false, erro: "Cartão não encontrado." };

  const valor = Number(
    String(formData.get("valor") || "")
      .replace(/\s/g, "")
      .replace(/^r\$/i, "")
      .replace(/\./g, "")
      .replace(",", "."),
  );
  if (!Number.isFinite(valor) || valor <= 0) {
    return { ok: false, erro: "Informe o valor da fatura." };
  }
  const abertaTxt = formData.get("aberta") === "on" ? " (em aberto)" : "";

  const nova: Despesa = {
    id: randomUUID(),
    descricao: `Fatura ${cartao.nome}${abertaTxt}`,
    valor: Math.round(valor * 100) / 100,
    dia: cartao.diaVencimento,
    categoria: "Fatura de cartão (sem detalhar)",
    subcategoria: "Fatura do mês",
    meioPagamento: "cartao",
    cartaoId,
    essencialidade: "reduzivel",
    natureza: "normal",
    recorrente: false,
    parcela: null,
  };

  const mes = await getMes(userId, key);
  await salvarMes(userId, key, { despesas: [...mes.despesas, nova] });
  revalidatePath(`/mes/${key}`);
  revalidatePath(`/mes/${key}/diagnostico`);
  revalidatePath("/cartoes");
  await logAlteracao(`lançou a fatura de um cartão (${key})`);
  return { ok: true };
}
