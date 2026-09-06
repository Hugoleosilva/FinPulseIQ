// "Hoje" sempre no fuso do Brasil (America/Sao_Paulo), não no fuso do servidor.

const TZ = "America/Sao_Paulo";

export interface DataBR {
  ano: number;
  mes: number; // 1-12
  dia: number; // 1-31
}

export function agoraBrasil(base: Date = new Date()): DataBR {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(base);
  const get = (t: string) =>
    Number(partes.find((p) => p.type === t)?.value ?? "0");
  return { ano: get("year"), mes: get("month"), dia: get("day") };
}

/** "AAAA-MM" do mês corrente, no fuso do Brasil. */
export function mesAtualKeyBR(base?: Date): string {
  const { ano, mes } = agoraBrasil(base);
  return `${ano}-${String(mes).padStart(2, "0")}`;
}
