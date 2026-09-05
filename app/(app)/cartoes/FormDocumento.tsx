"use client";

import { useActionState, useEffect, useRef } from "react";
import { enviarDocumento } from "@/app/actions/documentos";
import { CampoTexto, CampoSelect } from "@/components/campos";
import { Botao, Aviso } from "@/components/ui";
import { ROTULO_TIPO_DOC } from "@/lib/documentos";
import type { EstadoForm } from "@/lib/forms";

export function FormDocumento({ mesAtual }: { mesAtual: string }) {
  const [estado, action, pendente] = useActionState<EstadoForm, FormData>(
    enviarDocumento,
    null,
  );
  const ref = useRef<HTMLFormElement>(null);
  const campos = estado && !estado.ok ? estado.campos : undefined;

  useEffect(() => {
    if (estado?.ok) ref.current?.reset();
  }, [estado]);

  return (
    <form
      ref={ref}
      action={action}
      className="grid gap-4 rounded-xl border border-borda bg-fundo p-4 sm:grid-cols-2"
    >
      <Aviso tipo="info" titulo="O que é “enviar” (upload)?">
        É guardar aqui, com segurança, uma cópia de um arquivo que está no seu
        computador ou celular — a foto de um boleto, o PDF de uma fatura, uma
        nota fiscal. Depois você consegue baixar de novo quando precisar.
        Aceita PDF, JPG, PNG ou WEBP, até 8 MB.
      </Aviso>

      <div className="sm:col-span-2">
        <CampoTexto
          id="doc-descricao"
          name="descricao"
          rotulo="O que é este documento?"
          exemplo="Fatura Nubank de setembro, Conta de luz"
          required
          erro={campos?.descricao}
        />
      </div>

      <CampoSelect
        id="doc-tipo"
        name="tipo"
        rotulo="Tipo de documento"
        defaultValue="conta_servico"
      >
        {Object.entries(ROTULO_TIPO_DOC).map(([v, r]) => (
          <option key={v} value={v}>
            {r}
          </option>
        ))}
      </CampoSelect>

      <CampoTexto
        id="doc-mes"
        name="mesRef"
        rotulo="Mês a que se refere (opcional)"
        type="month"
        defaultValue={mesAtual}
      />

      <CampoTexto
        id="doc-valor"
        name="valor"
        rotulo="Valor do documento (opcional)"
        prefixo="R$"
        inputMode="decimal"
        placeholder="0,00"
        erro={campos?.valor}
      />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="doc-arquivo" className="text-base font-bold text-texto">
          Arquivo
        </label>
        <p className="text-sm text-texto-suave">
          Clique para escolher o arquivo no seu aparelho.
        </p>
        <input
          id="doc-arquivo"
          name="arquivo"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/*"
          required
          className="rounded-xl border border-borda bg-white p-2 text-sm"
        />
      </div>

      <div className="sm:col-span-2 flex items-center gap-3">
        <Botao type="submit" disabled={pendente}>
          {pendente ? "Enviando..." : "Guardar documento"}
        </Botao>
        {estado?.ok ? (
          <span className="text-sm font-semibold text-ok">
            {estado.mensagem}
          </span>
        ) : null}
      </div>

      {estado && !estado.ok && estado.erro ? (
        <div className="sm:col-span-2">
          <Aviso tipo="perigo">{estado.erro}</Aviso>
        </div>
      ) : null}
    </form>
  );
}
