"use client";

import Link from "next/link";
import { useActionState } from "react";
import { cadastrar } from "@/app/actions/auth";
import { CampoTexto } from "@/components/campos";
import { Botao, Aviso, Card } from "@/components/ui";
import type { EstadoForm } from "@/lib/forms";

export function CadastroForm() {
  const [estado, action, pendente] = useActionState<EstadoForm, FormData>(
    cadastrar,
    null,
  );
  const campos = estado && !estado.ok ? estado.campos : undefined;

  return (
    <Card>
      <form action={action} className="flex flex-col gap-5">
        <h1 className="text-2xl font-extrabold">Criar sua conta</h1>
        <p className="text-sm text-texto-suave">
          É rápido. Seus dados ficam só com você — cada pessoa vê apenas as
          próprias informações.
        </p>

        {estado && !estado.ok && estado.erro ? (
          <Aviso tipo="perigo">{estado.erro}</Aviso>
        ) : null}

        <CampoTexto
          id="nomeExibicao"
          name="nomeExibicao"
          rotulo="Seu nome"
          ajuda="Como você quer ser chamado dentro do sistema."
          exemplo="Maria"
          autoComplete="name"
          required
          erro={campos?.nomeExibicao}
        />

        <CampoTexto
          id="login"
          name="login"
          rotulo="Apelido de acesso"
          ajuda="Um nome curto, sem espaços, que você vai usar para entrar."
          exemplo="maria.silva"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          erro={campos?.login}
        />

        <CampoTexto
          id="senha"
          name="senha"
          type="password"
          rotulo="Senha"
          ajuda="Pelo menos 6 caracteres. Escolha algo que você lembre."
          autoComplete="new-password"
          required
          erro={campos?.senha}
        />

        <CampoTexto
          id="confirmarSenha"
          name="confirmarSenha"
          type="password"
          rotulo="Digite a senha de novo"
          ajuda="Só para ter certeza de que não houve erro de digitação."
          autoComplete="new-password"
          required
          erro={campos?.confirmarSenha}
        />

        <Botao type="submit" disabled={pendente}>
          {pendente ? "Criando..." : "Criar conta e entrar"}
        </Botao>

        <p className="text-center text-sm text-texto-suave">
          Já tem conta?{" "}
          <Link href="/login" className="font-bold text-acento-escuro underline">
            Entrar
          </Link>
        </p>
      </form>
    </Card>
  );
}
