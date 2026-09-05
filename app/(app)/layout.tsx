import { exigirSessao } from "@/lib/dal";
import { parceiroVisivel } from "@/lib/acesso";
import { buscarUsuarioPorLogin } from "@/lib/repo";
import { mesAtualKey } from "@/lib/format";
import { Nav } from "@/components/Nav";

export default async function LayoutApp({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessao = await exigirSessao();
  const loginParceiro = await parceiroVisivel();
  const parceiro = loginParceiro
    ? await buscarUsuarioPorLogin(loginParceiro)
    : null;

  return (
    <div className="flex min-h-full flex-col">
      <Nav
        nome={sessao.nome}
        mesAtual={mesAtualKey()}
        parceiro={
          parceiro
            ? { login: parceiro.login, nome: parceiro.nomeExibicao }
            : null
        }
      />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        {children}
      </main>
      <footer className="border-t border-borda py-6 text-center text-xs text-texto-suave">
        FinPulseIQ · seus dados são privados e ficam só na sua conta
      </footer>
    </div>
  );
}
