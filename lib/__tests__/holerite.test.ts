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
