"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { lerSessao } from "@/lib/sessao";
import { PODE_EDITAR, NOME_COOKIE_AREA } from "@/lib/acesso";
import { marcarParceiroVisto } from "@/lib/atividade";

export async function entrarNaArea(login: string): Promise<void> {
  const sessao = await lerSessao();
  if (!sessao) redirect("/login");
  const alvo = login.toLowerCase();
  if (PODE_EDITAR[sessao.login] !== alvo) redirect("/");

  const cookieStore = await cookies();
  cookieStore.set(NOME_COOKIE_AREA, alvo, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  // entrar na área do parceiro = "já vi as novidades dele"
  await marcarParceiroVisto(sessao.userId);
  redirect("/");
}

export async function voltarParaMinhaArea(): Promise<void> {
  (await cookies()).delete(NOME_COOKIE_AREA);
  redirect("/");
}
