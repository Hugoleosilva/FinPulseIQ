import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { exigirSessao } from "@/lib/dal";
import { keyValida, nomeMes } from "@/lib/format";
import { BotaoLink } from "@/components/ui";
import { ImportarPlanilha } from "./ImportarPlanilha";

export const metadata: Metadata = { title: "Importar planilha — FinPulseIQ" };

export default async function PaginaImportar({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  if (!keyValida(key)) notFound();
  await exigirSessao();

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">
          Importar planilha — {nomeMes(key)}
        </h1>
        <BotaoLink href={`/mes/${key}/lancar`} variante="fantasma">
          ← Preencher à mão
        </BotaoLink>
      </div>
      <ImportarPlanilha chaveMes={key} />
    </div>
  );
}
