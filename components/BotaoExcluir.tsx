"use client";

import { useState } from "react";

export function BotaoExcluir({
  acao,
  confirmar = "Tem certeza que quer apagar este item?",
  rotulo = "Apagar",
  forte = false,
}: {
  acao: () => Promise<void>;
  confirmar?: string;
  rotulo?: string;
  /** Confirmação em dois passos, dentro da página (para ações mais sérias). */
  forte?: boolean;
}) {
  const [armado, setArmado] = useState(false);

  if (forte) {
    if (!armado) {
      return (
        <button
          type="button"
          onClick={() => setArmado(true)}
          className="rounded-lg px-2 py-1 text-sm font-semibold text-perigo hover:bg-perigo/10"
        >
          {rotulo}
        </button>
      );
    }
    return (
      <span className="flex flex-col items-end gap-1 rounded-lg border border-perigo/40 bg-perigo/5 p-2">
        <span className="text-xs font-semibold text-perigo">{confirmar}</span>
        <span className="flex gap-2">
          <button
            type="button"
            onClick={() => setArmado(false)}
            className="rounded-lg px-2 py-1 text-sm font-semibold text-texto-suave hover:bg-fundo"
          >
            Cancelar
          </button>
          <form action={acao}>
            <button
              type="submit"
              className="rounded-lg bg-perigo px-2 py-1 text-sm font-bold text-white hover:opacity-90"
            >
              Sim, apagar
            </button>
          </form>
        </span>
      </span>
    );
  }

  return (
    <form
      action={acao}
      onSubmit={(e) => {
        if (!window.confirm(confirmar)) e.preventDefault();
      }}
    >
      <button
        type="submit"
        className="rounded-lg px-2 py-1 text-sm font-semibold text-perigo hover:bg-perigo/10"
      >
        {rotulo}
      </button>
    </form>
  );
}
