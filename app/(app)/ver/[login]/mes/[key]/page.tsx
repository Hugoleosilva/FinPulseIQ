import { notFound } from "next/navigation";
import { exigirAcessoLeitura } from "@/lib/acesso";
import { keyValida } from "@/lib/format";
import { VistaMes } from "@/components/vistas/VistaMes";

export default async function PaginaVerMes({
  params,
}: {
  params: Promise<{ login: string; key: string }>;
}) {
  const { login, key } = await params;
  if (!keyValida(key)) notFound();
  const alvo = await exigirAcessoLeitura(login);
  const l = alvo.login;

  return (
    <VistaMes
      userId={alvo.userId}
      chaveMes={key}
      somenteLeitura
      nomeArea={alvo.nome}
      navBase={`/ver/${l}/mes`}
      navSufixo=""
      hrefDiagnostico={`/ver/${l}/mes/${key}/diagnostico`}
      hrefHistorico={`/ver/${l}/historico`}
    />
  );
}
