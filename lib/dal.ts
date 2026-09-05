import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { lerSessao, type SessaoPayload } from "./sessao";

/**
 * Camada de acesso: toda leitura/gravação de dados do usuário passa por aqui.
 * Garante que existe sessão válida e devolve o `userId` para filtrar as queries.
 */
export const exigirSessao = cache(async (): Promise<SessaoPayload> => {
  const sessao = await lerSessao();
  if (!sessao) redirect("/login");
  return sessao;
});

/** Versão que não redireciona — para telas públicas decidirem o que mostrar. */
export const sessaoOpcional = cache(async (): Promise<SessaoPayload | null> => {
  return lerSessao();
});
