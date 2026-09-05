import Link from "next/link";
import { historicoDoUsuario } from "@/lib/diagnostico";
import { nomeMes, formatBRL } from "@/lib/format";
import { ROTULO_FAIXA } from "@/lib/calculos";
import { Card, TituloSecao, Aviso, BotaoLink } from "@/components/ui";
import { SeloNivel } from "@/components/SeloNivel";
import { GraficoSaldoMensal } from "@/components/graficos";

export interface VistaHistoricoProps {
  userId: string;
  somenteLeitura?: boolean;
  nomeArea?: string;
  hrefMes: (key: string) => string;
  hrefLancarAtual?: string;
}

export async function VistaHistorico(props: VistaHistoricoProps) {
  const pontos = await historicoDoUsuario(props.userId);

  return (
    <div className="flex flex-col gap-6">
      {props.somenteLeitura && props.nomeArea ? (
        <Aviso tipo="info" titulo={`Histórico de ${props.nomeArea}`}>
          Modo somente leitura, para acompanhamento.
        </Aviso>
      ) : null}

      <h1 className="text-2xl font-extrabold">Evolução mês a mês</h1>

      {pontos.length === 0 ? (
        <Card>
          <p className="text-texto-suave">
            {props.somenteLeitura
              ? `${props.nomeArea} ainda não tem meses preenchidos.`
              : "Você ainda não tem meses preenchidos."}
          </p>
          {!props.somenteLeitura && props.hrefLancarAtual ? (
            <div className="mt-4">
              <BotaoLink href={props.hrefLancarAtual}>
                Preencher o mês atual
              </BotaoLink>
            </div>
          ) : null}
        </Card>
      ) : (
        <>
          <Card>
            <TituloSecao ajuda="A cor da barra mostra o nível de saúde daquele mês.">
              Quanto sobrou em cada mês
            </TituloSecao>
            <GraficoSaldoMensal pontos={pontos} />
          </Card>

          <Card>
            <TituloSecao>Detalhe por mês</TituloSecao>
            <ul className="divide-y divide-borda">
              {[...pontos].reverse().map((p) => (
                <li
                  key={p.key}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div className="flex items-center gap-3">
                    <SeloNivel
                      faixa={p.faixa}
                      rotulo={ROTULO_FAIXA[p.faixa]}
                      score={p.score}
                    />
                    <span className="font-semibold capitalize">
                      {nomeMes(p.key)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-texto-suave">
                      entrou{" "}
                      <strong className="text-texto">
                        {formatBRL(p.receita)}
                      </strong>
                    </span>
                    <span className="text-texto-suave">
                      sobrou{" "}
                      <strong
                        className={p.saldo < 0 ? "text-perigo" : "text-ok"}
                      >
                        {formatBRL(p.saldo)}
                      </strong>
                    </span>
                    <Link
                      href={props.hrefMes(p.key)}
                      className="font-semibold text-acento-escuro underline"
                    >
                      abrir
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}
    </div>
  );
}
