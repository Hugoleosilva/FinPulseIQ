"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import {
  adicionarSalario,
  editarSalario,
  analisarHolerite,
} from "@/app/actions/lancamentos";
import { CampoTexto } from "@/components/campos";
import { Botao, Aviso } from "@/components/ui";
import { formatBRL } from "@/lib/format";
import type { EstadoForm } from "@/lib/forms";
import type { Receita } from "@/lib/tipos";

interface Linha {
  descricao: string;
  valor: string;
}

const parse = (s: string) => {
  const n = Number(
    s.trim().replace(/\s/g, "").replace(/^r\$/i, "").replace(/\./g, "").replace(",", "."),
  );
  return Number.isFinite(n) ? n : 0;
};

const fmtInput = (n: number) =>
  n
    ? n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "";

export function FormSalario({
  chaveMes,
  receitaInicial,
  aoConcluir,
}: {
  chaveMes: string;
  receitaInicial?: Receita;
  aoConcluir?: () => void;
}) {
  const editando = !!receitaInicial;
  const salvar = editando
    ? editarSalario.bind(null, chaveMes, receitaInicial!.id)
    : adicionarSalario.bind(null, chaveMes);
  const [estado, formAction, salvando] = useActionState<EstadoForm, FormData>(
    salvar,
    null,
  );

  useEffect(() => {
    if (estado?.ok && editando) aoConcluir?.();
  }, [estado, editando, aoConcluir]);

  const [proventos, setProventos] = useState<Linha[]>(
    receitaInicial?.detalhe?.proventos.length
      ? receitaInicial.detalhe.proventos.map((i) => ({
          descricao: i.descricao,
          valor: fmtInput(i.valor),
        }))
      : [{ descricao: "Salário", valor: "" }],
  );
  const [descontos, setDescontos] = useState<Linha[]>(
    receitaInicial?.detalhe?.descontos.map((i) => ({
      descricao: i.descricao,
      valor: fmtInput(i.valor),
    })) ?? [],
  );
  const [analisando, startAnalise] = useTransition();
  const [msgAnalise, setMsgAnalise] = useState<string | null>(null);
  const [liquidoImpresso, setLiquidoImpresso] = useState<number | null>(null);

  const somaProv = useMemo(
    () => proventos.reduce((a, l) => a + parse(l.valor), 0),
    [proventos],
  );
  const somaDesc = useMemo(
    () => descontos.reduce((a, l) => a + parse(l.valor), 0),
    [descontos],
  );
  const liquido = somaProv - somaDesc;

  const analisar = (form: HTMLFormElement) => {
    const fd = new FormData();
    const input = form.querySelector<HTMLInputElement>("#holerite-pdf");
    const file = input?.files?.[0];
    if (!file) {
      setMsgAnalise("Escolha o arquivo PDF primeiro.");
      return;
    }
    fd.set("arquivo", file);
    startAnalise(async () => {
      const r = await analisarHolerite(fd);
      if (!r.ok) {
        setMsgAnalise(r.erro);
        return;
      }
      const p = r.dados.proventos.length
        ? r.dados.proventos.map((i) => ({ descricao: i.descricao, valor: fmtInput(i.valor) }))
        : proventos;
      const d = r.dados.descontos.map((i) => ({
        descricao: i.descricao,
        valor: fmtInput(i.valor),
      }));
      setProventos(p);
      setDescontos(d);
      setLiquidoImpresso(r.dados.liquidoDetectado);
      setMsgAnalise(
        `Encontrei ${r.dados.proventos.length} provento(s) e ${r.dados.descontos.length} desconto(s). Confira tudo antes de salvar.`,
      );
    });
  };

  const divergente =
    liquidoImpresso != null && Math.abs(liquidoImpresso - liquido) > 1;

  return (
    <div className="flex flex-col gap-5 rounded-xl border border-borda bg-fundo p-4">
      {/* Leitura do PDF */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          analisar(e.currentTarget);
        }}
        className="flex flex-col gap-2"
      >
        <label htmlFor="holerite-pdf" className="text-base font-bold">
          Tem o holerite em PDF? (opcional)
        </label>
        <p className="text-sm text-texto-suave">
          Envie o PDF e eu tento preencher os campos abaixo. Funciona só com PDF
          de texto — foto ou digitalização não dá. Nada é guardado; é só para
          preencher.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <input
            id="holerite-pdf"
            type="file"
            accept="application/pdf,.pdf"
            className="rounded-xl border border-borda bg-white p-2 text-sm"
          />
          <Botao type="submit" variante="secundario" disabled={analisando}>
            {analisando ? "Lendo..." : "Ler o PDF"}
          </Botao>
        </div>
        {msgAnalise ? (
          <p className="text-sm font-semibold text-acento-escuro">{msgAnalise}</p>
        ) : null}
      </form>

      {/* Formulário guiado */}
      <form action={formAction} className="flex flex-col gap-5">
        <Grupo
          titulo="Proventos (o que você recebe)"
          ajuda="Salário, auxílio creche, hora extra, adicional, comissão..."
          linhas={proventos}
          setLinhas={setProventos}
          exemploDesc="Auxílio creche"
        />

        <Grupo
          titulo="Descontos (o que sai antes de cair na conta)"
          ajuda="INSS, Imposto de Renda, plano de saúde, vale-transporte, adiantamento..."
          linhas={descontos}
          setLinhas={setDescontos}
          exemploDesc="INSS"
        />

        <div className="rounded-2xl bg-superficie p-4">
          <div className="flex flex-wrap justify-between gap-3 text-sm">
            <span>
              Proventos:{" "}
              <strong className="tabular text-ok">{formatBRL(somaProv)}</strong>
            </span>
            <span>
              Descontos:{" "}
              <strong className="tabular text-alerta">
                −{formatBRL(somaDesc)}
              </strong>
            </span>
          </div>
          <p className="mt-2 text-lg">
            Cai na sua conta (líquido):{" "}
            <strong className={liquido > 0 ? "text-ok" : "text-perigo"}>
              {formatBRL(liquido)}
            </strong>
          </p>
          <p className="mt-1 text-xs text-texto-suave">
            É esse valor líquido que entra como a sua receita do mês.
          </p>
          {divergente ? (
            <p className="mt-2 text-sm font-semibold text-alerta">
              Atenção: o holerite mostrou líquido de {formatBRL(liquidoImpresso!)}
              , mas a soma aqui deu {formatBRL(liquido)}. Confira se faltou algum
              item.
            </p>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <CampoTexto
            id="sal-descricao"
            name="descricao"
            rotulo="Nome dessa receita"
            defaultValue={
              receitaInicial?.descricao.replace(/\s*\(líquido\)\s*$/, "") ||
              "Salário"
            }
          />
          <CampoTexto
            id="sal-dia"
            name="dia"
            rotulo="Dia em que o salário cai"
            type="number"
            min={1}
            max={31}
            defaultValue={receitaInicial?.dia ?? 5}
          />
        </div>

        {/* Campos ocultos com os itens, para o servidor */}
        {proventos.map((l, i) => (
          <input key={`p${i}`} type="hidden" name="proventoDescricao" value={l.descricao} readOnly />
        ))}
        {proventos.map((l, i) => (
          <input key={`pv${i}`} type="hidden" name="proventoValor" value={l.valor} readOnly />
        ))}
        {descontos.map((l, i) => (
          <input key={`d${i}`} type="hidden" name="descontoDescricao" value={l.descricao} readOnly />
        ))}
        {descontos.map((l, i) => (
          <input key={`dv${i}`} type="hidden" name="descontoValor" value={l.valor} readOnly />
        ))}

        <div className="flex flex-wrap items-center gap-3">
          <Botao type="submit" disabled={salvando}>
            {salvando
              ? "Salvando..."
              : editando
                ? "Salvar alterações"
                : "Registrar salário"}
          </Botao>
          {editando && aoConcluir ? (
            <Botao type="button" variante="fantasma" onClick={aoConcluir}>
              Cancelar
            </Botao>
          ) : null}
          {estado?.ok ? (
            <span className="text-sm font-semibold text-ok">
              {estado.mensagem}
            </span>
          ) : null}
        </div>

        {estado && !estado.ok && estado.erro ? (
          <Aviso tipo="perigo">{estado.erro}</Aviso>
        ) : null}
      </form>
    </div>
  );
}

function Grupo({
  titulo,
  ajuda,
  linhas,
  setLinhas,
  exemploDesc,
}: {
  titulo: string;
  ajuda: string;
  linhas: Linha[];
  setLinhas: (f: (l: Linha[]) => Linha[]) => void;
  exemploDesc: string;
}) {
  const upd = (i: number, campo: keyof Linha, v: string) =>
    setLinhas((ls) => ls.map((l, idx) => (idx === i ? { ...l, [campo]: v } : l)));
  const add = () =>
    setLinhas((ls) => [...ls, { descricao: "", valor: "" }]);
  const rm = (i: number) => setLinhas((ls) => ls.filter((_, idx) => idx !== i));

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-base font-bold text-texto">{titulo}</legend>
      <p className="text-sm text-texto-suave">{ajuda}</p>
      {linhas.length === 0 ? (
        <p className="text-sm text-texto-suave">
          Nenhum item. Se não tem descontos, pode deixar vazio.
        </p>
      ) : null}
      {linhas.map((l, i) => (
        <div key={i} className="flex flex-wrap items-center gap-2">
          <input
            aria-label={`${titulo} — descrição ${i + 1}`}
            value={l.descricao}
            onChange={(e) => upd(i, "descricao", e.target.value)}
            placeholder={exemploDesc}
            className="min-w-40 flex-1 rounded-xl border border-borda bg-white px-3 py-2 text-base"
          />
          <div className="flex items-stretch overflow-hidden rounded-xl border border-borda bg-white">
            <span className="flex items-center bg-fundo px-2 text-sm font-semibold text-texto-suave">
              R$
            </span>
            <input
              aria-label={`${titulo} — valor ${i + 1}`}
              value={l.valor}
              onChange={(e) => upd(i, "valor", e.target.value)}
              inputMode="decimal"
              placeholder="0,00"
              className="w-28 px-2 py-2 text-base tabular outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => rm(i)}
            className="rounded-lg px-2 py-1 text-sm font-semibold text-perigo hover:bg-perigo/10"
          >
            remover
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="self-start rounded-lg border border-acento/40 px-3 py-1.5 text-sm font-semibold text-acento-escuro hover:bg-acento/5"
      >
        + adicionar item
      </button>
    </fieldset>
  );
}
