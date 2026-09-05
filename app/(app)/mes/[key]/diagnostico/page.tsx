import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { exigirSessao } from "@/lib/dal";
import { keyValida } from "@/lib/format";
import { VistaDiagnostico } from "@/components/vistas/VistaDiagnostico";

export const metadata: Metadata = { title: "Diagnóstico — FinPulseIQ" };

export default async function PaginaDiagnostico({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  if (!keyValida(key)) notFound();

  const sessao = await exigirSessao();

  return (
    <VistaDiagnostico
      userId={sessao.userId}
      nome={sessao.nome}
      chaveMes={key}
      navBase="/mes"
      navSufixo="/diagnostico"
      hrefMes={`/mes/${key}`}
      hrefLancar={`/mes/${key}/lancar`}
    />
  );
}
