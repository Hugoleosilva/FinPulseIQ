"use client";

export function BotaoExcluir({
  acao,
  confirmar = "Tem certeza que quer apagar este item?",
  rotulo = "Apagar",
}: {
  acao: () => Promise<void>;
  confirmar?: string;
  rotulo?: string;
}) {
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
