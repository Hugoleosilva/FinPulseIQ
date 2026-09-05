import { notFound } from "next/navigation";
import { exigirAcessoLeitura } from "@/lib/acesso";
import { keyValida } from "@/lib/format";
import { VistaDiagnostico } from "@/components/vistas/VistaDiagnostico";

export default async function PaginaVerDiagnostico({
  params,
}: {
  params: Promise<{ login: string; key: string }>;
}) {
  const { login, key } = await params;
  if (!keyValida(key)) notFound();
  const alvo = await exigirAcessoLeitura(login);
  const l = alvo.login;

  return (
    <VistaDiagnostico
      userId={alvo.userId}
      nome={alvo.nome}
      chaveMes={key}
      somenteLeitura
      nomeArea={alvo.nome}
      navBase={`/ver/${l}/mes`}
      navSufixo={`/diagnostico`}
      hrefMes={`/ver/${l}/mes/${key}`}
    />
  );
}
