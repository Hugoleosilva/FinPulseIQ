import { describe, it, expect } from "vitest";
import type { Mes, Despesa } from "../tipos";
import {
  resumoMes,
  fluxoCaixa,
  oportunidades,
  economiaPotencialTotal,
  simular,
  nivelSaude,
} from "../calculos";

function d(p: Partial<Despesa>): Despesa {
  return {
    id: Math.random().toString(36).slice(2),
    descricao: "x",
    valor: 0,
    dia: 10,
    categoria: "Outros",
    subcategoria: "Diversos",
    meioPagamento: "debito",
    essencialidade: "reduzivel",
    recorrente: false,
    parcela: null,
    cartaoId: null,
    ...p,
  };
}

// Cenário do enunciado: entra R$ 5.000, saem R$ 4.700, sobra R$ 300.
const mes: Mes = {
  userId: "u1",
  key: "2026-09",
  saldoInicial: 0,
  criadoEm: "",
  atualizadoEm: "",
  receitas: [
    { id: "r1", descricao: "Salário", valor: 5000, dia: 5, tipo: "fixa" },
  ],
  despesas: [
    d({ categoria: "Moradia", subcategoria: "Aluguel", valor: 1200, essencialidade: "essencial", dia: 10 }),
    d({ categoria: "Alimentação", subcategoria: "Mercado", valor: 550, essencialidade: "essencial", dia: 8 }),
    d({ categoria: "Alimentação", subcategoria: "Restaurante", valor: 300, essencialidade: "reduzivel", dia: 15 }),
    d({ categoria: "Alimentação", subcategoria: "Delivery (iFood, etc.)", valor: 180, essencialidade: "desnecessario", dia: 20 }),
    d({ categoria: "Alimentação", subcategoria: "Lanches / fast-food", valor: 70, essencialidade: "desnecessario", dia: 25 }),
    d({ categoria: "Fatura de cartão (sem detalhar)", subcategoria: "Fatura do mês", valor: 900, essencialidade: "reduzivel", meioPagamento: "cartao", dia: 12 }),
    d({ categoria: "Transporte", subcategoria: "Combustível", valor: 400, essencialidade: "essencial", dia: 6 }),
    d({ categoria: "Assinaturas", subcategoria: "Streaming (Netflix, etc.)", valor: 120, essencialidade: "reduzivel", dia: 3 }),
    d({ categoria: "Assinaturas", subcategoria: "Música (Spotify, etc.)", valor: 40, essencialidade: "desnecessario", dia: 3 }),
    d({ categoria: "Assinaturas", subcategoria: "Aplicativos / assinaturas digitais", valor: 40, essencialidade: "desnecessario", dia: 3 }),
    d({ categoria: "Compras", subcategoria: "Roupas", valor: 400, essencialidade: "reduzivel", dia: 18 }),
    d({ categoria: "Compras", subcategoria: "Eletrônicos", valor: 300, essencialidade: "desnecessario", dia: 18 }),
    d({ categoria: "Saúde", subcategoria: "Farmácia / remédios", valor: 200, essencialidade: "essencial", dia: 9 }),
  ],
};

describe("resumoMes", () => {
  const r = resumoMes(mes);

  it("calcula receita, despesa e saldo", () => {
    expect(r.receitaTotal).toBe(5000);
    expect(r.despesaTotal).toBe(4700);
    expect(r.saldo).toBe(300);
  });

  it("identifica o comprometimento com cartão", () => {
    expect(r.gastoCartao).toBe(900);
    expect(r.comprometimentoCartao).toBeCloseTo(0.18, 2);
  });

  it("separa essenciais de não essenciais", () => {
    // 1200 + 550 + 400 + 200 = 2350
    expect(r.despesasEssenciais).toBe(2350);
  });

  it("abre a composição de Alimentação", () => {
    const alim = r.porCategoria.find((c) => c.categoria === "Alimentação")!;
    expect(alim.total).toBe(1100);
    expect(alim.foraDeCasa).toBe(550); // 300 + 180 + 70
  });
});

describe("oportunidades", () => {
  const ops = oportunidades(mes);

  it("não sugere cortar categorias 100% essenciais", () => {
    for (const nome of ["Moradia", "Transporte", "Saúde"]) {
      const o = ops.find((x) => x.categoria === nome);
      expect(o?.potencial ?? 0).toBe(0);
    }
  });

  it("coloca uma categoria redutível como prioridade máxima", () => {
    expect(["Alimentação", "Compras"]).toContain(ops[0].categoria);
    expect(ops[0].prioridade).toBe("alta");
  });

  it("aponta o foco do vazamento em Alimentação", () => {
    const alim = ops.find((o) => o.categoria === "Alimentação")!;
    expect(alim.foco).toContain("fora de casa");
  });

  it("estima uma economia total plausível", () => {
    const total = economiaPotencialTotal(ops);
    expect(total).toBeGreaterThanOrEqual(500);
    expect(total).toBeLessThanOrEqual(950);
  });
});

describe("simular", () => {
  it("aplica a economia das categorias escolhidas ao saldo", () => {
    const ops = oportunidades(mes);
    const top3 = ops.slice(0, 3).map((o) => o.categoria);
    const s = simular(mes, ops, top3);
    const esperado = ops
      .slice(0, 3)
      .reduce((acc, o) => acc + o.potencial, 0);

    expect(s.economia).toBe(esperado);
    expect(s.saldoDepois).toBe(s.saldoAntes + esperado);
    expect(s.despesaDepois).toBe(s.despesaAntes - esperado);
  });
});

describe("fluxoCaixa", () => {
  it("acumula entradas e saídas por dia", () => {
    const f = fluxoCaixa(mes);
    expect(f.dias).toHaveLength(31);
    expect(f.dias[30].saldoAcumulado).toBe(300); // fim do mês = saldo final
  });

  it("marca dias no vermelho quando as saídas vêm antes da receita", () => {
    const f = fluxoCaixa(mes);
    // Combustível (dia 6) e Netflix (dia 3) acontecem antes do salário (dia 5)?
    // Netflix dia 3 => saldo -200 antes do salário.
    expect(f.diasNegativos).toContain(3);
    expect(f.menorSaldo).toBeLessThan(0);
  });
});

describe("nivelSaude", () => {
  it("classifica o cenário do enunciado como apertado", () => {
    const r = resumoMes(mes);
    const f = fluxoCaixa(mes);
    const n = nivelSaude({ resumo: r, fluxo: f, compromissoMensalFuturo: 0 });
    expect(n.score).toBeGreaterThan(0);
    expect(n.score).toBeLessThan(65);
    expect(["normal", "ruim", "critico"]).toContain(n.faixa);
    expect(n.componentes).toHaveLength(5);
  });
});
