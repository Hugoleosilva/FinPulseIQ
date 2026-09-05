import type { ComponentProps, ReactNode } from "react";

function Envelope({
  id,
  rotulo,
  ajuda,
  exemplo,
  erro,
  children,
}: {
  id: string;
  rotulo: ReactNode;
  ajuda?: ReactNode;
  exemplo?: string;
  erro?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-base font-bold text-texto">
        {rotulo}
      </label>
      {ajuda ? (
        <p className="text-sm text-texto-suave">{ajuda}</p>
      ) : null}
      {children}
      {exemplo ? (
        <p className="text-xs text-texto-suave">Exemplo: {exemplo}</p>
      ) : null}
      {erro ? (
        <p className="text-sm font-semibold text-perigo">{erro}</p>
      ) : null}
    </div>
  );
}

const inputBase =
  "w-full rounded-xl border border-borda bg-white px-4 py-3 text-base text-texto placeholder:text-texto-suave/60 focus:border-acento";

export function CampoTexto({
  id,
  rotulo,
  ajuda,
  exemplo,
  erro,
  prefixo,
  ...props
}: ComponentProps<"input"> & {
  id: string;
  rotulo: ReactNode;
  ajuda?: ReactNode;
  exemplo?: string;
  erro?: string;
  prefixo?: string;
}) {
  return (
    <Envelope id={id} rotulo={rotulo} ajuda={ajuda} exemplo={exemplo} erro={erro}>
      {prefixo ? (
        <div className="flex items-stretch overflow-hidden rounded-xl border border-borda bg-white focus-within:border-acento">
          <span className="flex items-center bg-fundo px-3 text-base font-semibold text-texto-suave">
            {prefixo}
          </span>
          <input
            id={id}
            {...props}
            className="w-full border-0 px-3 py-3 text-base text-texto outline-none tabular"
          />
        </div>
      ) : (
        <input id={id} {...props} className={inputBase} />
      )}
    </Envelope>
  );
}

export function CampoSelect({
  id,
  rotulo,
  ajuda,
  erro,
  children,
  ...props
}: ComponentProps<"select"> & {
  id: string;
  rotulo: ReactNode;
  ajuda?: ReactNode;
  erro?: string;
}) {
  return (
    <Envelope id={id} rotulo={rotulo} ajuda={ajuda} erro={erro}>
      <select id={id} {...props} className={inputBase}>
        {children}
      </select>
    </Envelope>
  );
}

export interface OpcaoRadio {
  valor: string;
  titulo: string;
  descricao?: string;
}

export function CampoRadioCartoes({
  name,
  rotulo,
  ajuda,
  opcoes,
  valorPadrao,
  erro,
}: {
  name: string;
  rotulo: ReactNode;
  ajuda?: ReactNode;
  opcoes: OpcaoRadio[];
  valorPadrao?: string;
  erro?: string;
}) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="text-base font-bold text-texto">{rotulo}</legend>
      {ajuda ? <p className="text-sm text-texto-suave">{ajuda}</p> : null}
      <div className="mt-1 grid gap-2">
        {opcoes.map((o) => (
          <label
            key={o.valor}
            className="flex cursor-pointer items-start gap-3 rounded-xl border border-borda bg-white p-3 hover:border-acento/50 has-[:checked]:border-acento has-[:checked]:bg-acento/5"
          >
            <input
              type="radio"
              name={name}
              value={o.valor}
              defaultChecked={valorPadrao === o.valor}
              className="mt-1 h-5 w-5 accent-acento"
            />
            <span>
              <span className="block font-semibold text-texto">{o.titulo}</span>
              {o.descricao ? (
                <span className="block text-sm text-texto-suave">
                  {o.descricao}
                </span>
              ) : null}
            </span>
          </label>
        ))}
      </div>
      {erro ? (
        <p className="text-sm font-semibold text-perigo">{erro}</p>
      ) : null}
    </fieldset>
  );
}
