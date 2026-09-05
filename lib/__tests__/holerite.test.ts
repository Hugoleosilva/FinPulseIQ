import { describe, it, expect } from "vitest";
import { interpretarTextoHolerite } from "../holerite";

const TEXTO = `
DEMONSTRATIVO DE PAGAMENTO - SETEMBRO/2026
Cod  Descricao              Referencia  Proventos   Descontos
001  SALARIO BASE           220,00      4.000,00
050  AUXILIO CRECHE                        500,00
120  HORA EXTRA 50%          6,00           180,00
900  INSS                   11,00                     440,00
905  IRRF                    7,50                      120,00
910  PLANO DE SAUDE                                    180,00
920  VALE TRANSPORTE                                    96,00
     TOTAL DE VENCIMENTOS                4.680,00
     TOTAL DE DESCONTOS                               836,00
     VALOR LIQUIDO                                   3.844,00
     BASE INSS 4.180,00  BASE FGTS 4.680,00  FGTS DO MES 374,40
`;

// Formato com rótulos e valores em linhas separadas no rodapé,
// e desconto de "cooparticipação" (só pega pelo código 2xxx).
const TEXTO_COLUNAS = `
Codigo Descricao Referencia Provento Desconto
1000 Salario Mensal 200,00 4.083,64
1038 Auxilio Creche CCT 0,00 572,50
1322 Auxilio Idioma 0,00 300,00
1448 Ajuda de Custo - Home Office 0,00 140,70
2000 INSS Normal 12,00 378,62
2114 Seguro de Vida 0,00 1,93
2193 Assist. Medica Titular BRADESCO 0,00 8,96
2202 Desc cooparticipacao. BRADESCO 0,00 13,48
2216 1o Emprestimo Credito do Trabalhador 0,00 901,54
Base para FGTS FGTS do Mes Total de Proventos
4.083,64 326,69 5.096,84
Base Calc. IRRF Pensao Alimenticia Judicial Total de Descontos
4.083,64 0,00 1.339,55
Sal. Contribuicao. INSS Base IR PLR Anual Liquido a Receber
4.083,64 0,00 3.757,29
`;

describe("interpretarTextoHolerite", () => {
  const r = interpretarTextoHolerite(TEXTO);

  it("separa proventos", () => {
    const nomes = r.proventos.map((p) => p.descricao.toLowerCase());
    expect(nomes.some((n) => n.includes("salario"))).toBe(true);
    expect(nomes.some((n) => n.includes("auxilio creche"))).toBe(true);
    expect(nomes.some((n) => n.includes("hora extra"))).toBe(true);
    expect(r.proventos.reduce((a, p) => a + p.valor, 0)).toBeCloseTo(4680, 1);
  });

  it("separa descontos", () => {
    const nomes = r.descontos.map((d) => d.descricao.toLowerCase());
    expect(nomes.some((n) => n.includes("inss"))).toBe(true);
    expect(nomes.some((n) => n.includes("irrf"))).toBe(true);
    expect(nomes.some((n) => n.includes("plano de saude"))).toBe(true);
    expect(nomes.some((n) => n.includes("vale transporte"))).toBe(true);
    expect(r.descontos.reduce((a, d) => a + d.valor, 0)).toBeCloseTo(836, 1);
  });

  it("ignora totais e bases (não conta FGTS como desconto)", () => {
    const todos = [...r.proventos, ...r.descontos].map((x) =>
      x.descricao.toLowerCase(),
    );
    expect(todos.some((n) => n.includes("total de"))).toBe(false);
    expect(todos.some((n) => n.includes("base inss"))).toBe(false);
    expect(todos.some((n) => n.includes("base fgts"))).toBe(false);
    expect(todos.some((n) => n.includes("fgts"))).toBe(false);
  });

  it("detecta o líquido impresso e ele bate com a conta", () => {
    expect(r.liquidoDetectado).toBeCloseTo(3844, 1);
    const calc =
      r.proventos.reduce((a, p) => a + p.valor, 0) -
      r.descontos.reduce((a, d) => a + d.valor, 0);
    expect(calc).toBeCloseTo(r.liquidoDetectado!, 1);
  });
});

describe("interpretarTextoHolerite — rótulos e valores em linhas separadas", () => {
  const r = interpretarTextoHolerite(TEXTO_COLUNAS);
  const somaP = r.proventos.reduce((a, p) => a + p.valor, 0);
  const somaD = r.descontos.reduce((a, d) => a + d.valor, 0);

  it("pega todos os proventos (total 5.096,84)", () => {
    expect(r.proventos).toHaveLength(4);
    expect(somaP).toBeCloseTo(5096.84, 2);
  });

  it("pega o desconto de cooparticipação (só identificável pelo código 2xxx)", () => {
    const coop = r.descontos.find((d) =>
      d.descricao.toLowerCase().includes("cooparticipacao"),
    );
    expect(coop?.valor).toBeCloseTo(13.48, 2);
    expect(r.descontos).toHaveLength(5);
    // 378,62 + 1,93 + 8,96 + 13,48 + 901,54
    expect(somaD).toBeCloseTo(1304.53, 2);
  });

  it("detecta o líquido impresso mesmo com o valor na linha seguinte", () => {
    expect(r.liquidoDetectado).toBeCloseTo(3757.29, 2);
  });

  it("não confunde totais/bases do rodapé com lançamentos", () => {
    const nomes = [...r.proventos, ...r.descontos].map((x) =>
      x.descricao.toLowerCase(),
    );
    expect(nomes.some((n) => n.includes("total"))).toBe(false);
    expect(nomes.some((n) => n.includes("base"))).toBe(false);
    expect(nomes.some((n) => n.includes("contribuicao"))).toBe(false);
  });
});
