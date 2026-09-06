import { describe, it, expect } from "vitest";
import { interpretarFaturaItau } from "../fatura";

// Trecho real de uma fatura Itaú (sem dados pessoais do cabeçalho).
const FATURA = `
Banco Itaú S.A. 341-7
Cartão 5536.XXXX.XXXX.5875
Vencimento: 09/09/2026
Total desta fatura 7.855,03

Pagamentos efetuados
DATA VALOR EM R$
06/08 Pagamento via conta -8.663,50
Total dos pagamentos -8.663,50

Lançamentos: compras e saques
NOME DO TITULAR
DATA ESTABELECIMENTO VALOR EM R$
28/08 Desc Antecipa Parcelas -0,51
20/01 LIVRARIA OBJ-C 08/08 200,00
30/01 VFITNESS 08/12 44,00
lazer RECIFE
02/08 IFD*FENG AIQIONG RESTAR 80,66
restaurante RECIFE
14/08 DL*UberRidesSao PauloBR 14,96
transporte Sao Paulo
18/08 DROGASIL 2938RECIFEBRA 153,37
saúde RECIFE
19/08 EBN *SPOTIFYCUR 12,90
outros CURITIBA
09/08 MP *EMPADASOSASCOBRA 40,00
supermercado OSASCO
21/08 GLOBO*TelecineRIO DE JA 29,90
outros RIO DE JANEIR
Lançamentos no cartão 4.343,62

Lançamentos: compras e saques
OUTRO TITULAR
DATA ESTABELECIMENTO VALOR EM R$
07/08 AdEngenhariaJA 01/12 970,87
casa JABOATAO DOS
05/08 DL*UberRidesSao PauloBR 22,40
transporte Sao Paulo
25/08 Vindi *FamilhaoBarueri 20,00
serviços Barueri
Lançamentos no cartão 3.276,80

Lançamentos internacionais
NOME DO TITULAR
DATA ESTABELECIMENTO US$ R$
04/08 ANTHROPIC* CLAUDE SUBSA 116,53
110,00 BRL 21,70
Total transações inter. em R$ 116,53

Lançamentos: produtos e serviços
DATA PRODUTOS/SERVIÇOS VALOR EM R$
06/08 ANUIDADE DIFERENCIADA 59,20
21/08 SEGURO MAXI PROTECAO 18,34
Lançamentos produtos e serviços 77,54

Total dos lançamentos atuais 7.855,03

Compras parceladas - próximas faturas
DATA ESTABELECIMENTO VALOR EM R$
25/02 PG *NASCIMENTO 08/12 169,00
`;

