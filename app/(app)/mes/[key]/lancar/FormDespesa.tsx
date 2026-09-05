"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { adicionarDespesa, editarDespesa } from "@/app/actions/lancamentos";
import { CampoTexto, CampoSelect } from "@/components/campos";
import { Botao, Aviso } from "@/components/ui";
import {
  CATEGORIAS,
  getCategoria,
  ROTULO_ESSENCIALIDADE,
  ROTULO_MEIO_PAGAMENTO,
} from "@/lib/categorias";
import type { EstadoForm } from "@/lib/forms";
import type { Cartao, Despesa } from "@/lib/tipos";

const fmtValor = (n?: number) =>
  n != null
    ? n.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : undefined;

export function FormDespesa({
  chaveMes,
  cartoes,
  despesaInicial,
  aoConcluir,
}: {
  chaveMes: string;
  cartoes: Cartao[];
  despesaInicial?: Despesa;
  aoConcluir?: () => void;
}) {
  const editando = !!despesaInicial;
  const action = editando
    ? editarDespesa.bind(null, chaveMes, despesaInicial!.id)
    : adicionarDespesa.bind(null, chaveMes);
  const [estado, formAction, pendente] = useActionState<EstadoForm, FormData>(
    action,
    null,
  );
  const ref = useRef<HTMLFormElement>(null);
  const campos = estado && !estado.ok ? estado.campos : undefined;

  const [categoria, setCategoria] = useState(
    despesaInicial?.categoria ?? CATEGORIAS[0].nome,
  );
  const [meio, setMeio] = useState<string>(
    despesaInicial?.meioPagamento ?? "debito",
  );
  const [natureza, setNatureza] = useState<string>(
    despesaInicial?.natureza ?? "normal",
  );

  const def = useMemo(() => getCategoria(categoria), [categoria]);

  useEffect(() => {
    if (!estado?.ok) return;
    if (editando) {
      aoConcluir?.();
      return;
    }
    ref.current?.reset();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNatureza("normal");
  }, [estado, editando, aoConcluir]);

  return (
    <form
      ref={ref}
      action={formAction}
      className="grid gap-4 rounded-xl border border-borda bg-fundo p-4 sm:grid-cols-2"
    >
      <div className="sm:col-span-2">
        <CampoTexto
          id="d-descricao"
          name="descricao"
          rotulo="O que foi esse gasto?"
          exemplo="Compra no mercado, conta de luz, Netflix"
          defaultValue={despesaInicial?.descricao}
          required
          erro={campos?.descricao}
        />
      </div>

      <CampoTexto
        id="d-valor"
        name="valor"
        rotulo="Quanto custou?"
        prefixo="R$"
        inputMode="decimal"
        placeholder="0,00"
        exemplo="149,90"
        defaultValue={fmtValor(despesaInicial?.valor)}
        required
        erro={campos?.valor}
      />

      <CampoTexto
        id="d-dia"
        name="dia"
        rotulo="Em que dia do mês?"
        type="number"
        min={1}
        max={31}
        defaultValue={despesaInicial?.dia ?? 10}
        exemplo="Se não lembrar, chute o dia certo do mês"
        required
        erro={campos?.dia}
      />

      <CampoSelect
        id="d-categoria"
        name="categoria"
        rotulo="Qual área da sua vida?"
        ajuda={def?.ajuda}
        value={categoria}
        onChange={(e) => setCategoria(e.target.value)}
        erro={campos?.categoria}
      >
        {CATEGORIAS.map((c) => (
          <option key={c.nome} value={c.nome}>
            {c.emoji} {c.nome}
          </option>
        ))}
      </CampoSelect>

      <CampoSelect
        id="d-subcategoria"
        name="subcategoria"
        rotulo="Que tipo, dentro dessa área?"
        key={`sub-${categoria}`}
        defaultValue={
          categoria === despesaInicial?.categoria
            ? despesaInicial.subcategoria
            : undefined
        }
        erro={campos?.subcategoria}
      >
        {(def?.subcategorias ?? []).map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </CampoSelect>

      <CampoSelect
        id="d-essencialidade"
        name="essencialidade"
        rotulo="Esse gasto é...?"
        ajuda="Sua opinião sincera. É isso que ajuda o sistema a achar os vazamentos."
        defaultValue={
          categoria === despesaInicial?.categoria
            ? despesaInicial.essencialidade
            : def?.essencialidadePadrao
        }
        key={`ess-${categoria}`}
        erro={campos?.essencialidade}
      >
        <option value="essencial">
          {ROTULO_ESSENCIALIDADE.essencial} — não dá para cortar
        </option>
        <option value="reduzivel">
          {ROTULO_ESSENCIALIDADE.reduzivel} — dá para gastar menos
        </option>
        <option value="desnecessario">
          {ROTULO_ESSENCIALIDADE.desnecessario} — daria para viver sem
        </option>
      </CampoSelect>

      <CampoSelect
        id="d-meio"
        name="meioPagamento"
        rotulo="Como você pagou?"
        value={meio}
        onChange={(e) => setMeio(e.target.value)}
      >
        {Object.entries(ROTULO_MEIO_PAGAMENTO).map(([v, r]) => (
          <option key={v} value={v}>
            {r}
          </option>
        ))}
      </CampoSelect>

      {meio === "cartao" && cartoes.length > 0 ? (
        <CampoSelect id="d-cartao" name="cartaoId" rotulo="Qual cartão?">
          <option value="">Não sei / outro</option>
          {cartoes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </CampoSelect>
      ) : null}

      <fieldset className="sm:col-span-2 flex flex-col gap-2 rounded-xl border border-borda bg-white p-3">
        <legend className="text-base font-bold text-texto">
          Esse gasto é...
        </legend>
        {[
          {
            v: "normal",
            t: "Um gasto normal do mês",
            d: "Mercado, transporte, lazer, farmácia...",
          },
          {
            v: "fixa",
            t: "Uma conta fixa / assinatura",
            d: "Acontece todo mês pelo mesmo valor (aluguel, luz, Netflix...).",
          },
          {
            v: "parcelada",
            t: "Uma compra parcelada",
            d: "Dividida em várias vezes no cartão ou no carnê.",
          },
          {
            v: "extraordinaria",
            t: "Um gasto extraordinário (não se repete)",
            d: "Fora do normal: antecipei parcelas do cartão, consertei o carro, comprei um eletrodoméstico. Não conta como vazamento e o sistema mostra como o mês ficaria sem ele.",
          },
        ].map((o) => (
          <label
            key={o.v}
            className="flex cursor-pointer items-start gap-3 rounded-lg p-2 hover:bg-fundo has-[:checked]:bg-acento/5"
          >
            <input
              type="radio"
              name="natureza"
              value={o.v}
              checked={natureza === o.v}
              onChange={(e) => setNatureza(e.target.value)}
              className="mt-1 h-5 w-5 accent-acento"
            />
            <span>
              <span className="block font-semibold">{o.t}</span>
              <span className="block text-sm text-texto-suave">{o.d}</span>
            </span>
          </label>
        ))}

        {natureza === "parcelada" ? (
          <div className="mt-1 grid gap-4 sm:grid-cols-2">
            <CampoTexto
              id="d-parcela-atual"
              name="parcelaAtual"
              rotulo="Qual parcela é esta?"
              type="number"
              min={1}
              max={360}
              defaultValue={despesaInicial?.parcela?.atual ?? 1}
              exemplo="Se é a 2ª de 10, escreva 2"
            />
            <CampoTexto
              id="d-parcela-total"
              name="parcelaTotal"
              rotulo="Total de parcelas"
              type="number"
              min={2}
              max={360}
              defaultValue={despesaInicial?.parcela?.total ?? 10}
              exemplo="10"
            />
          </div>
        ) : null}
      </fieldset>

      <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
        <Botao type="submit" disabled={pendente}>
          {pendente
            ? "Salvando..."
            : editando
              ? "Salvar alterações"
              : "Adicionar gasto"}
        </Botao>
        {editando && aoConcluir ? (
          <Botao type="button" variante="fantasma" onClick={aoConcluir}>
            Cancelar
          </Botao>
        ) : null}
        {estado?.ok && estado.mensagem ? (
          <span className="text-sm font-semibold text-ok">
            {estado.mensagem}
          </span>
        ) : null}
      </div>

      {estado && !estado.ok && estado.erro ? (
        <div className="sm:col-span-2">
          <Aviso tipo="perigo">{estado.erro}</Aviso>
        </div>
      ) : null}
    </form>
  );
}
