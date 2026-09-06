import "server-only";
import { randomUUID } from "node:crypto";
import { col } from "./db";
import { usuarioAtivo } from "./contexto";

interface AtividadeDoc {
  id: string;
  userId: string; // de quem é a área alterada
  autor: string; // login de quem fez
  acao: string;
  quando: number;
}

interface MarcadorDoc {
  userId: string;
  chave: string;
  quando: number;
}

/**
 * Registra uma alteração feita pela PRÓPRIA pessoa na sua área.
 * Alterações feitas pelo administrador (parceiro) não são registradas —
 * o combinado é: "se eu faço, não precisa me avisar".
 */
export async function logAlteracao(acao: string): Promise<void> {
  try {
    const a = await usuarioAtivo();
    if (a.ehParceiro) return; // admin mexendo na área do outro: não notifica
    const c = await col<AtividadeDoc>("atividades");
    await c.insertOne({
      id: randomUUID(),
      userId: a.userId,
      autor: a.login,
      acao,
      quando: Date.now(),
    });
  } catch {
    // log de atividade nunca deve quebrar uma ação
  }
}

/** Quantas alterações o parceiro fez desde a última vez que você olhou a área dele. */
export async function alteracoesNaoVistas(
  euUserId: string,
  parceiroUserId: string,
): Promise<{ quantidade: number; ultima: string | null }> {
  const marc = await col<MarcadorDoc>("marcadores");
  const m = await marc.findOne({ userId: euUserId, chave: "visto_parceiro" });
  const desde = m?.quando ?? 0;

  const c = await col<AtividadeDoc>("atividades");
  const docs = await c
    .find({ userId: parceiroUserId, quando: { $gt: desde }, autor: { $ne: "" } })
    .sort({ quando: -1 })
    .limit(50)
    .toArray();

  return {
    quantidade: docs.length,
    ultima: docs[0]
      ? `${docs[0].acao} — ${new Date(docs[0].quando).toLocaleString("pt-BR")}`
      : null,
  };
}

export async function marcarParceiroVisto(euUserId: string): Promise<void> {
  const marc = await col<MarcadorDoc>("marcadores");
  await marc.updateOne(
    { userId: euUserId, chave: "visto_parceiro" },
    { $set: { quando: Date.now() } },
    { upsert: true },
  );
}
