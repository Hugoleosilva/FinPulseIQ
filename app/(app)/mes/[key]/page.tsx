import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { exigirSessao } from "@/lib/dal";
import { keyValida } from "@/lib/format";
import { VistaMes } from "@/components/vistas/VistaMes";

export const metadata: Metadata = { title: "Meu mês — FinPulseIQ" };

export default async function PaginaMes({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  if (!keyValida(key)) notFound();
  const { userId } = await exigirSessao();

  return (
    <VistaMes
      userId={userId}
      chaveMes={key}
      navBase="/mes"
      navSufixo=""
      hrefDiagnostico={`/mes/${key}/diagnostico`}
      hrefLancar={`/mes/${key}/lancar`}
      hrefHistorico="/historico"
    />
  );
}
