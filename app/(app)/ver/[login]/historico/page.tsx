import { exigirAcessoLeitura } from "@/lib/acesso";
import { VistaHistorico } from "@/components/vistas/VistaHistorico";

export default async function PaginaVerHistorico({
  params,
}: {
  params: Promise<{ login: string }>;
}) {
  const { login } = await params;
  const alvo = await exigirAcessoLeitura(login);
  const l = alvo.login;

  return (
    <VistaHistorico
      userId={alvo.userId}
      somenteLeitura
      nomeArea={alvo.nome}
      hrefMes={(key) => `/ver/${l}/mes/${key}`}
    />
  );
}
