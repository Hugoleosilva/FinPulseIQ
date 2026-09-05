"use client";

import Link from "next/link";
import { useActionState } from "react";
import { entrar } from "@/app/actions/auth";
import { CampoTexto } from "@/components/campos";
import { Botao, Aviso, Card } from "@/components/ui";
import type { EstadoForm } from "@/lib/forms";

export function LoginForm({ de }: { de?: string }) {
  const [estado, action, pendente] = useActionState<EstadoForm, FormData>(
    entrar,
    null,
  );
  const campos = estado && !estado.ok ? estado.campos : undefined;

  return (
    <Card>
      <form action={action} className="flex flex-col gap-5">
        <h1 className="text-2xl font-extrabold">Entrar na sua conta</h1>

        {estado && !estado.ok && estado.erro ? (
          <Aviso tipo="perigo">{estado.erro}</Aviso>
        ) : null}

        <input type="hidden" name="de" value={de ?? "/"} />

        <CampoTexto
          id="login"
          name="login"
          rotulo="Apelido de acesso"
          ajuda="Aquele nome curto que você escolheu ao criar a conta."
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
          autoComplete="current-password"
          required
          erro={campos?.senha}
        />

        <Botao type="submit" disabled={pendente}>
          {pendente ? "Entrando..." : "Entrar"}
        </Botao>

        <p className="text-center text-sm text-texto-suave">
          Ainda não tem conta?{" "}
          <Link href="/cadastro" className="font-bold text-acento-escuro underline">
            Criar uma agora
          </Link>
        </p>
      </form>
    </Card>
  );
}
