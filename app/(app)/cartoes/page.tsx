import type { Metadata } from "next";
import Link from "next/link";
import { exigirSessao } from "@/lib/dal";
import { listarCartoes, listarCompromissos, listarMeses } from "@/lib/repo";
import { listarDocumentos } from "@/lib/arquivos";
import { ROTULO_TIPO_DOC } from "@/lib/documentos";
import { situacaoFatura } from "@/lib/calculos";
import { formatBRL, mesAtualKey, nomeMes } from "@/lib/format";
import { emojiCategoria } from "@/lib/categorias";
import { Card, TituloSecao, Aviso, BotaoLink } from "@/components/ui";
import { BotaoExcluir } from "@/components/BotaoExcluir";
import { Colapsavel } from "@/components/Colapsavel";
import { FormCartao } from "./FormCartao";
import { FormCompromisso } from "./FormCompromisso";
import { FormDocumento } from "./FormDocumento";
import {
  apagarCartaoAction,
  apagarCompromissoAction,
} from "@/app/actions/cartoes";
import { apagarDocumentoAction } from "@/app/actions/documentos";

export const metadata: Metadata = { title: "Cartões e documentos — FinPulseIQ" };

export default async function PaginaCartoes() {
  const { userId } = await exigirSessao();
  const [cartoes, compromissos, documentos, meses] = await Promise.all([
    listarCartoes(userId),
    listarCompromissos(userId),
    listarDocumentos(userId),
    listarMeses(userId),
  ]);

  const keyAtual = mesAtualKey();
  const despesasMesAtual =
    meses.find((m) => m.key === keyAtual)?.despesas ?? [];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-extrabold">Cartões, parcelas e documentos</h1>

      <Aviso tipo="info">
        Cadastre os cartões e use <strong>“Lançar fatura”</strong> para enviar o
        PDF do Itaú — o sistema lê cada compra, sugere a categoria e mostra para
        onde vai o dinheiro no cartão. Também dá para lançar só o valor total.
      </Aviso>

      <Card>
        <TituloSecao>Seus cartões</TituloSecao>
        {cartoes.length === 0 && (
          <p className="mb-3 text-sm text-texto-suave">
            Cadastre um cartão no formulário abaixo. Depois aparece o botão{" "}
            <strong>“Lançar fatura”</strong> ao lado dele.
          </p>
        )}
        {cartoes.length > 0 && (
          <ul className="divide-y divide-borda rounded-xl border border-borda">
            {cartoes.map((c) => {
              const qtd = despesasMesAtual.filter(
                (d) => d.cartaoId === c.id,
              ).length;
              const sit = situacaoFatura(c, keyAtual, qtd);
              const badge = !sit.fechada
                ? {
                    txt: `Fatura de ${nomeMes(keyAtual)} em aberto`,
                    cls: "bg-acento/10 text-acento-escuro",
                  }
                : sit.enviada
                  ? {
                      txt: `Fatura de ${nomeMes(keyAtual)} já enviada`,
                      cls: "bg-ok/15 text-ok",
                    }
                  : {
                      txt: `Falta enviar a fatura de ${nomeMes(keyAtual)}`,
                      cls: "bg-alerta/15 text-alerta",
                    };
              return (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-3 p-3"
                >
                  <span>
                    <Link
                      href={`/cartoes/${c.id}`}
                      className="font-semibold text-acento-escuro underline decoration-transparent hover:decoration-inherit"
                    >
                      {c.nome}
                    </Link>
                    {c.compartilhado ? (
                      <span className="ml-2 rounded bg-acento/10 px-1.5 py-0.5 text-xs font-bold text-acento-escuro">
                        compartilhado
                        {c.titularFatura ? ` · ${c.titularFatura}` : ""}
                      </span>
                    ) : null}
                    <span className="block text-sm text-texto-suave">
                      Limite {formatBRL(c.limite)} · fecha dia {c.diaFechamento} ·
                      vence dia {c.diaVencimento}
                    </span>
                    <span
                      className={`mt-1 inline-block rounded px-1.5 py-0.5 text-xs font-bold ${badge.cls}`}
                    >
                      {badge.txt}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    <BotaoLink href={`/cartoes/${c.id}`} variante="secundario">
                      {sit.enviada ? "Ver / editar" : "Ver"}
                    </BotaoLink>
                    {sit.enviada ? (
                      <span className="rounded-lg border border-ok/30 bg-ok/10 px-3 py-2 text-sm font-bold text-ok">
                        ✓ Fatura enviada
                      </span>
                    ) : (
                      <BotaoLink
                        href={`/cartoes/${c.id}/fatura`}
                        variante="secundario"
                      >
                        {sit.fechada ? "Enviar fatura" : "Lançar fatura"}
                      </BotaoLink>
                    )}
                    <BotaoExcluir
                      acao={apagarCartaoAction.bind(null, c.id)}
                      rotulo="Apagar cartão"
                      forte
                      confirmar={`Apagar o cartão "${c.nome}" e todos os seus dados? Os lançamentos já feitos nos meses continuam.`}
                    />
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        <div className="mt-3">
          <Colapsavel titulo="+ Adicionar um cartão" aberto={cartoes.length === 0}>
            <FormCartao />
          </Colapsavel>
        </div>
      </Card>

      <Card>
        <TituloSecao ajuda="Compras parceladas que ainda vão pesar nos próximos meses.">
          Compromissos futuros (parcelas)
        </TituloSecao>
        {compromissos.length > 0 && (
          <ul className="divide-y divide-borda rounded-xl border border-borda">
            {compromissos.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-3 p-3"
              >
                <span>
                  <span className="font-semibold">
                    {emojiCategoria(c.categoria)} {c.descricao}
                  </span>
                  <span className="block text-sm text-texto-suave">
                    {formatBRL(c.valorParcela)}/mês · faltam{" "}
                    {c.parcelasRestantes} parcela(s)
                  </span>
                </span>
                <BotaoExcluir
                  acao={apagarCompromissoAction.bind(null, c.id)}
                  confirmar={`Apagar "${c.descricao}"?`}
                />
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3">
          <Colapsavel
            titulo="+ Adicionar um compromisso"
            aberto={compromissos.length === 0}
          >
            <FormCompromisso />
          </Colapsavel>
        </div>
      </Card>

      <Card>
        <TituloSecao ajuda="Faturas, boletos, notas fiscais, contas de luz/água/internet, comprovantes — guarde tudo aqui.">
          Documentos guardados
        </TituloSecao>
        {documentos.length > 0 && (
          <ul className="divide-y divide-borda rounded-xl border border-borda">
            {documentos.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between gap-3 p-3"
              >
                <span className="min-w-0">
                  <span className="block truncate font-semibold">
                    {d.descricao}
                  </span>
                  <span className="block text-sm text-texto-suave">
                    {ROTULO_TIPO_DOC[d.tipo]}
                    {d.mesRef ? ` · ${nomeMes(d.mesRef)}` : ""}
                    {d.valor != null ? ` · ${formatBRL(d.valor)}` : ""}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <a
                    href={`/api/documentos/${d.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg px-2 py-1 text-sm font-semibold text-acento-escuro hover:bg-acento/10"
                  >
                    Abrir / baixar
                  </a>
                  <BotaoExcluir
                    acao={apagarDocumentoAction.bind(null, d.id)}
                    confirmar={`Apagar o documento "${d.descricao}"?`}
                  />
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3">
          <Colapsavel
            titulo="+ Guardar um documento"
            aberto={documentos.length === 0}
          >
            <FormDocumento mesAtual={mesAtualKey()} />
          </Colapsavel>
        </div>
      </Card>
    </div>
  );
}
