"use client";

import { useMemo, useState } from "react";
import { formatBRL } from "@/lib/format";
import { classeCor, type CorValor } from "@/components/ui";

interface OpSimples {
  categoria: string;
  emoji: string;
  potencial: number;
  prioridade: "alta" | "media" | "baixa";
  foco: string | null;
}

export function Simulador({
  ops,
  saldoAntes,
  despesaAntes,
}: {
  ops: OpSimples[];
  saldoAntes: number;
  despesaAntes: number;
}) {
  const comPotencial = useMemo(
    () => ops.filter((o) => o.potencial > 0),
    [ops],
  );
  const [sel, setSel] = useState<Set<string>>(
    () => new Set(comPotencial.filter((o) => o.prioridade === "alta").map((o) => o.categoria)),
  );

  if (comPotencial.length === 0) {
    return (
      <p className="text-texto-suave">
        Sem vazamentos para simular neste mês.
      </p>
    );
  }

  const economia = comPotencial
    .filter((o) => sel.has(o.categoria))
    .reduce((a, o) => a + o.potencial, 0);

  const toggle = (cat: string) =>
    setSel((s) => {
      const n = new Set(s);
      if (n.has(cat)) n.delete(cat);
      else n.add(cat);
      return n;
    });

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-texto-suave">
        Marque as áreas em que você acha que consegue agir. Veja o efeito na
        sobra do mês. É só uma estimativa — quem decide é você.
      </p>

      <ul className="flex flex-col gap-2">
        {comPotencial.map((o) => (
          <li key={o.categoria}>
            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-borda p-3 has-[:checked]:border-acento has-[:checked]:bg-acento/5">
              <span className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={sel.has(o.categoria)}
                  onChange={() => toggle(o.categoria)}
                  className="h-5 w-5 accent-acento"
                />
                <span>
                  <span className="font-semibold">
                    {o.emoji} {o.categoria}
                  </span>
                  {o.foco ? (
                    <span className="block text-xs text-texto-suave">
                      {o.foco}
                    </span>
                  ) : null}
                </span>
              </span>
              <span className="tabular font-bold text-acento-escuro">
                −{formatBRL(o.potencial)}
              </span>
            </label>
          </li>
        ))}
      </ul>

      <div className="grid gap-3 rounded-2xl bg-fundo p-4 sm:grid-cols-3">
        <Bloco rotulo="Gastos hoje" valor={formatBRL(despesaAntes)} />
        <Bloco
          rotulo="Gastos depois de agir"
          valor={formatBRL(despesaAntes - economia)}
          cor="acentoEscuro"
        />
        <Bloco
          rotulo="Nova sobra no mês"
          valor={formatBRL(saldoAntes + economia)}
          cor={saldoAntes + economia < 0 ? "perigo" : "ok"}
        />
      </div>

      <p className="text-center text-lg">
        Potencial de melhoria:{" "}
        <strong className="text-ok">{formatBRL(economia)}/mês</strong>
      </p>
    </div>
  );
}

function Bloco({
  rotulo,
  valor,
  cor = "texto",
}: {
  rotulo: string;
  valor: string;
  cor?: CorValor;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-texto-suave">{rotulo}</p>
      <p className={`tabular text-xl font-extrabold ${classeCor[cor]}`}>
        {valor}
      </p>
    </div>
  );
}
