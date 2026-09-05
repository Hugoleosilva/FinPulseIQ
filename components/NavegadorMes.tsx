import Link from "next/link";
import { deslocaMes, nomeMes } from "@/lib/format";

export function NavegadorMes({
  chaveMes,
  base = "/mes",
  sufixo = "",
}: {
  chaveMes: string;
  base?: string;
  sufixo?: string;
}) {
  const anterior = deslocaMes(chaveMes, -1);
  const proximo = deslocaMes(chaveMes, 1);
  const seta =
    "flex h-10 w-10 items-center justify-center rounded-lg border border-borda text-lg font-bold text-texto-suave hover:bg-fundo";
  return (
    <div className="flex items-center gap-3">
      <Link href={`${base}/${anterior}${sufixo}`} className={seta} aria-label="Mês anterior">
        ‹
      </Link>
      <span className="min-w-40 text-center text-lg font-extrabold capitalize">
        {nomeMes(chaveMes)}
      </span>
      <Link href={`${base}/${proximo}${sufixo}`} className={seta} aria-label="Próximo mês">
        ›
      </Link>
    </div>
  );
}
