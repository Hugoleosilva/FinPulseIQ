import "server-only";
import {
  getMes,
  listarMeses,
  listarCompromissos,
  compromissoMensal,
} from "./repo";
import {
  resumoMes,
  fluxoCaixa,
  oportunidades,
  nivelSaude,
  parcelasFuturasDoMes,
  type PontoHistorico,
} from "./calculos";
import type { DadosDiagnostico } from "./exportar";
import type { Mes } from "./tipos";

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
  const n = nivelSaude({ resumo: r, fluxo: f, compromissoMensalFuturo: 0 });
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
  const compromissoMensalFuturo = compromissoMensal(compromissos);

  const resumo = resumoMes(mes);
  const fluxo = fluxoCaixa(mes);
  const ops = oportunidades(mes, anteriores);
  const nivel = nivelSaude({ resumo, fluxo, compromissoMensalFuturo });

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
    parcelasFuturas: parcelasFuturasDoMes(mes),
    compromissoMensalFuturo,
    historico,
  };
}
