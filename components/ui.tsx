import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

// ---------------------------------------------------------------------------
// Cartão / bloco de conteúdo
// ---------------------------------------------------------------------------

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-borda bg-superficie p-5 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function TituloSecao({
  children,
  ajuda,
}: {
  children: ReactNode;
  ajuda?: ReactNode;
}) {
  return (
    <div className="mb-3">
      <h2 className="text-xl font-bold text-texto">{children}</h2>
      {ajuda ? (
        <p className="mt-1 text-sm text-texto-suave">{ajuda}</p>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Botões
// ---------------------------------------------------------------------------

type Variante = "primario" | "secundario" | "perigo" | "fantasma";

const estiloBotao: Record<Variante, string> = {
  primario:
    "bg-acento text-white hover:bg-acento-escuro border border-transparent",
  secundario:
    "bg-superficie text-acento-escuro border border-acento/40 hover:bg-acento/5",
  perigo:
    "bg-superficie text-perigo border border-perigo/40 hover:bg-perigo/5",
  fantasma: "bg-transparent text-texto-suave hover:text-texto border border-transparent",
};

const baseBotao =
  "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-base font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

export function Botao({
  variante = "primario",
  className = "",
  ...props
}: ComponentProps<"button"> & { variante?: Variante }) {
  return (
    <button
      {...props}
      className={`${baseBotao} ${estiloBotao[variante]} ${className}`}
    />
  );
}

export function BotaoLink({
  variante = "primario",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variante?: Variante }) {
  return (
    <Link
      {...props}
      className={`${baseBotao} ${estiloBotao[variante]} ${className}`}
    />
  );
}

// ---------------------------------------------------------------------------
// Avisos / caixas de destaque
// ---------------------------------------------------------------------------

type TipoAviso = "info" | "ok" | "alerta" | "perigo";

const estiloAviso: Record<TipoAviso, string> = {
  info: "border-acento/30 bg-acento/5 text-acento-escuro",
  ok: "border-ok/30 bg-ok/5 text-ok",
  alerta: "border-alerta/30 bg-alerta/5 text-alerta",
  perigo: "border-perigo/30 bg-perigo/5 text-perigo",
};

export function Aviso({
  tipo = "info",
  titulo,
  children,
}: {
  tipo?: TipoAviso;
  titulo?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className={`rounded-xl border p-4 text-sm ${estiloAviso[tipo]}`}>
      {titulo ? <p className="font-bold">{titulo}</p> : null}
      {children ? <div className="mt-1 leading-relaxed">{children}</div> : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Valor monetário grande
// ---------------------------------------------------------------------------

export type CorValor = "texto" | "ok" | "alerta" | "perigo" | "acentoEscuro";

export const classeCor: Record<CorValor, string> = {
  texto: "text-texto",
  ok: "text-ok",
  alerta: "text-alerta",
  perigo: "text-perigo",
  acentoEscuro: "text-acento-escuro",
};

export function ValorGrande({
  rotulo,
  valor,
  cor = "texto",
  dica,
}: {
  rotulo: string;
  valor: string;
  cor?: CorValor;
  dica?: string;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-texto-suave">{rotulo}</p>
      <p className={`tabular text-2xl font-extrabold ${classeCor[cor]}`}>
        {valor}
      </p>
      {dica ? <p className="mt-0.5 text-xs text-texto-suave">{dica}</p> : null}
    </div>
  );
}
