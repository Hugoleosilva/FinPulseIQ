"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { cadastroSchema, loginSchema } from "@/lib/validacao";
import { camposDeErro, type EstadoForm } from "@/lib/forms";
import { hashSenha, verificarSenha } from "@/lib/senha";
import { buscarUsuarioPorLogin, criarUsuario } from "@/lib/repo";
import { criarSessao, apagarSessao, lerSessao } from "@/lib/sessao";
import { loginPermitido, NOME_COOKIE_AREA, PODE_EDITAR } from "@/lib/acesso";
import { estaAtivo, limparPresenca } from "@/lib/presenca";

async function limparArea() {
  (await cookies()).delete(NOME_COOKIE_AREA);
}

/** Login que administra o `login` dado (ex.: "hugo" administra "angelica"). */
function administradorDe(login: string): string | null {
  for (const [admin, alvo] of Object.entries(PODE_EDITAR)) {
    if (alvo === login) return admin;
  }
  return null;
}

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
  await limparArea();

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

  // Login exclusivo: se quem administra esta conta está online, ela espera.
  const admin = administradorDe(login);
  if (admin) {
    const jaLogado = await lerSessao();
    const ehOProprioAdmin = jaLogado?.login === admin;
    if (!ehOProprioAdmin) {
      const adminUser = await buscarUsuarioPorLogin(admin);
      if (adminUser && (await estaAtivo(adminUser.id))) {
        return {
          ok: false,
          erro: `${adminUser.nomeExibicao} está fazendo uma manutenção no sistema agora. Tente de novo em 5 minutos.`,
        };
      }
    }
  }

  await criarSessao({
    userId: usuario.id,
    login: usuario.login,
    nome: usuario.nomeExibicao,
  });
  await limparArea();

  const destino = String(formData.get("de") || "/");
  redirect(destino.startsWith("/") ? destino : "/");
}

export async function sair(): Promise<void> {
  const sessao = await lerSessao();
  if (sessao) await limparPresenca(sessao.userId);
  await apagarSessao();
  await limparArea();
  redirect("/login");
}
