import type { Faixa } from "@/lib/calculos";

const CORES: Record<Faixa, { bg: string; texto: string; ponto: string }> = {
  otimo: { bg: "bg-ok/10", texto: "text-ok", ponto: "bg-ok" },
  bom: { bg: "bg-ok/10", texto: "text-ok", ponto: "bg-ok" },
  normal: { bg: "bg-alerta/10", texto: "text-alerta", ponto: "bg-alerta" },
  ruim: { bg: "bg-alerta/10", texto: "text-alerta", ponto: "bg-alerta" },
  critico: { bg: "bg-perigo/10", texto: "text-perigo", ponto: "bg-perigo" },
};

export function SeloNivel({
  faixa,
  rotulo,
  score,
  tamanho = "md",
}: {
  faixa: Faixa;
  rotulo: string;
  score: number;
  tamanho?: "md" | "lg";
}) {
  const c = CORES[faixa];
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full ${c.bg} ${c.texto} ${
        tamanho === "lg" ? "px-4 py-2 text-lg" : "px-3 py-1 text-sm"
      } font-extrabold`}
    >
      <span className={`h-2.5 w-2.5 rounded-full ${c.ponto} animate-pulse`} />
      {rotulo}
      <span className="font-bold opacity-70">{score}/100</span>
    </span>
  );
}
