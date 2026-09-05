import "server-only";
import { cookies } from "next/headers";
import {
  assinarSessao,
  lerToken,
  DIAS_SESSAO,
  type SessaoPayload,
} from "./jwt";

const COOKIE = "sessao";

export type { SessaoPayload };
export const NOME_COOKIE_SESSAO = COOKIE;

export async function criarSessao(payload: SessaoPayload): Promise<void> {
  const token = await assinarSessao(payload);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DIAS_SESSAO * 24 * 60 * 60,
  });
}

export async function apagarSessao(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE);
}

export async function lerSessao(): Promise<SessaoPayload | null> {
  const cookieStore = await cookies();
  return lerToken(cookieStore.get(COOKIE)?.value);
}