describe("interpretarFaturaItau", () => {
  const f = interpretarFaturaItau(FATURA);

  it("lê o cabeçalho", () => {
    expect(f.banco).toBe("Itaú");
    expect(f.cartaoFinal).toBe("5875");
    expect(f.vencimento).toBe("09/09/2026");
    expect(f.totalFatura).toBeCloseTo(7855.03, 2);
  });

  it("pega as transações e ignora pagamentos/estornos/próximas faturas", () => {
    const descs = f.transacoes.map((t) => t.descricao);
    expect(descs).not.toContain("Pagamento via conta");
    expect(descs.some((d) => d.includes("Desc Antecipa"))).toBe(false);
    expect(descs.some((d) => d.includes("PG *NASCIMENTO"))).toBe(false);
    expect(f.transacoes.some((t) => t.descricao.includes("FENG AIQIONG"))).toBe(
      true,
    );
  });

  it("classifica pela categoria impressa e pelo estabelecimento", () => {
    const byDesc = (frag: string) =>
      f.transacoes.find((t) => t.descricao.includes(frag))!;
    expect(byDesc("FENG AIQIONG").categoria).toBe("Alimentação");
    expect(byDesc("UberRides").categoria).toBe("Transporte");
    expect(byDesc("DROGASIL").categoria).toBe("Saúde");
    expect(byDesc("SPOTIFY").categoria).toBe("Assinaturas"); // "outros" + merchant
    expect(byDesc("EMPADA").categoria).toBe("Alimentação"); // supermercado
    expect(byDesc("CLAUDE").categoria).toBe("Assinaturas");
    expect(byDesc("ANUIDADE").categoria).toBe("Fatura de cartão (sem detalhar)");
  });

  it("captura parcelas", () => {
    const vf = f.transacoes.find((t) => t.descricao.includes("VFITNESS"))!;
    expect(vf.parcela).toEqual({ atual: 8, total: 12 });
    const ad = f.transacoes.find((t) => t.descricao.includes("AdEngenharia"))!;
    expect(ad.parcela).toEqual({ atual: 1, total: 12 });
  });

  it("marca o titular de cada seção (cartão compartilhado)", () => {
    expect(f.titulares).toContain("NOME DO TITULAR");
    expect(f.titulares).toContain("OUTRO TITULAR");
    const doOutro = f.transacoes.filter((t) => t.titular === "OUTRO TITULAR");
    expect(doOutro.some((t) => t.descricao.includes("AdEngenharia"))).toBe(true);
    const soma = doOutro
      .filter((t) => t.origem === "compra")
      .reduce((a, t) => a + t.valor, 0);
    expect(soma).toBeCloseTo(970.87 + 22.4 + 20, 2);
  });

  it("separa internacionais e serviços", () => {
    expect(
      f.transacoes.find((t) => t.descricao.includes("CLAUDE"))!.origem,
    ).toBe("internacional");
    expect(
      f.transacoes.find((t) => t.descricao.includes("SEGURO"))!.origem,
    ).toBe("servico");
  });
});

// Layout co-branded (Pão de Açúcar): transações ANTES do cabeçalho,
// e a mesma parcelada repetida na seção "próximas faturas".
const FATURA_COBRAND = `
Cartão 5312.XXXX.XXXX.0809
Total desta fatura 6.787,93
Vencimento: 12/09/2026
Continua...
03/02 CompraFacil 07/12 489,62
05/07 Globo Globoplay 02/12 22,28
14/08 FLEXPAG*COMPESA 1.705,00
14/08 UNIMED RECIFE 2.272,90
24/08 DL*UberRides 15,51
27/08 Google One 14,99
Lançamentos: compras e saques Lançamentos: compras e saques
Lançamentos: produtos e serviços
Total dos lançamentos atuais 6.787,93
Compras parceladas - próximas faturas
DATA ESTABELECIMENTO VALOR EM R$
03/02 CompraFacil 08/12 489,62
05/07 Globo Globoplay 03/12 22,28
`;

describe("interpretarFaturaItau — layout co-branded", () => {
  const f = interpretarFaturaItau(FATURA_COBRAND);

  it("pega as transações que vêm antes do cabeçalho", () => {
    expect(f.transacoes.some((t) => t.descricao.includes("COMPESA"))).toBe(true);
    expect(f.transacoes.some((t) => t.descricao.includes("UNIMED"))).toBe(true);
    expect(f.transacoes.some((t) => t.descricao.includes("UberRides"))).toBe(
      true,
    );
  });

  it("não duplica a parcelada que aparece em 'próximas faturas'", () => {
    const compraFacil = f.transacoes.filter((t) =>
      t.descricao.includes("CompraFacil"),
    );
    expect(compraFacil).toHaveLength(1);
    expect(compraFacil[0].parcela).toEqual({ atual: 7, total: 12 });
  });

  it("classifica pelo estabelecimento (sem categoria impressa)", () => {
    expect(
      f.transacoes.find((t) => t.descricao.includes("COMPESA"))!.categoria,
    ).toBe("Moradia");
    expect(
      f.transacoes.find((t) => t.descricao.includes("UNIMED"))!.categoria,
    ).toBe("Saúde");
    expect(
      f.transacoes.find((t) => t.descricao.includes("Globoplay"))!.categoria,
    ).toBe("Assinaturas");
  });
});
