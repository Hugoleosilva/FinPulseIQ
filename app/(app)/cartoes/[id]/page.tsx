import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { exigirSessao } from "@/lib/dal";
import { listarCartoes, listarMeses } from "@/lib/repo";
import { formatBRL, formatPct, nomeMesTitulo } from "@/lib/format";
import { emojiCategoria } from "@/lib/categorias";
import { mesAtualKey } from "@/lib/format";
import { Card, TituloSecao, Aviso, BotaoLink } from "@/components/ui";
import { Colapsavel } from "@/components/Colapsavel";
import { BotaoExcluir } from "@/components/BotaoExcluir";
import { FaturasCartao, type FaturaTotalItem } from "./FaturasCartao";
import { apagarFaturaDoMes } from "@/app/actions/fatura";
import type { Despesa } from "@/lib/tipos";

const CAT_FATURA = "Fatura de cartão (sem detalhar)";
const SUBS_TOTAL = ["Fatura fechada", "Fatura em aberto", "Fatura do mês"];

export const metadata: Metadata = { title: "Cartão — FinPulseIQ" };

export default async function PaginaCartao({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { userId } = await exigirSessao();
  const cartao = (await listarCartoes(userId)).find((c) => c.id === id);
  if (!cartao) notFound();

  const meses = await listarMeses(userId);
  const porMes = meses
    .map((m) => ({
      key: m.key,
      gastos: m.despesas.filter((d) => d.cartaoId === id),
    }))
    .filter((m) => m.gastos.length > 0)
    .sort((a, b) => b.key.localeCompare(a.key));

  const totalGeral = porMes.reduce(
    (a, m) => a + m.gastos.reduce((s, d) => s + d.valor, 0),
    0,
  );

  const faturasTotais: FaturaTotalItem[] = porMes
    .map((m) => {
      const d = m.gastos.find(
        (g) => g.categoria === CAT_FATURA && SUBS_TOTAL.includes(g.subcategoria),
      );
      return d
        ? {
            key: m.key,
            valor: d.valor,
            aberta: d.subcategoria === "Fatura em aberto",
            despesaId: d.id,
          }
        : null;
    })
    .filter((x): x is FaturaTotalItem => x !== null)
    .sort((a, b) => b.key.localeCompare(a.key));

  // já há transações detalhadas (PDF importado) neste cartão?
  const ehFaturaTotal = (g: Despesa) =>
    g.categoria === CAT_FATURA && SUBS_TOTAL.includes(g.subcategoria);
  const temDetalhe = porMes.some((m) => m.gastos.some((g) => !ehFaturaTotal(g)));

  // soma já lançada por mês (fora a "fatura total"), p/ pré-preencher o valor
  const sugestoes: Record<string, number> = {};
  for (const m of porMes) {
    const soma = m.gastos
      .filter((g) => !ehFaturaTotal(g))
      .reduce((s, d) => s + d.valor, 0);
    if (soma > 0) sugestoes[m.key] = Math.round(soma * 100) / 100;
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">{cartao.nome}</h1>
        <div className="flex gap-2">
          <BotaoLink href={`/cartoes/${id}/fatura`}>Lançar fatura</BotaoLink>
          <BotaoLink href="/cartoes" variante="secundario">
            Voltar
          </BotaoLink>
        </div>
      </div>

      <Card>
        <dl className="grid gap-3 sm:grid-cols-4">
          <Info rotulo="Limite total" valor={formatBRL(cartao.limite)} />
          <Info rotulo="Fatura fecha dia" valor={String(cartao.diaFechamento)} />
          <Info rotulo="Fatura vence dia" valor={String(cartao.diaVencimento)} />
          <Info
            rotulo="Compartilhado?"
            valor={
              cartao.compartilhado
                ? `Sim (${cartao.titularFatura || "—"})`
                : "Não"
            }
          />
        </dl>
      </Card>

      <Card>
        <Colapsavel
          titulo={
            faturasTotais.length > 0
              ? `Fatura por mês (valor total) · ${faturasTotais.length}`
              : "Fatura por mês (valor total)"
          }
          aberto={faturasTotais.length === 0 && !temDetalhe}
          ajuda={
            temDetalhe
              ? "Este cartão já tem faturas detalhadas por PDF. Use esta parte só para meses futuros ou faturas ainda em aberto."
              : "Só o valor total da fatura, mês a mês — marque se ainda está em aberto. Bom para prever o que vem."
          }
        >
          <FaturasCartao
            cartaoId={id}
            cartaoNome={cartao.nome}
            mesAtual={mesAtualKey()}
            faturas={faturasTotais}
            sugestoes={sugestoes}
          />
        </Colapsavel>
      </Card>

      {porMes.length === 0 ? (
        <Aviso tipo="info">
          Nenhum gasto lançado neste cartão ainda. Use <strong>“Lançar
          fatura”</strong> para enviar o PDF ou o valor total.
        </Aviso>
      ) : (
        <>
          <Card>
            <TituloSecao ajuda="Somando tudo que já foi lançado neste cartão.">
              Total no cartão
            </TituloSecao>
            <p className="tabular text-3xl font-extrabold">
              {formatBRL(totalGeral)}
            </p>
            {cartao.limite > 0 ? (
              <p className="text-sm text-texto-suave">
                {formatPct(totalGeral / cartao.limite)} do limite de{" "}
                {formatBRL(cartao.limite)}
              </p>
            ) : null}
          </Card>

          {porMes.map((m) => (
            <MesDoCartao
              key={m.key}
              cartaoId={id}
              chave={m.key}
              gastos={m.gastos}
            />
          ))}
        </>
      )}
    </div>
  );
}

function Info({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="rounded-xl border border-borda bg-fundo p-3">
      <dt className="text-sm text-texto-suave">{rotulo}</dt>
      <dd className="tabular text-lg font-extrabold">{valor}</dd>
    </div>
  );
}

function MesDoCartao({
  cartaoId,
  chave,
  gastos,
}: {
  cartaoId: string;
  chave: string;
  gastos: Despesa[];
}) {
  const total = gastos.reduce((a, d) => a + d.valor, 0);

  const porCategoria = new Map<string, number>();
  for (const d of gastos) {
    porCategoria.set(d.categoria, (porCategoria.get(d.categoria) ?? 0) + d.valor);
  }
  const categorias = [...porCategoria.entries()].sort((a, b) => b[1] - a[1]);
  const max = categorias[0]?.[1] ?? 0;

  return (
    <Card>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xl font-bold">{nomeMesTitulo(chave)}</h2>
        <span className="flex items-center gap-3">
          <span className="tabular text-xl font-extrabold">
            {formatBRL(total)}
          </span>
          <BotaoExcluir
            acao={apagarFaturaDoMes.bind(null, cartaoId, chave)}
            rotulo="Apagar fatura do mês"
            confirmar={`Apagar TODOS os ${gastos.length} lançamento(s) deste cartão em ${nomeMesTitulo(chave)}? Use se a fatura foi enviada errada (ex.: dados de outro cartão).`}
          />
        </span>
      </div>

      <ul className="mb-4 flex flex-col gap-2">
        {categorias.map(([cat, v]) => (
          <li key={cat}>
            <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
              <span className="font-semibold">
                {emojiCategoria(cat)} {cat}
              </span>
              <span className="tabular text-texto-suave">{formatBRL(v)}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-fundo">
              <div
                className="h-full rounded-full bg-acento"
                style={{ width: `${max > 0 ? Math.max(3, (v / max) * 100) : 0}%` }}
              />
            </div>
          </li>
        ))}
      </ul>

      <Colapsavel titulo={`Ver as ${gastos.length} transação(ões)`}>
        <ul className="divide-y divide-borda">
          {[...gastos]
            .sort((a, b) => a.dia - b.dia)
            .map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between gap-3 py-2 text-sm"
              >
                <span>
                  <span className="font-semibold">
                    {emojiCategoria(d.categoria)} {d.descricao}
                  </span>
                  <span className="block text-xs text-texto-suave">
                    dia {d.dia} · {d.categoria} / {d.subcategoria}
                    {d.parcela
                      ? ` · parcela ${d.parcela.atual}/${d.parcela.total}`
                      : ""}
                  </span>
                </span>
                <span className="tabular font-bold">{formatBRL(d.valor)}</span>
              </li>
            ))}
        </ul>
      </Colapsavel>
    </Card>
  );
}
