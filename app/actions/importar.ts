"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { exigirSessao } from "@/lib/dal";
import { getMes, salvarMes } from "@/lib/repo";
import { parsePlanilha } from "@/lib/planilha";
import type { Receita, Despesa } from "@/lib/tipos";

export type EstadoImport =
  | {
      ok: true;
      receitas: number;
      despesas: number;
      erros: { linha: number; mensagem: string }[];
    }
  | { ok: false; erro: string }
  | null;

export async function importarPlanilha(
  key: string,
  _prev: EstadoImport,
  formData: FormData,
): Promise<EstadoImport> {
  const { userId } = await exigirSessao();

  const arquivo = formData.get("planilha");
  if (!(arquivo instanceof File) || arquivo.size === 0) {
    return { ok: false, erro: "Escolha um arquivo .xlsx ou .csv." };
  }
  if (arquivo.size > 5 * 1024 * 1024) {
    return { ok: false, erro: "Arquivo muito grande (limite de 5 MB)." };
  }

  let resultado;
  try {
    resultado = await parsePlanilha(arquivo);
  } catch {
    return {
      ok: false,
      erro: "Não consegui ler o arquivo. Ele está no formato Excel (.xlsx) ou CSV?",
    };
  }

  const novasReceitas: Receita[] = [];
  const novasDespesas: Despesa[] = [];
  for (const item of resultado.itens) {
    if (item.tipo === "receita" && item.receita) {
      novasReceitas.push({ id: randomUUID(), ...item.receita });
    } else if (item.tipo === "despesa" && item.despesa) {
      novasDespesas.push({ id: randomUUID(), ...item.despesa });
    }
  }

  if (novasReceitas.length === 0 && novasDespesas.length === 0) {
    return {
      ok: false,
      erro:
        resultado.erros[0]?.mensagem ??
        "Nenhuma linha válida encontrada na planilha.",
    };
  }

  const mes = await getMes(userId, key);
  await salvarMes(userId, key, {
    receitas: [...mes.receitas, ...novasReceitas],
    despesas: [...mes.despesas, ...novasDespesas],
  });

  revalidatePath(`/mes/${key}`);
  revalidatePath(`/mes/${key}/lancar`);
  revalidatePath(`/mes/${key}/diagnostico`);

  return {
    ok: true,
    receitas: novasReceitas.length,
    despesas: novasDespesas.length,
    erros: resultado.erros,
  };
}
