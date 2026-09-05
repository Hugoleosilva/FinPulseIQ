import "server-only";
import { notFound } from "next/navigation";
import { exigirSessao } from "./dal";
import { buscarUsuarioPorLogin } from "./repo";

/** Sistema privado: só estes dois apelidos podem criar conta. */
export const LOGINS_PERMITIDOS = ["hugo", "angelica"] as const;
export type LoginPermitido = (typeof LOGINS_PERMITIDOS)[number];

export function loginPermitido(login: string): login is LoginPermitido {
  return (LOGINS_PERMITIDOS as readonly string[]).includes(login);
}

/** Quem cada pessoa pode VER (somente leitura), além da própria área. */
export const PODE_VER: Record<string, LoginPermitido | null> = {
  hugo: "angelica",
  angelica: null,
};

export interface AlvoLeitura {
  userId: string;
  nome: string;
  login: string;
}

/**
 * Confere se a pessoa logada pode ver (somente leitura) a área de `loginAlvo`.
 * Redireciona para 404 se não puder.
 */
export async function exigirAcessoLeitura(
  loginAlvo: string,
): Promise<AlvoLeitura> {
  const sessao = await exigirSessao();
  const permitido = PODE_VER[sessao.login];
  if (!permitido || permitido !== loginAlvo.toLowerCase()) notFound();

  const u = await buscarUsuarioPorLogin(loginAlvo);
  if (!u) notFound();
  return { userId: u.id, nome: u.nomeExibicao, login: u.login };
}

/** Login que a pessoa logada pode acompanhar, se houver. */
export async function parceiroVisivel(): Promise<LoginPermitido | null> {
  const sessao = await exigirSessao();
  return PODE_VER[sessao.login] ?? null;
}
