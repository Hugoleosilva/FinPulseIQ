import { SignJWT, jwtVerify } from "jose";

export const DIAS_SESSAO = 30;

function chave(): Uint8Array {
  const segredo = process.env.AUTH_SECRET;
  if (!segredo || segredo.length < 16) {
    throw new Error(
      "Falta a variável AUTH_SECRET (mínimo 16 caracteres). Gere uma com: openssl rand -base64 32",
    );
  }
  return new TextEncoder().encode(segredo);
}

export interface SessaoPayload {
  userId: string;
  login: string;
  nome: string;
}

export async function assinarSessao(payload: SessaoPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${DIAS_SESSAO}d`)
    .sign(chave());
}

export async function lerToken(
  token: string | undefined | null,
): Promise<SessaoPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, chave(), {
      algorithms: ["HS256"],
    });
    if (
      typeof payload.userId === "string" &&
      typeof payload.login === "string" &&
      typeof payload.nome === "string"
    ) {
      return { userId: payload.userId, login: payload.login, nome: payload.nome };
    }
    return null;
  } catch {
    return null;
  }
}
