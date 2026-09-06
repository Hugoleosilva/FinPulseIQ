import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { exigirSessao } from "@/lib/dal";
import { listarCartoes } from "@/lib/repo";
import { mesAtualKey } from "@/lib/format";
import { BotaoLink } from "@/components/ui";
import { ImportarFatura } from "./ImportarFatura";

export const metadata: Metadata = { title: "Fatura do cartão — FinPulseIQ" };

export default async function PaginaFatura({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { userId } = await exigirSessao();
  const cartao = (await listarCartoes(userId)).find((c) => c.id === id);
  if (!cartao) notFound();

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">Fatura — {cartao.nome}</h1>
        <BotaoLink href="/cartoes" variante="secundario">
          Voltar aos cartões
        </BotaoLink>
      </div>
      <ImportarFatura
        cartaoId={cartao.id}
        cartaoNome={cartao.nome}
        mesAtual={mesAtualKey()}
        titularFatura={cartao.compartilhado ? cartao.titularFatura ?? "" : ""}
      />
    </div>
  );
}
