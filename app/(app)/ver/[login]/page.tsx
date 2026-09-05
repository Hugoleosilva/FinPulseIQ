import { redirect } from "next/navigation";
import { exigirAcessoLeitura } from "@/lib/acesso";
import { mesAtualKey } from "@/lib/format";

export default async function PaginaVer({
  params,
}: {
  params: Promise<{ login: string }>;
}) {
  const { login } = await params;
  await exigirAcessoLeitura(login);
  redirect(`/ver/${login.toLowerCase()}/mes/${mesAtualKey()}`);
}
