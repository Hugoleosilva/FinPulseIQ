import type { Metadata } from "next";
import { exigirSessao } from "@/lib/dal";
import { mesAtualKey } from "@/lib/format";
import { VistaHistorico } from "@/components/vistas/VistaHistorico";

export const metadata: Metadata = { title: "Histórico — FinPulseIQ" };

export default async function PaginaHistorico() {
  const { userId } = await exigirSessao();
  return (
    <VistaHistorico
      userId={userId}
      hrefMes={(key) => `/mes/${key}`}
      hrefLancarAtual={`/mes/${mesAtualKey()}/lancar`}
    />
  );
}
