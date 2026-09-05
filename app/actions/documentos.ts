"use server";

import { revalidatePath } from "next/cache";
import { exigirSessao } from "@/lib/dal";
import {
  salvarDocumento,
  apagarDocumento,
  TAMANHO_MAX,
  TIPOS_ACEITOS,
} from "@/lib/arquivos";
import { documentoMetaSchema } from "@/lib/validacao";
import { camposDeErro, type EstadoForm } from "@/lib/forms";

export async function enviarDocumento(
  _prev: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const { userId } = await exigirSessao();

  const arquivo = formData.get("arquivo");
  if (!(arquivo instanceof File) || arquivo.size === 0) {
    return { ok: false, erro: "Escolha um arquivo para enviar." };
  }
  if (arquivo.size > TAMANHO_MAX) {
    return {
      ok: false,
      erro: "Arquivo muito grande. O limite é de 8 MB.",
    };
  }
  if (!TIPOS_ACEITOS[arquivo.type]) {
    return {
      ok: false,
      erro: "Formato não aceito. Envie PDF, JPG, PNG ou WEBP.",
    };
  }

  const parsed = documentoMetaSchema.safeParse({
    descricao: formData.get("descricao"),
    tipo: formData.get("tipo"),
    mesRef: formData.get("mesRef"),
    valor: formData.get("valor"),
  });
  if (!parsed.success) {
    return { ok: false, campos: camposDeErro(parsed.error) };
  }

  await salvarDocumento(userId, parsed.data, arquivo);
  revalidatePath("/cartoes");
  return { ok: true, mensagem: "Documento guardado." };
}

export async function apagarDocumentoAction(id: string): Promise<void> {
  const { userId } = await exigirSessao();
  await apagarDocumento(userId, id);
  revalidatePath("/cartoes");
}
