import "server-only";
import { usuarioAtivo, type UsuarioAtivo } from "./contexto";

/**
 * Camada de acesso. Devolve o usuário "ativo" — normalmente a própria pessoa,
 * mas pode ser o parceiro quando ela está administrando a área dele. Os campos
 * userId/login/nome apontam para os dados corretos.
 */
export async function exigirSessao(): Promise<UsuarioAtivo> {
  return usuarioAtivo();
}
