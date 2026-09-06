import "server-only";
import { col } from "./db";

const JANELA_MS = 3 * 60 * 1000; // considera "ativo" nos últimos 3 minutos

interface PresencaDoc {
  userId: string;
  quando: number;
}

/** Marca que a pessoa está usando o sistema agora. */
export async function registrarPresenca(userId: string): Promise<void> {
  const c = await col<PresencaDoc>("presenca");
  await c.updateOne(
    { userId },
    { $set: { quando: Date.now() } },
    { upsert: true },
  );
}

export async function estaAtivo(userId: string): Promise<boolean> {
  const c = await col<PresencaDoc>("presenca");
  const doc = await c.findOne({ userId });
  return !!doc && Date.now() - doc.quando < JANELA_MS;
}

export async function limparPresenca(userId: string): Promise<void> {
  const c = await col<PresencaDoc>("presenca");
  await c.deleteOne({ userId });
}
