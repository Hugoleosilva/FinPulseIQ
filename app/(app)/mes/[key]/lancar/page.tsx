import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { exigirSessao } from "@/lib/dal";
import { getMes, listarCartoes } from "@/lib/repo";
import { keyValida, nomeMes, formatBRL } from "@/lib/format";
import { emojiCategoria, ROTULO_ESSENCIALIDADE } from "@/lib/categorias";
import { removerReceita, removerDespesa } from "@/app/actions/lancamentos";
import { Card, Aviso } from "@/components/ui";
import { BotaoExcluir } from "@/components/BotaoExcluir";
import { WizardLancamento, type PassoWizard } from "./WizardLancamento";
import { FormSaldoInicial } from "./FormSaldoInicial";
import { FormReceita } from "./FormReceita";
import { FormDespesa } from "./FormDespesa";

export const metadata: Metadata = { title: "Preencher o mês — FinPulseIQ" };

export default async function PaginaLancar({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  if (!keyValida(key)) notFound();

  const { userId } = await exigirSessao();
  const [mes, cartoes] = await Promise.all([
    getMes(userId, key),
    listarCartoes(userId),
  ]);

  const totalReceitas = mes.receitas.reduce((a, r) => a + r.valor, 0);
  const totalDespesas = mes.despesas.reduce((a, d) => a + d.valor, 0);
  const saldo = mes.saldoInicial + totalReceitas - totalDespesas;

  const passos: PassoWizard[] = [
    {
      titulo: "Começo do mês",
      subtitulo: `Vamos organizar ${nomeMes(key)}.`,
      conteudo: (
        <FormSaldoInicial chaveMes={key} valorAtual={mes.saldoInicial} />
      ),
    },
    {
      titulo: "Dinheiro que entra",
      subtitulo:
        "Cadastre tudo o que você recebe no mês: salário, bicos, ajuda, aluguel que recebe.",
      conteudo: (
        <div className="flex flex-col gap-4">
          <FormReceita chaveMes={key} />
          <ListaReceitas chaveMes={key} receitas={mes.receitas} />
        </div>
      ),
    },
    {
      titulo: "Dinheiro que sai",
      subtitulo:
        "Cadastre seus gastos, um por um. Quanto mais completo, melhor o diagnóstico. Comece pelos maiores.",
      conteudo: (
        <div className="flex flex-col gap-4">
          <Aviso tipo="info" titulo="Já tem tudo numa planilha?">
            Você pode{" "}
            <a
              href={`/mes/${key}/importar`}
              className="font-bold text-acento-escuro underline"
            >
              importar de um arquivo Excel ou CSV
            </a>{" "}
            em vez de digitar um por um.
          </Aviso>
          {cartoes.length === 0 ? (
            <Aviso tipo="info">
              Dica: cadastre seus cartões em <strong>Cartões e documentos</strong>{" "}
              para o sistema calcular quanto da sua renda está comprometida com
              eles.
            </Aviso>
          ) : null}
          <FormDespesa chaveMes={key} cartoes={cartoes} />
          <ListaDespesas chaveMes={key} despesas={mes.despesas} />
        </div>
      ),
    },
    {
      titulo: "Conferir",
      subtitulo: "Veja se os números batem com a sua realidade.",
      conteudo: (
        <Card>
          <dl className="grid gap-3 sm:grid-cols-2">
            <Linha rotulo="Você tinha no começo" valor={formatBRL(mes.saldoInicial)} />
            <Linha rotulo="Entrou no mês" valor={formatBRL(totalReceitas)} />
            <Linha rotulo="Saiu no mês" valor={formatBRL(totalDespesas)} />
            <Linha
              rotulo="Sobra no fim do mês"
              valor={formatBRL(saldo)}
              destaque={saldo < 0 ? "perigo" : "ok"}
            />
          </dl>
          <p className="mt-4 text-sm text-texto-suave">
            {mes.despesas.length} gasto(s) e {mes.receitas.length} receita(s)
            cadastrados. Quando terminar, clique em “Concluir” para ver seu
            diagnóstico.
          </p>
        </Card>
      ),
    },
  ];

  return <WizardLancamento passos={passos} chaveMes={key} />;
}

function Linha({
  rotulo,
  valor,
  destaque,
}: {
  rotulo: string;
  valor: string;
  destaque?: "ok" | "perigo";
}) {
  return (
    <div className="rounded-xl border border-borda bg-fundo p-3">
      <dt className="text-sm text-texto-suave">{rotulo}</dt>
      <dd
        className={`tabular text-xl font-extrabold ${
          destaque === "perigo"
            ? "text-perigo"
            : destaque === "ok"
              ? "text-ok"
              : "text-texto"
        }`}
      >
        {valor}
      </dd>
    </div>
  );
}

function ListaReceitas({
  chaveMes,
  receitas,
}: {
  chaveMes: string;
  receitas: { id: string; descricao: string; valor: number; dia: number }[];
}) {
  if (receitas.length === 0) {
    return (
      <p className="text-sm text-texto-suave">
        Nenhuma receita cadastrada ainda.
      </p>
    );
  }
  return (
    <ul className="divide-y divide-borda rounded-xl border border-borda">
      {receitas.map((r) => (
        <li key={r.id} className="flex items-center justify-between gap-3 p-3">
          <span>
            <span className="font-semibold">{r.descricao}</span>
            <span className="block text-sm text-texto-suave">
              dia {r.dia}
            </span>
          </span>
          <span className="flex items-center gap-2">
            <span className="tabular font-bold text-ok">
              {formatBRL(r.valor)}
            </span>
            <BotaoExcluir
              acao={removerReceita.bind(null, chaveMes, r.id)}
              confirmar={`Apagar a receita "${r.descricao}"?`}
            />
          </span>
        </li>
      ))}
    </ul>
  );
}

function ListaDespesas({
  chaveMes,
  despesas,
}: {
  chaveMes: string;
  despesas: {
    id: string;
    descricao: string;
    valor: number;
    dia: number;
    categoria: string;
    subcategoria: string;
    essencialidade: "essencial" | "reduzivel" | "desnecessario";
    parcela?: { atual: number; total: number } | null;
  }[];
}) {
  if (despesas.length === 0) {
    return (
      <p className="text-sm text-texto-suave">Nenhum gasto cadastrado ainda.</p>
    );
  }
  return (
    <ul className="divide-y divide-borda rounded-xl border border-borda">
      {despesas.map((d) => (
        <li key={d.id} className="flex items-center justify-between gap-3 p-3">
          <span>
            <span className="font-semibold">
              {emojiCategoria(d.categoria)} {d.descricao}
            </span>
            <span className="block text-sm text-texto-suave">
              {d.categoria} · {d.subcategoria} ·{" "}
              {ROTULO_ESSENCIALIDADE[d.essencialidade]}
              {d.parcela
                ? ` · parcela ${d.parcela.atual}/${d.parcela.total}`
                : ""}
            </span>
          </span>
          <span className="flex items-center gap-2">
            <span className="tabular font-bold text-texto">
              {formatBRL(d.valor)}
            </span>
            <BotaoExcluir
              acao={removerDespesa.bind(null, chaveMes, d.id)}
              confirmar={`Apagar o gasto "${d.descricao}"?`}
            />
          </span>
        </li>
      ))}
    </ul>
  );
}
