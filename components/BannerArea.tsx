import { voltarParaMinhaArea } from "@/app/actions/area";

export function BannerArea({ nome }: { nome: string }) {
  return (
    <div className="bg-alerta/15 text-alerta">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm font-bold">
        <span>
          ✋ Você está administrando a área de <strong>{nome}</strong>. Tudo que
          adicionar/editar entra na conta dela.
        </span>
        <form action={voltarParaMinhaArea}>
          <button className="rounded-lg bg-alerta px-3 py-1 font-bold text-white">
            Voltar para a minha área
          </button>
        </form>
      </div>
    </div>
  );
}
