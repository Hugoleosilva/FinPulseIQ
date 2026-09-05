"use server";

import { revalidatePath } from "next/cache";
import { exigirSessao } from "@/lib/dal";
import {
  salvarCartao,
  apagarCartao,
  salvarCompromisso,
  apagarCompromisso,
} from "@/lib/repo";
import { cartaoSchema, compromissoSchema } from "@/lib/validacao";
import { camposDeErro, type EstadoForm } from "@/lib/forms";

function revalida() {
  revalidatePath("/cartoes");
}

export async function salvarCartaoAction(
  _prev: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const { userId } = await exigirSessao();
  const parsed = cartaoSchema.safeParse({
    id: formData.get("id") || undefined,
    nome: formData.get("nome"),
    bandeira: formData.get("bandeira") || undefined,
    limite: formData.get("limite"),
    diaFechamento: formData.get("diaFechamento"),
    diaVencimento: formData.get("diaVencimento"),
  });
  if (!parsed.success) {
    return { ok: false, campos: camposDeErro(parsed.error) };
  }
  await salvarCartao(userId, parsed.data);
  revalida();
  return { ok: true, mensagem: "Cartão salvo." };
}

export async function apagarCartaoAction(id: string): Promise<void> {
  const { userId } = await exigirSessao();
  await apagarCartao(userId, id);
  revalida();
}

export async function salvarCompromissoAction(
  _prev: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const { userId } = await exigirSessao();
  const parsed = compromissoSchema.safeParse({
    id: formData.get("id") || undefined,
    descricao: formData.get("descricao"),
    valorParcela: formData.get("valorParcela"),
    parcelasRestantes: formData.get("parcelasRestantes"),
    categoria: formData.get("categoria"),
    cartaoId: formData.get("cartaoId") || null,
  });
  if (!parsed.success) {
    return { ok: false, campos: camposDeErro(parsed.error) };
  }
  await salvarCompromisso(userId, parsed.data);
  revalida();
  return { ok: true, mensagem: "Compromisso salvo." };
}

export async function apagarCompromissoAction(id: string): Promise<void> {
  const { userId } = await exigirSessao();
  await apagarCompromisso(userId, id);
  revalida();
}
