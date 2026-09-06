import type { ReactNode } from "react";

/** Bloco recolhível (usa <details> nativo — funciona sem JavaScript). */
export function Colapsavel({
  titulo,
  children,
  aberto = false,
  ajuda,
}: {
  titulo: ReactNode;
  children: ReactNode;
  aberto?: boolean;
  ajuda?: ReactNode;
}) {
  return (
    <details
      open={aberto}
      className="group rounded-xl border border-borda bg-fundo"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-3 font-bold text-texto">
        <span>{titulo}</span>
        <span className="text-texto-suave transition-transform group-open:rotate-180">
          ▾
        </span>
      </summary>
      <div className="border-t border-borda p-3">
        {ajuda ? (
          <p className="mb-3 text-sm text-texto-suave">{ajuda}</p>
        ) : null}
        {children}
      </div>
    </details>
  );
}
