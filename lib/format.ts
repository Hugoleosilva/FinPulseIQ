// Funções de formatação para exibição (pt-BR).

const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

export function formatBRL(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  });
}

/** Versão curta, sem centavos, para gráficos e títulos. */
export function formatBRLCurto(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

export function formatPct(fracao: number, casas = 0): string {
  return `${(fracao * 100).toFixed(casas)}%`;
}

/** "2026-09" -> "setembro de 2026" */
export function nomeMes(key: string): string {
  const [ano, mes] = key.split("-").map(Number);
  return `${MESES[mes - 1]} de ${ano}`;
}

/** "2026-09" -> "setembro-2026" (para nome de arquivo) */
export function slugMes(key: string): string {
  const [ano, mes] = key.split("-").map(Number);
  return `${MESES[mes - 1]}-${ano}`;
}

/** Chave do mês atual, ex.: "2026-09" */
export function mesAtualKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Valida o formato "AAAA-MM". */
export function keyValida(key: string): boolean {
  if (!/^\d{4}-\d{2}$/.test(key)) return false;
  const mes = Number(key.slice(5));
  return mes >= 1 && mes <= 12;
}

/** Move a chave do mês para frente (n>0) ou para trás (n<0). */
export function deslocaMes(key: string, n: number): string {
  const [ano, mes] = key.split("-").map(Number);
  const d = new Date(ano, mes - 1 + n, 1);
  return mesAtualKey(d);
}
