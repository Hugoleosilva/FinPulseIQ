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
import { logAlteracao } from "@/lib/atividade";
import { lerHoleritePDF, type HoleriteLido } from "@/lib/holerite";
import type { Despesa, Receita, ItemHolerite } from "@/lib/tipos";

async function revalida(key: string, acao: string) {
  revalidatePath(`/mes/${key}`);
  revalidatePath(`/mes/${key}/lancar`);
  revalidatePath(`/mes/${key}/diagnostico`);
  revalidatePath("/historico");
  await logAlteracao(`${acao} (${key})`);
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
  await revalida(key, "ajustou o saldo inicial");
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
  await revalida(key, "adicionou uma receita");
  return { ok: true, mensagem: "Receita adicionada." };
}

export async function editarReceita(
  key: string,
  id: string,
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
  const alvo = mes.receitas.find((r) => r.id === id);
  if (!alvo) return { ok: false, erro: "Receita não encontrada." };
  const receitas = mes.receitas.map((r) =>
    r.id === id ? { ...r, ...parsed.data, detalhe: null } : r,
  );
  await salvarMes(userId, key, { receitas });
  await revalida(key, "editou uma receita");
  return { ok: true, mensagem: "Receita atualizada." };
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

function montarSalario(
  formData: FormData,
): { ok: true; receita: Omit<Receita, "id"> } | { ok: false; estado: EstadoForm } {
  const proventos = lerItens(formData, "provento");
  const descontos = lerItens(formData, "desconto");

  if (proventos.length === 0) {
    return {
      ok: false,
      estado: { ok: false, erro: "Informe pelo menos um provento (o salário)." },
    };
  }

  const somaProventos = proventos.reduce((a, i) => a + i.valor, 0);
  const somaDescontos = descontos.reduce((a, i) => a + i.valor, 0);
  const liquido = Math.round((somaProventos - somaDescontos) * 100) / 100;

  if (liquido <= 0) {
    return {
      ok: false,
      estado: {
        ok: false,
        erro:
          "Os descontos ficaram maiores que os proventos. Confira os valores.",
      },
    };
  }

  const dia = Number(formData.get("dia")) || 5;
  const nome = String(formData.get("descricao") || "").trim() || "Salário";

  return {
    ok: true,
    receita: {
      descricao: nome.endsWith("(líquido)") ? nome : `${nome} (líquido)`,
      valor: liquido,
      dia: Math.min(31, Math.max(1, dia)),
      tipo: "fixa",
      detalhe: { proventos, descontos },
    },
  };
}

export async function adicionarSalario(
  key: string,
  _prev: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const { userId } = await exigirSessao();
  const res = montarSalario(formData);
  if (!res.ok) return res.estado;

  const mes = await getMes(userId, key);
  await salvarMes(userId, key, {
    receitas: [...mes.receitas, { id: randomUUID(), ...res.receita }],
  });
  await revalida(key, "registrou o salário");
  return { ok: true, mensagem: "Salário registrado." };
}

export async function editarSalario(
  key: string,
  id: string,
  _prev: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const { userId } = await exigirSessao();
  const res = montarSalario(formData);
  if (!res.ok) return res.estado;

  const mes = await getMes(userId, key);
  if (!mes.receitas.some((r) => r.id === id)) {
    return { ok: false, erro: "Receita não encontrada." };
  }
  const receitas = mes.receitas.map((r) =>
    r.id === id ? { id, ...res.receita } : r,
  );
  await salvarMes(userId, key, { receitas });
  await revalida(key, "editou o salário");
  return { ok: true, mensagem: "Salário atualizado." };
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
    .filter((d) => {
      if (existeDespesa(d)) return false;
      if (d.natureza === "fixa") return true;
      if (d.natureza === "parcelada" && d.parcela)
        return d.parcela.atual < d.parcela.total;
      return false;
    })
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
  await revalida(key, "copiou lançamentos do mês anterior");
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
  await revalida(key, "apagou uma receita");
}

function camposDaDespesa(
  formData: FormData,
):
  | { ok: true; campos: Omit<Despesa, "id"> }
  | { ok: false; estado: EstadoForm } {
  const parsed = despesaSchema.safeParse({
    descricao: formData.get("descricao"),
    valor: formData.get("valor"),
    dia: formData.get("dia"),
    categoria: formData.get("categoria"),
    subcategoria: formData.get("subcategoria"),
    meioPagamento: formData.get("meioPagamento"),
    cartaoId: formData.get("cartaoId") || null,
    essencialidade: formData.get("essencialidade"),
    natureza: formData.get("natureza") || "normal",
    parcelaAtual: formData.get("parcelaAtual") || undefined,
    parcelaTotal: formData.get("parcelaTotal") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, estado: { ok: false, campos: camposDeErro(parsed.error) } };
  }
  const d = parsed.data;

  let parcela: Despesa["parcela"] = null;
  if (
    d.natureza === "parcelada" &&
    d.parcelaTotal &&
    d.parcelaTotal > 1 &&
    d.parcelaAtual &&
    d.parcelaAtual >= 1 &&
    d.parcelaAtual <= d.parcelaTotal
  ) {
    parcela = { atual: d.parcelaAtual, total: d.parcelaTotal };
  }
  const natureza =
    d.natureza === "parcelada" && !parcela ? "normal" : d.natureza;

  return {
    ok: true,
    campos: {
      descricao: d.descricao,
      valor: d.valor,
      dia: d.dia,
      categoria: d.categoria,
      subcategoria: d.subcategoria,
      meioPagamento: d.meioPagamento,
      cartaoId: d.meioPagamento === "cartao" ? d.cartaoId ?? null : null,
      essencialidade: d.essencialidade,
      natureza,
      recorrente: natureza === "fixa",
      parcela,
    },
  };
}

export async function adicionarDespesa(
  key: string,
  _prev: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const { userId } = await exigirSessao();
  const res = camposDaDespesa(formData);
  if (!res.ok) return res.estado;

  const mes = await getMes(userId, key);
  const nova: Despesa = { id: randomUUID(), ...res.campos };
  await salvarMes(userId, key, { despesas: [...mes.despesas, nova] });
  await revalida(key, "adicionou um gasto");
  return { ok: true, mensagem: "Gasto adicionado." };
}

export async function editarDespesa(
  key: string,
  id: string,
  _prev: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const { userId } = await exigirSessao();
  const res = camposDaDespesa(formData);
  if (!res.ok) return res.estado;

  const mes = await getMes(userId, key);
  if (!mes.despesas.some((x) => x.id === id)) {
    return { ok: false, erro: "Gasto não encontrado." };
  }
  const despesas = mes.despesas.map((x) =>
    x.id === id ? { id, ...res.campos } : x,
  );
  await salvarMes(userId, key, { despesas });
  await revalida(key, "editou um gasto");
  return { ok: true, mensagem: "Gasto atualizado." };
}

export async function removerDespesa(key: string, id: string): Promise<void> {
  const { userId } = await exigirSessao();
  const mes = await getMes(userId, key);
  await salvarMes(userId, key, {
    despesas: mes.despesas.filter((d) => d.id !== id),
  });
  await revalida(key, "apagou um gasto");
}
