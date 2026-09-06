import type { ReactNode } from "react";

/** Card com cabeçalho recolhível (usa <details> nativo — funciona sem JS). */
export function CardColapsavel({
  titulo,
  ajuda,
  children,
  aberto = true,
}: {
  titulo: ReactNode;
  ajuda?: ReactNode;
  children: ReactNode;
  aberto?: boolean;
}) {
  return (
    <details
      open={aberto}
      className="group rounded-2xl border border-borda bg-superficie shadow-sm"
    >
      <summary className="flex cursor-pointer list-none items-start justify-between gap-3 p-5">
        <div>
          <h2 className="text-xl font-bold text-texto">{titulo}</h2>
          {ajuda ? (
            <p className="mt-1 text-sm text-texto-suave">{ajuda}</p>
          ) : null}
        </div>
        <span className="mt-1 shrink-0 text-texto-suave transition-transform group-open:rotate-180">
          ▾
        </span>
      </summary>
      <div className="px-5 pb-5">{children}</div>
    </details>
  );
}
