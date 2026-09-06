import { formatBRL, formatPct } from "@/lib/format";
import type { Oportunidade, Prioridade } from "@/lib/calculos";

const SELO: Record<Prioridade, { icone: string; texto: string; classe: string }> =
  {
    alta: { icone: "🔴", texto: "Alta", classe: "text-perigo" },
    media: { icone: "🟠", texto: "Média", classe: "text-alerta" },
    baixa: { icone: "🟢", texto: "Baixa", classe: "text-ok" },
  };

export function TabelaOportunidades({ ops }: { ops: Oportunidade[] }) {
  const comPotencial = ops.filter((o) => o.potencial > 0);
  if (comPotencial.length === 0) {
    return (
      <p className="text-texto-suave">
        Não encontramos gastos com espaço claro para redução neste mês.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[36rem] border-collapse text-sm">
        <thead>
          <tr className="border-b border-borda text-left text-texto-suave">
            <th className="py-2 pr-3 font-semibold">Prioridade</th>
            <th className="py-2 pr-3 font-semibold">Área</th>
            <th className="py-2 pr-3 text-right font-semibold">Gasto no mês</th>
            <th className="py-2 pr-3 text-right font-semibold">
              Economia possível
            </th>
            <th className="py-2 font-semibold">Onde está o vazamento</th>
          </tr>
        </thead>
        <tbody>
          {comPotencial.map((o) => {
            const s = SELO[o.prioridade];
            return (
              <tr key={o.categoria} className="border-b border-borda/60">
                <td className={`py-3 pr-3 font-bold ${s.classe}`}>
                  {s.icone} {s.texto}
                </td>
                <td className="py-3 pr-3 font-semibold">
                  {o.emoji} {o.categoria}
                </td>
                <td className="tabular py-3 pr-3 text-right">
                  {formatBRL(o.gasto)}
                  {o.pctRenda > 0 ? (
                    <span className="block text-xs text-texto-suave">
                      {formatPct(o.pctRenda)} da renda
                    </span>
                  ) : null}
                </td>
                <td className="tabular py-3 pr-3 text-right font-extrabold text-acento-escuro">
                  até {formatBRL(o.potencial)}
                  {o.crescimento > 0.15 ? (
                    <span className="block text-xs font-semibold text-alerta">
                      ↑ {formatPct(o.crescimento)} vs. média
                    </span>
                  ) : null}
                </td>
                <td className="py-3 text-texto-suave">{o.foco ?? "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
