import { formatBRLCurto, nomeMes } from "@/lib/format";
import type { DiaFluxo, Faixa, PontoHistorico } from "@/lib/calculos";

// ---------------------------------------------------------------------------
// Fluxo de caixa: uma série só (saldo acumulado dia a dia), área sob a linha.
// ---------------------------------------------------------------------------

export function GraficoFluxo({ dias }: { dias: DiaFluxo[] }) {
  const W = 640;
  const H = 200;
  const P = 28;

  const valores = dias.map((d) => d.saldoAcumulado);
  const maxV = Math.max(0, ...valores);
  const minV = Math.min(0, ...valores);
  const span = maxV - minV || 1;

  const x = (i: number) => P + (i / (dias.length - 1)) * (W - 2 * P);
  const y = (v: number) => P + (1 - (v - minV) / span) * (H - 2 * P);

  const linha = dias.map((d, i) => `${x(i)},${y(d.saldoAcumulado)}`).join(" ");
  const area = `${x(0)},${y(minV)} ${linha} ${x(dias.length - 1)},${y(minV)}`;

  const idxMin = valores.indexOf(Math.min(...valores));

  return (
    <figure className="w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label="Saldo projetado ao longo do mês"
      >
        {/* linha do zero */}
        <line
          x1={P}
          x2={W - P}
          y1={y(0)}
          y2={y(0)}
          stroke="var(--borda)"
          strokeWidth="1.5"
        />
        <polygon points={area} fill="var(--acento)" opacity="0.12" />
        <polyline
          points={linha}
          fill="none"
          stroke="var(--acento)"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {minV < 0 && (
          <>
            <circle cx={x(idxMin)} cy={y(valores[idxMin])} r="4" fill="var(--perigo)" />
            <text
              x={x(idxMin)}
              y={y(valores[idxMin]) + 16}
              textAnchor="middle"
              fontSize="12"
              fontWeight="700"
              fill="var(--perigo)"
            >
              {formatBRLCurto(valores[idxMin])} (dia {dias[idxMin].dia})
            </text>
          </>
        )}
        <text x={P} y={H - 6} fontSize="11" fill="var(--texto-suave)">
          dia 1
        </text>
        <text
          x={W - P}
          y={H - 6}
          fontSize="11"
          textAnchor="end"
          fill="var(--texto-suave)"
        >
          dia 31
        </text>
      </svg>
    </figure>
  );
}

// ---------------------------------------------------------------------------
// Sobra mês a mês: barras, cor pelo nível de saúde do mês.
// ---------------------------------------------------------------------------

const COR_FAIXA: Record<Faixa, string> = {
  otimo: "var(--ok)",
  bom: "var(--ok)",
  normal: "var(--alerta)",
  ruim: "var(--alerta)",
  critico: "var(--perigo)",
};

export function GraficoSaldoMensal({ pontos }: { pontos: PontoHistorico[] }) {
  if (pontos.length === 0) {
    return (
      <p className="text-sm text-texto-suave">
        Ainda não há meses suficientes para mostrar a evolução.
      </p>
    );
  }

  const maxAbs = Math.max(1, ...pontos.map((p) => Math.abs(p.saldo)));

  return (
    <div className="flex items-end gap-2 overflow-x-auto pb-2">
      {pontos.map((p) => {
        const altura = (Math.abs(p.saldo) / maxAbs) * 90 + 6;
        const negativo = p.saldo < 0;
        return (
          <div
            key={p.key}
            className="flex min-w-16 flex-1 flex-col items-center gap-1"
          >
            <span
              className="tabular text-xs font-bold"
              style={{ color: negativo ? "var(--perigo)" : "var(--texto)" }}
            >
              {formatBRLCurto(p.saldo)}
            </span>
            <div
              className="w-full rounded-lg"
              style={{
                height: altura,
                backgroundColor: COR_FAIXA[p.faixa],
                opacity: negativo ? 0.5 : 1,
              }}
            />
            <span className="text-center text-[11px] leading-tight text-texto-suave">
              {nomeMes(p.key).replace(" de ", "/")}
            </span>
          </div>
        );
      })}
    </div>
  );
}
