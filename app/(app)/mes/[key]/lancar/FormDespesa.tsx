"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { adicionarDespesa } from "@/app/actions/lancamentos";
import { CampoTexto, CampoSelect } from "@/components/campos";
import { Botao, Aviso } from "@/components/ui";
import {
  CATEGORIAS,
  getCategoria,
  ROTULO_ESSENCIALIDADE,
  ROTULO_MEIO_PAGAMENTO,
} from "@/lib/categorias";
import type { EstadoForm } from "@/lib/forms";
import type { Cartao } from "@/lib/tipos";

export function FormDespesa({
  chaveMes,
  cartoes,
}: {
  chaveMes: string;
  cartoes: Cartao[];
}) {
  const action = adicionarDespesa.bind(null, chaveMes);
  const [estado, formAction, pendente] = useActionState<EstadoForm, FormData>(
    action,
    null,
  );
  const ref = useRef<HTMLFormElement>(null);
  const campos = estado && !estado.ok ? estado.campos : undefined;

  const [categoria, setCategoria] = useState(CATEGORIAS[0].nome);
  const [meio, setMeio] = useState("debito");
  const [parcelado, setParcelado] = useState(false);

  const def = useMemo(() => getCategoria(categoria), [categoria]);

  useEffect(() => {
    if (estado?.ok) {
      ref.current?.reset();
      // Volta o formulário ao estado inicial após o servidor confirmar.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setParcelado(false);
    }
  }, [estado]);

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
        defaultValue={10}
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
        defaultValue={def?.essencialidadePadrao}
        key={categoria}
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

      <div className="sm:col-span-2 flex flex-col gap-3 rounded-xl border border-borda bg-white p-3">
        <label className="flex items-center gap-3 font-semibold">
          <input
            type="checkbox"
            checked={parcelado}
            onChange={(e) => setParcelado(e.target.checked)}
            className="h-5 w-5 accent-acento"
          />
          Essa compra foi parcelada
        </label>
        {parcelado ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <CampoTexto
              id="d-parcela-atual"
              name="parcelaAtual"
              rotulo="Qual parcela é esta?"
              type="number"
              min={1}
              max={360}
              defaultValue={1}
              exemplo="Se é a 2ª de 10, escreva 2"
            />
            <CampoTexto
              id="d-parcela-total"
              name="parcelaTotal"
              rotulo="Total de parcelas"
              type="number"
              min={2}
              max={360}
              defaultValue={10}
              exemplo="10"
            />
          </div>
        ) : null}
        <label className="flex items-center gap-3 text-sm text-texto-suave">
          <input
            type="checkbox"
            name="recorrente"
            className="h-5 w-5 accent-acento"
          />
          Esse gasto acontece todo mês (conta fixa, assinatura...)
        </label>
      </div>

      <div className="sm:col-span-2 flex items-center gap-3">
        <Botao type="submit" disabled={pendente}>
          {pendente ? "Salvando..." : "Adicionar gasto"}
        </Botao>
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
