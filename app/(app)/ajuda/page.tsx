import type { Metadata } from "next";
import { Card, TituloSecao } from "@/components/ui";

export const metadata: Metadata = { title: "Ajuda — FinPulseIQ" };

const TERMOS: { termo: string; texto: string }[] = [
  {
    termo: "Receita",
    texto:
      "É todo dinheiro que entra: salário, aposentadoria, pensão, aluguel que você recebe, bicos e vendas.",
  },
  {
    termo: "Despesa",
    texto:
      "É todo dinheiro que sai: contas, compras, parcelas, assinaturas — qualquer gasto.",
  },
  {
    termo: "Saldo inicial",
    texto:
      "Quanto você tinha guardado (na conta e em dinheiro) no primeiro dia do mês, antes de receber ou gastar.",
  },
  {
    termo: "Sobra do mês",
    texto:
      "O que resta depois de tirar todas as despesas do dinheiro que entrou (mais o saldo inicial). Se for negativo, você gastou mais do que tinha.",
  },
  {
    termo: "Essencial / Pode reduzir / Dá para viver sem",
    texto:
      "É você quem classifica cada gasto. Essencial é o que não dá para cortar (aluguel, remédio). 'Pode reduzir' é o que dá para gastar menos. 'Dá para viver sem' é supérfluo. Essa classificação é o que permite ao FinPulseIQ achar os vazamentos.",
  },
  {
    termo: "Vazamento",
    texto:
      "Um gasto que está drenando seu dinheiro sem necessidade — geralmente pequeno e repetido, como delivery ou assinaturas esquecidas.",
  },
  {
    termo: "Potencial de redução",
    texto:
      "Uma estimativa de quanto daria para economizar naquela área por mês. É um ponto de partida, não uma ordem. Quem decide é você.",
  },
  {
    termo: "Nível de saúde do mês",
    texto:
      "Uma nota de 0 a 100 que resume como estão suas contas: Ótimo, Bom, Normal, Ruim ou Crítico. Leva em conta a sobra, o uso do cartão, as parcelas e os dias no vermelho.",
  },
  {
    termo: "Fatura do cartão",
    texto:
      "É a soma de tudo que você comprou no cartão de crédito e precisa pagar até a data de vencimento.",
  },
  {
    termo: "Boleto",
    texto:
      "Um documento de cobrança com código de barras que você paga no banco, lotérica ou aplicativo.",
  },
  {
    termo: "Parcela",
    texto:
      "Quando uma compra é dividida em vezes. Ex.: 'parcela 3 de 10' quer dizer que faltam mais 7 pagamentos.",
  },
  {
    termo: "Comprometimento com cartão",
    texto:
      "Quanto da sua renda do mês foi gasto no cartão de crédito. Acima de 40% costuma ser sinal de alerta.",
  },
  {
    termo: "Upload (enviar)",
    texto:
      "É mandar um arquivo do seu computador ou celular para dentro de um site ou aplicativo. Ex.: enviar a foto de um boleto.",
  },
  {
    termo: "Download (baixar)",
    texto:
      "É o contrário: trazer um arquivo de um site para o seu computador ou celular. No FinPulseIQ, você baixa o diagnóstico para depois enviá-lo a uma IA.",
  },
  {
    termo: "IA (inteligência artificial)",
    texto:
      "Programas como ChatGPT e Claude, que conversam em texto. O FinPulseIQ monta os números e a pergunta; a IA ajuda a transformar isso num plano de ação.",
  },
];

export default function PaginaAjuda() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-extrabold">Ajuda e glossário</h1>

      <Card>
        <TituloSecao>Como usar o FinPulseIQ em 4 passos</TituloSecao>
        <ol className="ml-5 list-decimal space-y-2 text-texto-suave">
          <li>
            Em <strong>Meu mês</strong>, clique em “Preencher”. Comece dizendo
            quanto você tinha no início do mês.
          </li>
          <li>
            Cadastre <strong>o que entra</strong> (salário, bicos...) e depois{" "}
            <strong>o que sai</strong> (um gasto por vez, começando pelos
            maiores).
          </li>
          <li>
            Volte ao painel e veja o <strong>pulso do mês</strong>: para onde vai
            o dinheiro e onde está vazando.
          </li>
          <li>
            Abra o <strong>Diagnóstico</strong>, simule cortes e{" "}
            <strong>baixe o arquivo</strong> para uma IA montar seu plano.
          </li>
        </ol>
      </Card>

      <Card>
        <TituloSecao>O que cada palavra quer dizer</TituloSecao>
        <dl className="divide-y divide-borda">
          {TERMOS.map((t) => (
            <div key={t.termo} className="py-3">
              <dt className="font-bold text-texto">{t.termo}</dt>
              <dd className="mt-1 text-texto-suave">{t.texto}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  );
}
