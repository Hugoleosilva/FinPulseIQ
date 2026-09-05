import type { z } from "zod";

export type EstadoForm =
  | { ok: false; erro?: string; campos?: Record<string, string> }
  | { ok: true; mensagem?: string }
  | null;

/** Primeira mensagem de erro por campo, no formato que os formulários esperam. */
export function camposDeErro(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const campo = issue.path[0];
    if (typeof campo === "string" && !(campo in out)) {
      out[campo] = issue.message;
    }
  }
  return out;
}

export function primeiroErroGeral(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Confira os campos destacados.";
}
