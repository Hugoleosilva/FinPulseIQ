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
import { deslocaMes } from "@/lib/format";
import { lerHoleritePDF, type HoleriteLido } from "@/lib/holerite";
import type { Despesa, Receita, ItemHolerite } from "@/lib/tipos";

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

export type EstadoHolerite =
  | { ok: true; dados: HoleriteLido }
  | { ok: false; erro: string };

/** Lê um PDF de holerite e devolve os itens encontrados (não salva nada). */
export async function analisarHolerite(
  formData: FormData,
): Promise<EstadoHolerite> {
  await exigirSessao();
  const arquivo = formData.get("arquivo");
  if (!(arquivo instanceof File) || arquivo.size === 0) {
    return { ok: false, erro: "Escolha o arquivo do holerite." };
  }
  if (arquivo.type !== "application/pdf") {
    return {
      ok: false,
      erro: "A leitura automática funciona só com PDF (não com foto).",
    };
  }
  if (arquivo.size > 5 * 1024 * 1024) {
    return { ok: false, erro: "Arquivo muito grande (limite de 5 MB)." };
  }
  const dados = await lerHoleritePDF(arquivo);
  if (!dados.textoOk) {
    return {
      ok: false,
      erro:
        "Não consegui ler o texto do PDF (parece ser uma imagem/escaneado). Preencha os campos à mão.",
    };
  }
  return { ok: true, dados };
}

function lerItens(
  formData: FormData,
  prefixo: string,
): ItemHolerite[] {
  const descricoes = formData.getAll(`${prefixo}Descricao`).map(String);
  const valores = formData.getAll(`${prefixo}Valor`).map(String);
  const out: ItemHolerite[] = [];
  for (let i = 0; i < descricoes.length; i++) {
    const descricao = descricoes[i]?.trim();
    const valor = Number(
      (valores[i] ?? "")
        .trim()
        .replace(/\s/g, "")
        .replace(/^r\$/i, "")
        .replace(/\./g, "")
        .replace(",", "."),
    );
    if (descricao && Number.isFinite(valor) && valor > 0) {
      out.push({ descricao, valor: Math.round(valor * 100) / 100 });
    }
  }
  return out;
}

export async function adicionarSalario(
  key: string,
  _prev: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const { userId } = await exigirSessao();

  const proventos = lerItens(formData, "provento");
  const descontos = lerItens(formData, "desconto");

  if (proventos.length === 0) {
    return { ok: false, erro: "Informe pelo menos um provento (o salário)." };
  }

  const somaProventos = proventos.reduce((a, i) => a + i.valor, 0);
  const somaDescontos = descontos.reduce((a, i) => a + i.valor, 0);
  const liquido = Math.round((somaProventos - somaDescontos) * 100) / 100;

  if (liquido <= 0) {
    return {
      ok: false,
      erro: "Os descontos ficaram maiores que os proventos. Confira os valores.",
    };
  }

  const dia = Number(formData.get("dia")) || 5;
  const descricao = String(formData.get("descricao") || "").trim() || "Salário";

  const nova: Receita = {
    id: randomUUID(),
    descricao: `${descricao} (líquido)`,
    valor: liquido,
    dia: Math.min(31, Math.max(1, dia)),
    tipo: "fixa",
    detalhe: { proventos, descontos },
  };

  const mes = await getMes(userId, key);
  await salvarMes(userId, key, { receitas: [...mes.receitas, nova] });
  revalida(key);
  return { ok: true, mensagem: "Salário registrado." };
}

export type EstadoCopia =
  | { ok: true; receitas: number; despesas: number }
  | { ok: false; erro: string }
  | null;

/** Copia receitas fixas e despesas recorrentes do mês anterior para este mês. */
export async function copiarRecorrentes(
  key: string,
): Promise<EstadoCopia> {
  const { userId } = await exigirSessao();
  const anterior = deslocaMes(key, -1);

  const [mes, mesAnt] = await Promise.all([
    getMes(userId, key),
    getMes(userId, anterior),
  ]);

  const existeReceita = (r: Receita) =>
    mes.receitas.some(
      (x) =>
        x.descricao.trim().toLowerCase() === r.descricao.trim().toLowerCase() &&
        Math.abs(x.valor - r.valor) < 0.01,
    );
  const existeDespesa = (d: Despesa) =>
    mes.despesas.some(
      (x) =>
        x.descricao.trim().toLowerCase() === d.descricao.trim().toLowerCase() &&
        x.categoria === d.categoria &&
        Math.abs(x.valor - d.valor) < 0.01,
    );

  const novasReceitas = mesAnt.receitas
    .filter((r) => r.tipo === "fixa" && !existeReceita(r))
    .map((r) => ({ ...r, id: randomUUID() }));

  const novasDespesas = mesAnt.despesas
    .filter((d) => d.recorrente && !existeDespesa(d))
    .map((d) => ({
      ...d,
      id: randomUUID(),
      // parcela avança um mês, se houver
      parcela: d.parcela
        ? {
            atual: Math.min(d.parcela.total, d.parcela.atual + 1),
            total: d.parcela.total,
          }
        : null,
    }));

  if (novasReceitas.length === 0 && novasDespesas.length === 0) {
    return {
      ok: false,
      erro: "Não há nada novo para copiar do mês anterior.",
    };
  }

  await salvarMes(userId, key, {
    receitas: [...mes.receitas, ...novasReceitas],
    despesas: [...mes.despesas, ...novasDespesas],
  });
  revalida(key);
  return {
    ok: true,
    receitas: novasReceitas.length,
    despesas: novasDespesas.length,
  };
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
