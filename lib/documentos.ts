// Constantes de documentos — sem dependência de servidor, seguras no cliente.

export const TAMANHO_MAX_DOC = 8 * 1024 * 1024; // 8 MB

export const TIPOS_ACEITOS_DOC: Record<string, string> = {
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/heic": ".heic",
};

export type TipoDocumento =
  | "fatura_cartao"
  | "boleto"
  | "nota_fiscal"
  | "conta_servico"
  | "comprovante"
  | "contrato"
  | "outro";

export const ROTULO_TIPO_DOC: Record<TipoDocumento, string> = {
  fatura_cartao: "Fatura de cartão",
  boleto: "Boleto",
  nota_fiscal: "Nota fiscal",
  conta_servico: "Conta de serviço (luz, água, internet...)",
  comprovante: "Comprovante de pagamento",
  contrato: "Contrato",
  outro: "Outro",
};
