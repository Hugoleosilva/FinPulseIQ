/** Sistema privado: só estes apelidos podem criar conta. */
export const LOGINS_PERMITIDOS = ["hugo", "angelica", "thais"] as const;
export type LoginPermitido = (typeof LOGINS_PERMITIDOS)[number];

export function loginPermitido(login: string): login is LoginPermitido {
  return (LOGINS_PERMITIDOS as readonly string[]).includes(login);
}

/**
 * Quem cada pessoa pode ADMINISTRAR (ver e editar), além da própria área.
 * Hugo cuida das finanças do casal; Angélica e Thaís só mexem na própria.
 */
export const PODE_EDITAR: Record<string, LoginPermitido | null> = {
  hugo: "angelica",
  angelica: null,
  thais: null,
};

export const NOME_COOKIE_AREA = "area";
