import { formatBRL, formatPct } from "@/lib/format";
import type { LinhaCategoria } from "@/lib/calculos";

/**
 * Comparação de magnitude por categoria: barras horizontais ordenadas,
 * um único tom (o comprimento é que codifica o valor). Sem legenda.
 */
export function BarraCategorias({
  categorias,
  maximo,
}: {
  categorias: LinhaCategoria[];
  maximo: number;
}) {
  if (categorias.length === 0) {
    return (
      <p className="text-sm text-texto-suave">
        Nenhum gasto cadastrado neste mês ainda.
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-3">
      {categorias.map((c) => (
        <li key={c.categoria}>
          <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
            <span className="font-semibold text-texto">
              {c.emoji} {c.categoria}
            </span>
            <span className="tabular text-texto-suave">
              {formatBRL(c.total)}{" "}
              <span className="text-xs">({formatPct(c.pctDespesas)})</span>
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-fundo">
            <div
              className="h-full rounded-full bg-acento"
              style={{
                width: `${maximo > 0 ? Math.max(3, (c.total / maximo) * 100) : 0}%`,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
