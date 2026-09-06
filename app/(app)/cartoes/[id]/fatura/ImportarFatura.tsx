"use client";

import { useMemo, useState, useTransition } from "react";
import { useActionState } from "react";
import {
  analisarFatura,
  importarFatura,
  lancarFaturaTotal,
  type EstadoImportFatura,
  type EstadoTotal,
} from "@/app/actions/fatura";
import type { FaturaLida, TransacaoFatura } from "@/lib/fatura";
import { CATEGORIAS, getCategoria } from "@/lib/categorias";
import { nomeMes, formatBRL, deslocaMes } from "@/lib/format";
import { Botao, Aviso, Card } from "@/components/ui";
import { CampoTexto } from "@/components/campos";

interface Linha {
  incluir: boolean;
  descricao: string;
  valor: number;
  categoria: string;
  subcategoria: string;
  essencialidade: TransacaoFatura["essencialidade"];
  parcelaAtual?: number;
  parcelaTotal?: number;
  titular: string | null;
  origem: TransacaoFatura["origem"];
}

function mesesOpcoes(base: string): string[] {
  return [-2, -1, 0, 1].map((n) => deslocaMes(base, n));
}

function mesDoVencimento(venc: string | null, fallback: string): string {
  if (venc) {
    const m = venc.match(/^\d{2}\/(\d{2})\/(\d{4})$/);
    if (m) return `${m[2]}-${m[1]}`;
  }
  return fallback;
}

export function ImportarFatura({
  cartaoId,
  cartaoNome,
  mesAtual,
}: {
  cartaoId: string;
  cartaoNome: string;
  mesAtual: string;
}) {
  const [aba, setAba] = useState<"pdf" | "total">("pdf");

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-2">
        <button
          onClick={() => setAba("pdf")}
          className={`rounded-full px-4 py-2 text-sm font-bold ${
            aba === "pdf" ? "bg-acento text-white" : "bg-fundo text-texto-suave"
          }`}
        >
          Ler PDF da fatura
        </button>
        <button
          onClick={() => setAba("total")}
          className={`rounded-full px-4 py-2 text-sm font-bold ${
            aba === "total" ? "bg-acento text-white" : "bg-fundo text-texto-suave"
          }`}
        >
          Só o valor total
        </button>
      </div>

      {aba === "pdf" ? (
        <AbaPDF cartaoId={cartaoId} mesAtual={mesAtual} />
      ) : (
        <AbaTotal cartaoId={cartaoId} cartaoNome={cartaoNome} mesAtual={mesAtual} />
      )}
    </div>
  );
}

function AbaTotal({
  cartaoId,
  cartaoNome,
  mesAtual,
}: {
  cartaoId: string;
  cartaoNome: string;
  mesAtual: string;
}) {
  const [mes, setMes] = useState(mesAtual);
  const [estado, action, pendente] = useActionState<EstadoTotal, FormData>(
    lancarFaturaTotal.bind(null, cartaoId, mes),
    null,
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <Aviso tipo="info">
        Sem detalhar: lança um único gasto com o valor da fatura. Bom para já ter
        uma visão do que vem, mesmo com a fatura ainda em aberto.
      </Aviso>
      <label className="text-sm font-bold">
        Mês em que a fatura vence / é paga
        <select
          value={mes}
          onChange={(e) => setMes(e.target.value)}
          className="mt-1 w-full rounded-xl border border-borda bg-white px-3 py-2"
        >
          {mesesOpcoes(mesAtual).map((k) => (
            <option key={k} value={k}>
              {nomeMes(k)}
            </option>
          ))}
        </select>
      </label>
      <CampoTexto
        id="ft-valor"
        name="valor"
        rotulo="Valor da fatura"
        prefixo="R$"
        inputMode="decimal"
        placeholder="0,00"
        exemplo="682,88"
        required
      />
      <label className="flex items-center gap-3 text-sm">
        <input type="checkbox" name="aberta" className="h-5 w-5 accent-acento" />
        A fatura ainda está em aberto (valor pode mudar até o fechamento)
      </label>
      <div>
        <Botao type="submit" disabled={pendente}>
          {pendente ? "Salvando..." : `Lançar fatura do ${cartaoNome}`}
        </Botao>
      </div>
      {estado?.ok ? (
        <Aviso tipo="ok">Fatura lançada em {nomeMes(mes)}.</Aviso>
      ) : null}
      {estado && !estado.ok ? (
        <Aviso tipo="perigo">{estado.erro}</Aviso>
      ) : null}
    </form>
  );
}

