"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Bloco recolhível (usa <details> nativo — funciona sem JavaScript).
 *  Se receber `id`, lembra aberto/fechado no navegador entre telas. */
export function Colapsavel({
  id,
  titulo,
  children,
  aberto = false,
  ajuda,
}: {
  id?: string;
  titulo: ReactNode;
  children: ReactNode;
  aberto?: boolean;
  ajuda?: ReactNode;
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
