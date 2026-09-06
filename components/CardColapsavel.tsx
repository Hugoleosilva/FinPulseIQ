"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Card com cabeçalho recolhível (usa <details> nativo — funciona sem JS).
 *  Se receber `id`, lembra aberto/fechado no navegador entre telas. */
export function CardColapsavel({
  id,
  titulo,
  ajuda,
  children,
  aberto = true,
}: {
  id?: string;
  titulo: ReactNode;
  ajuda?: ReactNode;
  children: ReactNode;
  aberto?: boolean;
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  const chave = id ? `colapsavel:${id}` : null;

  useEffect(() => {
    if (!chave || !ref.current) return;
    try {
      const v = localStorage.getItem(chave);
      if (v === "1") ref.current.open = true;
      else if (v === "0") ref.current.open = false;
    } catch {
      /* localStorage indisponível */
    }
  }, [chave]);

  return (
    <details
      ref={ref}
      open={aberto}
      onToggle={(e) => {
        if (!chave) return;
        try {
          localStorage.setItem(chave, e.currentTarget.open ? "1" : "0");
        } catch {
          /* localStorage indisponível */
        }
      }}
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