function AbaPDF({
  cartaoId,
  mesAtual,
}: {
  cartaoId: string;
  mesAtual: string;
}) {
  const [analisando, startAnalise] = useTransition();
  const [erroAnalise, setErroAnalise] = useState<string | null>(null);
  const [fatura, setFatura] = useState<FaturaLida | null>(null);
  const [mes, setMes] = useState(mesAtual);
  const [titularFiltro, setTitularFiltro] = useState<string>("todos");
  const [linhas, setLinhas] = useState<Linha[]>([]);

  const [estado, importar, importando] = useActionState<
    EstadoImportFatura,
    FormData
  >(importarFatura.bind(null, cartaoId, mes), null);

  const analisar = (form: HTMLFormElement) => {
    const input = form.querySelector<HTMLInputElement>("#fatura-pdf");
    const file = input?.files?.[0];
    if (!file) {
      setErroAnalise("Escolha o arquivo PDF.");
      return;
    }
    const fd = new FormData();
    fd.set("fatura", file);
    startAnalise(async () => {
      const r = await analisarFatura(fd);
      if (!r.ok) {
        setErroAnalise(r.erro);
        setFatura(null);
        return;
      }
      setErroAnalise(null);
      setFatura(r.dados);
      setMes(mesDoVencimento(r.dados.vencimento, mesAtual));
      setTitularFiltro("todos");
      setLinhas(
        r.dados.transacoes.map((t) => ({
          incluir: true,
          descricao: t.descricao,
          valor: t.valor,
          categoria: t.categoria,
          subcategoria: t.subcategoria,
          essencialidade: t.essencialidade,
          parcelaAtual: t.parcela?.atual,
          parcelaTotal: t.parcela?.total,
          titular: t.titular,
          origem: t.origem,
        })),
      );
    });
  };

  const visiveis = useMemo(() => {
    if (!fatura) return [];
    return linhas
      .map((l, idx) => ({ l, idx }))
      .filter(
        ({ l }) =>
          titularFiltro === "todos" ||
          (l.titular ?? "").toUpperCase().includes(titularFiltro.toUpperCase()),
      );
  }, [linhas, titularFiltro, fatura]);

  const totalMarcado = visiveis
    .filter(({ l }) => l.incluir)
    .reduce((a, { l }) => a + l.valor, 0);

  const upd = (idx: number, patch: Partial<Linha>) =>
    setLinhas((ls) => ls.map((l, i) => (i === idx ? { ...l, ...patch } : l)));

  const payload = JSON.stringify(
    visiveis
      .filter(({ l }) => l.incluir)
      .map(({ l }) => ({
        descricao: l.descricao,
        valor: l.valor,
        categoria: l.categoria,
        subcategoria: l.subcategoria,
        essencialidade: l.essencialidade,
        parcelaAtual: l.parcelaAtual,
        parcelaTotal: l.parcelaTotal,
        dia: 0, // servidor usa o dia do vencimento do cartão
      })),
  );

  return (
    <div className="flex flex-col gap-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          analisar(e.currentTarget);
        }}
        className="flex flex-col gap-2"
      >
        <p className="text-sm text-texto-suave">
          Envie o PDF da fatura do Itaú. O sistema lê cada compra e já sugere a
          categoria. Nada é guardado até você confirmar.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <input
            id="fatura-pdf"
            type="file"
            accept="application/pdf,.pdf"
            className="rounded-xl border border-borda bg-white p-2 text-sm"
          />
          <Botao type="submit" variante="secundario" disabled={analisando}>
            {analisando ? "Lendo..." : "Ler fatura"}
          </Botao>
        </div>
        {erroAnalise ? <Aviso tipo="perigo">{erroAnalise}</Aviso> : null}
      </form>

      {fatura ? (
        <>
          <Card>
            <p className="text-sm text-texto-suave">
              Fatura lida{fatura.cartaoFinal ? ` — final ${fatura.cartaoFinal}` : ""}
              {fatura.vencimento ? ` · vence ${fatura.vencimento}` : ""}
              {fatura.totalFatura
                ? ` · total ${formatBRL(fatura.totalFatura)}`
                : ""}
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-bold">
                Lançar no mês
                <select
                  value={mes}
                  onChange={(e) => setMes(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-borda bg-white px-3 py-2"
                >
                  {mesesOpcoes(mesAtual).map((k) => (
                    <option key={k} value={k}>
                      {nomeMes(k)}
                    </option>
                  ))}
                </select>
              </label>
              {fatura.titulares.length > 1 ? (
                <label className="text-sm font-bold">
                  Importar transações de
                  <select
                    value={titularFiltro}
                    onChange={(e) => setTitularFiltro(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-borda bg-white px-3 py-2"
                  >
                    <option value="todos">Todos</option>
                    {fatura.titulares.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
            </div>
          </Card>

          <div className="overflow-x-auto rounded-xl border border-borda">
            <table className="w-full min-w-[42rem] text-sm">
              <thead className="bg-fundo text-left text-texto-suave">
                <tr>
                  <th className="p-2"></th>
                  <th className="p-2">Descrição</th>
                  <th className="p-2 text-right">Valor</th>
                  <th className="p-2">Categoria</th>
                  <th className="p-2">Parcela</th>
                </tr>
              </thead>
              <tbody>
                {visiveis.map(({ l, idx }) => (
                  <tr key={idx} className="border-t border-borda/60">
                    <td className="p-2">
                      <input
                        type="checkbox"
                        checked={l.incluir}
                        onChange={(e) => upd(idx, { incluir: e.target.checked })}
                        className="h-5 w-5 accent-acento"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        value={l.descricao}
                        onChange={(e) => upd(idx, { descricao: e.target.value })}
                        className="w-44 rounded border border-borda px-2 py-1"
                      />
                      {l.origem === "internacional" ? (
                        <span className="ml-1 text-xs text-alerta">
                          internacional
                        </span>
                      ) : null}
                    </td>
                    <td className="tabular p-2 text-right">
                      {formatBRL(l.valor)}
                    </td>
                    <td className="p-2">
                      <select
                        value={l.categoria}
                        onChange={(e) => {
                          const cat = e.target.value;
                          const def = getCategoria(cat);
                          upd(idx, {
                            categoria: cat,
                            subcategoria: def?.subcategorias[0] ?? "",
                            essencialidade:
                              def?.essencialidadePadrao ?? "reduzivel",
                          });
                        }}
                        className="w-40 rounded border border-borda px-2 py-1"
                      >
                        {CATEGORIAS.map((c) => (
                          <option key={c.nome} value={c.nome}>
                            {c.emoji} {c.nome}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2 text-texto-suave">
                      {l.parcelaAtual
                        ? `${l.parcelaAtual}/${l.parcelaTotal}`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <form action={importar} className="flex flex-col gap-2">
            <input type="hidden" name="linhas" value={payload} />
            <p className="text-sm text-texto-suave">
              {visiveis.filter(({ l }) => l.incluir).length} transação(ões)
              marcada(s) · {formatBRL(totalMarcado)} · vão para{" "}
              <strong>{nomeMes(mes)}</strong> com o dia do vencimento do cartão.
            </p>
            <div>
              <Botao type="submit" disabled={importando}>
                {importando
                  ? "Importando..."
                  : `Importar para ${nomeMes(mes)}`}
              </Botao>
            </div>
          </form>

          {estado?.ok ? (
            <Aviso tipo="ok">
              {estado.quantidade} gasto(s) importado(s) para {nomeMes(mes)}. As
              parcelas em andamento entram no compromisso futuro.
            </Aviso>
          ) : null}
          {estado && !estado.ok ? (
            <Aviso tipo="perigo">{estado.erro}</Aviso>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
