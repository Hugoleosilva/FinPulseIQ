"use server";

import { redirect } from "next/navigation";
import { cadastroSchema, loginSchema } from "@/lib/validacao";
import { camposDeErro, type EstadoForm } from "@/lib/forms";
import { hashSenha, verificarSenha } from "@/lib/senha";
import { buscarUsuarioPorLogin, criarUsuario } from "@/lib/repo";
import { criarSessao, apagarSessao } from "@/lib/sessao";
import { loginPermitido } from "@/lib/acesso";

export async function cadastrar(
  _prev: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const parsed = cadastroSchema.safeParse({
    nomeExibicao: formData.get("nomeExibicao"),
    login: formData.get("login"),
    senha: formData.get("senha"),
    confirmarSenha: formData.get("confirmarSenha"),
  });

  if (!parsed.success) {
    return { ok: false, campos: camposDeErro(parsed.error) };
  }

  const { nomeExibicao, login, senha } = parsed.data;

  if (!loginPermitido(login)) {
    return {
      ok: false,
      campos: {
        login:
          "Este sistema é privado. O apelido de acesso precisa ser combinado com o responsável.",
      },
    };
  }

  const jaExiste = await buscarUsuarioPorLogin(login);
  if (jaExiste) {
    return {
      ok: false,
      campos: { login: "Esse apelido de acesso já está em uso. Tente outro." },
    };
  }

  const usuario = await criarUsuario({
    nomeExibicao,
    login,
    senhaHash: await hashSenha(senha),
  });

  await criarSessao({
    userId: usuario.id,
    login: usuario.login,
    nome: usuario.nomeExibicao,
  });

  redirect("/");
}

export async function entrar(
  _prev: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const parsed = loginSchema.safeParse({
    login: formData.get("login"),
    senha: formData.get("senha"),
  });

  if (!parsed.success) {
    return { ok: false, campos: camposDeErro(parsed.error) };
  }

  const { login, senha } = parsed.data;
  const usuario = await buscarUsuarioPorLogin(login);
  const senhaOk =
    usuario && (await verificarSenha(senha, usuario.senhaHash));

  if (!usuario || !senhaOk) {
    return {
      ok: false,
      erro: "Apelido ou senha incorretos. Confira e tente de novo.",
    };
  }

  await criarSessao({
    userId: usuario.id,
    login: usuario.login,
    nome: usuario.nomeExibicao,
  });

  const destino = String(formData.get("de") || "/");
  redirect(destino.startsWith("/") ? destino : "/");
}

export async function sair(): Promise<void> {
  await apagarSessao();
  redirect("/login");
}
