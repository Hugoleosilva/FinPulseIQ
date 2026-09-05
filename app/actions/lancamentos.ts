"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { exigirSessao } from "@/lib/dal";
import { getMes, salvarMes } from "@/lib/repo";
import {
  receitaSchema,
  despesaSchema,
  saldoInicialSchema,
} from "@/lib/validacao";
import { camposDeErro, primeiroErroGeral, type EstadoForm } from "@/lib/forms";
import type { Despesa, Receita } from "@/lib/tipos";

function revalida(key: string) {
  revalidatePath(`/mes/${key}`);
  revalidatePath(`/mes/${key}/lancar`);
  revalidatePath(`/mes/${key}/diagnostico`);
  revalidatePath("/historico");
}

export async function definirSaldoInicial(
  key: string,
  _prev: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const { userId } = await exigirSessao();
  const parsed = saldoInicialSchema.safeParse({
    saldoInicial: formData.get("saldoInicial"),
  });
  if (!parsed.success) {
    return { ok: false, erro: primeiroErroGeral(parsed.error) };
  }
  await salvarMes(userId, key, { saldoInicial: parsed.data.saldoInicial });
  revalida(key);
  return { ok: true, mensagem: "Saldo inicial salvo." };
}

export async function adicionarReceita(
  key: string,
  _prev: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const { userId } = await exigirSessao();
  const parsed = receitaSchema.safeParse({
    descricao: formData.get("descricao"),
    valor: formData.get("valor"),
    dia: formData.get("dia"),
    tipo: formData.get("tipo"),
  });
  if (!parsed.success) {
    return { ok: false, campos: camposDeErro(parsed.error) };
  }
  const mes = await getMes(userId, key);
  const nova: Receita = { id: randomUUID(), ...parsed.data };
  await salvarMes(userId, key, { receitas: [...mes.receitas, nova] });
  revalida(key);
  return { ok: true, mensagem: "Receita adicionada." };
}

export async function removerReceita(key: string, id: string): Promise<void> {
  const { userId } = await exigirSessao();
  const mes = await getMes(userId, key);
  await salvarMes(userId, key, {
    receitas: mes.receitas.filter((r) => r.id !== id),
  });
  revalida(key);
}

export async function adicionarDespesa(
  key: string,
  _prev: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const { userId } = await exigirSessao();
  const parsed = despesaSchema.safeParse({
    descricao: formData.get("descricao"),
    valor: formData.get("valor"),
    dia: formData.get("dia"),
    categoria: formData.get("categoria"),
    subcategoria: formData.get("subcategoria"),
    meioPagamento: formData.get("meioPagamento"),
    cartaoId: formData.get("cartaoId") || null,
    essencialidade: formData.get("essencialidade"),
    parcelaAtual: formData.get("parcelaAtual") || undefined,
    parcelaTotal: formData.get("parcelaTotal") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, campos: camposDeErro(parsed.error) };
  }

  const d = parsed.data;
  const recorrente = formData.get("recorrente") === "on";

  let parcela: Despesa["parcela"] = null;
  if (
    d.parcelaTotal &&
    d.parcelaTotal > 1 &&
    d.parcelaAtual &&
    d.parcelaAtual >= 1 &&
    d.parcelaAtual <= d.parcelaTotal
  ) {
    parcela = { atual: d.parcelaAtual, total: d.parcelaTotal };
  }

  const mes = await getMes(userId, key);
  const nova: Despesa = {
    id: randomUUID(),
    descricao: d.descricao,
    valor: d.valor,
    dia: d.dia,
    categoria: d.categoria,
    subcategoria: d.subcategoria,
    meioPagamento: d.meioPagamento,
    cartaoId: d.meioPagamento === "cartao" ? d.cartaoId ?? null : null,
    essencialidade: d.essencialidade,
    recorrente,
    parcela,
  };
  await salvarMes(userId, key, { despesas: [...mes.despesas, nova] });
  revalida(key);
  return { ok: true, mensagem: "Gasto adicionado." };
}

export async function removerDespesa(key: string, id: string): Promise<void> {
  const { userId } = await exigirSessao();
  const mes = await getMes(userId, key);
  await salvarMes(userId, key, {
    despesas: mes.despesas.filter((d) => d.id !== id),
  });
  revalida(key);
}
