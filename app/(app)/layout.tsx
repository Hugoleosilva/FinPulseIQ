import { usuarioAtivo, parceiroAdministravel } from "@/lib/contexto";
import { buscarUsuarioPorLogin } from "@/lib/repo";
import { mesAtualKey } from "@/lib/format";
import { Nav } from "@/components/Nav";
import { BannerArea } from "@/components/BannerArea";

export default async function LayoutApp({
  children,
}: {
  children: React.ReactNode;
}) {
  const ativo = await usuarioAtivo();
  const loginParceiro = await parceiroAdministravel();
  const parceiro =
    loginParceiro && !ativo.ehParceiro
      ? await buscarUsuarioPorLogin(loginParceiro)
      : null;

  return (
    <div className="flex min-h-full flex-col">
      <Nav
        nome={ativo.nomeReal}
        mesAtual={mesAtualKey()}
        parceiro={
          parceiro
            ? { login: parceiro.login, nome: parceiro.nomeExibicao }
            : null
        }
      />
      {ativo.ehParceiro ? <BannerArea nome={ativo.nome} /> : null}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        {children}
      </main>
      <footer className="border-t border-borda py-6 text-center text-xs text-texto-suave">
        FinPulseIQ · seus dados são privados e ficam só na sua conta
      </footer>
    </div>
  );
}
