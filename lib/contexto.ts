import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { lerSessao } from "./sessao";
import { buscarUsuarioPorLogin } from "./repo";
import { PODE_EDITAR, NOME_COOKIE_AREA } from "./acesso";

export interface UsuarioAtivo {
  /** ID de quem os dados pertencem (pode ser o parceiro). */
  userId: string;
  login: string;
  nome: string;
  /** true quando a pessoa logada está administrando a área do parceiro. */
  ehParceiro: boolean;
  /** Identidade real de quem está logado. */
  userIdReal: string;
  loginReal: string;
  nomeReal: string;
}

/**
 * Usuário "ativo": normalmente é a própria pessoa logada, mas se ela colocou o
 * cookie de área e tem permissão, os dados são os do parceiro.
 */
export const usuarioAtivo = cache(async (): Promise<UsuarioAtivo> => {
  const sessao = await lerSessao();
  if (!sessao) redirect("/login");

  const base = {
    userIdReal: sessao.userId,
    loginReal: sessao.login,
    nomeReal: sessao.nome,
  };

  const area = (await cookies()).get(NOME_COOKIE_AREA)?.value?.toLowerCase();
  if (area && area !== sessao.login && PODE_EDITAR[sessao.login] === area) {
    const parceiro = await buscarUsuarioPorLogin(area);
    if (parceiro) {
      return {
        ...base,
        userId: parceiro.id,
        login: parceiro.login,
        nome: parceiro.nomeExibicao,
        ehParceiro: true,
      };
    }
  }

  return {
    ...base,
    userId: sessao.userId,
    login: sessao.login,
    nome: sessao.nome,
    ehParceiro: false,
  };
});

/** Login do parceiro que a pessoa logada pode administrar, se houver. */
export async function parceiroAdministravel(): Promise<string | null> {
  const sessao = await lerSessao();
  if (!sessao) return null;
  return PODE_EDITAR[sessao.login] ?? null;
}
