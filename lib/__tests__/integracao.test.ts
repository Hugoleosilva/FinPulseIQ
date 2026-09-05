import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  process.env.MONGODB_DB = "finpulse_test";
  process.env.AUTH_SECRET = "test-secret-com-mais-de-dezesseis-chars";
}, 60_000);

afterAll(async () => {
  const { getDb } = await import("../db");
  const db = await getDb();
  await (db as unknown as { client: { close: () => Promise<void> } }).client
    ?.close?.()
    .catch(() => {});
  await mongod.stop();
});

describe("fluxo completo com banco em memória", () => {
  it("cria usuário, lança dados, gera diagnóstico e importa planilha", async () => {
    const { criarUsuario, buscarUsuarioPorLogin, getMes, salvarMes } =
      await import("../repo");
    const { montarDiagnostico } = await import("../diagnostico");
    const { parsePlanilha } = await import("../planilha");
    const { gerarDiagnosticoMarkdown } = await import("../exportar");

    // 1. usuário
    const u = await criarUsuario({
      login: "hugo",
      nomeExibicao: "Hugo",
      senhaHash: "x",
    });
    expect((await buscarUsuarioPorLogin("hugo"))?.id).toBe(u.id);

    // 2. lançamentos manuais
    await salvarMes(u.id, "2026-09", {
      saldoInicial: 0,
      receitas: [
        { id: "r1", descricao: "Salário", valor: 5000, dia: 5, tipo: "fixa" },
      ],
      despesas: [
        {
          id: "d1",
          descricao: "Aluguel",
          valor: 1200,
          dia: 10,
          categoria: "Moradia",
          subcategoria: "Aluguel",
          meioPagamento: "boleto",
          cartaoId: null,
          essencialidade: "essencial",
          recorrente: true,
          parcela: null,
        },
      ],
    });

    // 3. importar planilha CSV
    const csv = [
      "tipo,descricao,valor,dia,categoria,subcategoria,classificacao,forma de pagamento",
      "Despesa,Delivery,180,20,Alimentação,Delivery,desnecessario,cartao",
      "Despesa,Mercado,550,8,Alimentação,Mercado,essencial,debito",
      "Receita,Bico,300,15,,,,",
    ].join("\n");
    const arquivo = new File([csv], "gastos.csv", { type: "text/csv" });
    const parsed = await parsePlanilha(arquivo);
    expect(parsed.erros).toHaveLength(0);
    expect(parsed.itens.filter((i) => i.tipo === "despesa")).toHaveLength(2);
    expect(parsed.itens.filter((i) => i.tipo === "receita")).toHaveLength(1);

    const mes = await getMes(u.id, "2026-09");
    await salvarMes(u.id, "2026-09", {
      receitas: [
        ...mes.receitas,
        ...parsed.itens
          .filter((i) => i.receita)
          .map((i, n) => ({ id: `ri${n}`, ...i.receita! })),
      ],
      despesas: [
        ...mes.despesas,
        ...parsed.itens
          .filter((i) => i.despesa)
          .map((i, n) => ({ id: `di${n}`, ...i.despesa! })),
      ],
    });

    // 4. diagnóstico
    const diag = await montarDiagnostico(u.id, "Hugo", "2026-09");
    expect(diag.resumo.receitaTotal).toBe(5300);
    expect(diag.resumo.despesaTotal).toBe(1930);
    expect(diag.resumo.saldo).toBe(3370);

    const md = gerarDiagnosticoMarkdown(diag);
    expect(md).toContain("Pergunta para a IA");
    expect(md).toContain("Diagnóstico financeiro");

    // Alimentação deve aparecer como oportunidade (tem delivery dispensável)
    const alim = diag.oportunidades.find((o) => o.categoria === "Alimentação");
    expect(alim && alim.potencial).toBeGreaterThan(0);
  }, 60_000);

  it("isola dados entre usuários", async () => {
    const { criarUsuario, listarMeses } = await import("../repo");
    const ang = await criarUsuario({
      login: "angelica",
      nomeExibicao: "Angélica",
      senhaHash: "y",
    });
    const meses = await listarMeses(ang.id);
    expect(meses).toHaveLength(0);
  });
});
