import "server-only";
import { getMes, listarMeses, listarCompromissos } from "./repo";
import {
  resumoMes,
  fluxoCaixa,
  oportunidades,
  nivelSaude,
  parcelasFuturasDoMes,
  somarCompromissoFuturo,
  classificarDivida,
  type PontoHistorico,
} from "./calculos";
import type { DadosDiagnostico } from "./exportar";
import type { Mes, CompromissoFuturo } from "./tipos";

/** Compromisso mensal futuro do mês: parcelas em andamento + lista de compromissos. */
export function compromissoFuturoDoMes(
  mes: Mes,
  compromissos: CompromissoFuturo[],
) {
  return somarCompromissoFuturo([
    ...parcelasFuturasDoMes(mes).map((p) => ({
      valorMensal: p.valorMensal,
      tipo: p.tipo,
      ativo: true,
    })),
    ...compromissos.map((c) => ({
      valorMensal: c.valorParcela,
      tipo: classificarDivida(c.categoria),
      ativo: c.parcelasRestantes > 0,
    })),
  ]);
}

export async function historicoDoUsuario(
  userId: string,
): Promise<PontoHistorico[]> {
  const meses = await listarMeses(userId);
  return meses
    .filter((m) => m.receitas.length > 0 || m.despesas.length > 0)
    .map(ponto)
    .sort((a, b) => a.key.localeCompare(b.key));
}

function ponto(mes: Mes): PontoHistorico {
  const r = resumoMes(mes);
  const f = fluxoCaixa(mes);
  const compromisso = somarCompromissoFuturo(
    parcelasFuturasDoMes(mes).map((p) => ({
      valorMensal: p.valorMensal,
      tipo: p.tipo,
      ativo: true,
    })),
  );
  const n = nivelSaude({
    resumo: r,
    fluxo: f,
    compromissoMensalFuturo: compromisso.mensal,
  });
  return {
    key: mes.key,
    receita: r.receitaTotal,
    despesa: r.despesaTotal,
    saldo: r.saldo,
    score: n.score,
    faixa: n.faixa,
  };
}

export async function montarDiagnostico(
  userId: string,
  nomeUsuario: string,
  key: string,
): Promise<DadosDiagnostico> {
  const [mes, todosMeses, compromissos] = await Promise.all([
    getMes(userId, key),
    listarMeses(userId),
    listarCompromissos(userId),
  ]);

  const anteriores = todosMeses.filter((m) => m.key < key);
  const parcelasFuturas = parcelasFuturasDoMes(mes);
  const compromisso = compromissoFuturoDoMes(mes, compromissos);

  const resumo = resumoMes(mes);
  const fluxo = fluxoCaixa(mes);
  const ops = oportunidades(mes, anteriores);
  const nivel = nivelSaude({
    resumo,
    fluxo,
    compromissoMensalFuturo: compromisso.mensal,
  });

  const historico = todosMeses
    .filter((m) => m.key <= key)
    .map(ponto)
    .sort((a, b) => a.key.localeCompare(b.key));

  return {
    key,
    nomeUsuario,
    resumo,
    nivel,
    fluxo,
    oportunidades: ops,
    parcelasFuturas,
    compromissoMensalFuturo: compromisso.mensal,
    compromissoFuturo: compromisso,
    historico,
  };
}
