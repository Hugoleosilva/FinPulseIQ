# FinPulseIQ

O pulso da sua saúde financeira. Você informa o que **entra**, cadastra (ou
importa) o que **sai**, e o FinPulseIQ mostra:

- quanto entra, quanto sai, **quanto sobra** e o **nível de saúde** do mês
  (Ótimo / Bom / Normal / Ruim / Crítico);
- **para onde vai o dinheiro** (por categoria e subcategoria);
- **onde a torneira está pingando** — os vazamentos, com uma estimativa de
  quanto dá para economizar em cada área e **onde atacar primeiro**;
- um **simulador**: marque onde você consegue agir e veja a nova sobra do mês;
- o **fluxo de caixa** dia a dia, com alerta de risco de ficar no vermelho;
- a **evolução mês a mês**.

No fim, gera um **diagnóstico em texto + uma pergunta pronta** para você levar a
uma IA (ChatGPT, Claude, Gemini) montar seu plano de ação — com botões que já
copiam o texto e abrem a IA.

## Stack

- **Next.js 16** (App Router, Server Actions) + React 19 + TypeScript
- **MongoDB Atlas** (driver oficial; documentos ficam no GridFS)
- Sessão por cookie assinado (JWT / `jose`), senha com hash `scrypt`
- **Tailwind CSS v4**
- Testes: **Vitest** (lógica pura + integração com Mongo em memória)

## Quem acessa

Sistema privado para **duas contas**: `hugo` e `angelica` (o cadastro só aceita
esses dois apelidos). Cada uma tem CRUD total na própria área. `hugo` também
enxerga a área de `angelica` em **somente leitura**, para acompanhamento.

## Rodando localmente

> Requer **Node 20.19+** (recomendado 20 LTS mais recente ou 22). O projeto roda
> em 20.12, mas algumas ferramentas de dev reclamam.

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Crie o arquivo `.env.local` (baseie-se em `.env.example`):

   ```
   MONGODB_URI="mongodb+srv://usuario:SENHA@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority"
   MONGODB_DB="finpulseiq"
   AUTH_SECRET="<valor aleatório de 32+ caracteres>"
   ```

   - `MONGODB_URI`: em **MongoDB Atlas → Database → Connect → Drivers**. Troque
     `<db_password>` pela senha real. Em **Network Access**, libere seu IP (ou
     `0.0.0.0/0` para testes).
   - `AUTH_SECRET`: gere com `openssl rand -base64 32` (ou
     <https://generate-secret.vercel.app/32>).

3. Rode:

   ```bash
   npm run dev
   ```

   Abra <http://localhost:3000>, clique em **Criar conta** e cadastre `hugo` e
   `angelica` (uma vez cada).

### Rodar sem Atlas (banco em memória, para testes visuais)

```bash
node scripts/dev-mem.mjs
```

Sobe um MongoDB temporário, cria `hugo`/`angelica` e um mês de exemplo, e roda o
dev na porta 3313. (Login não funciona nesse modo porque as senhas são fictícias
— é só para inspecionar as telas.)

## Testes

```bash
npm test
```

- `lib/__tests__/calculos.test.ts` — resumo, vazamentos, índice de oportunidade,
  simulação, nível de saúde e fluxo de caixa (usa o exemplo "R$ 5.000 entram,
  R$ 4.700 saem, sobram R$ 300").
- `lib/__tests__/integracao.test.ts` — fluxo completo contra um Mongo em
  memória: cria usuário, lança dados, importa planilha CSV, gera o diagnóstico e
  confere o isolamento entre contas.

## Publicar na Vercel

1. Faça o push para o GitHub (`Hugoleosilva/FinPulseIQ`).
2. Na Vercel, **New Project** → importe o repositório.
3. Em **Settings → Environment Variables**, cadastre as 3 variáveis
   (`MONGODB_URI`, `MONGODB_DB`, `AUTH_SECRET`).
4. Em **MongoDB Atlas → Network Access**, adicione `0.0.0.0/0` (a Vercel usa IPs
   dinâmicos).
5. Deploy. Depois, acesse a URL e crie as duas contas.

## Importar de uma planilha

Em **Meu mês → Importar planilha** (`.xlsx` ou `.csv`). Colunas entendidas:
`tipo` (Receita/Despesa), `descricao`, `valor` (obrigatórias), `dia`,
`categoria`, `subcategoria`, `classificacao` (essencial / pode reduzir / dá para
viver sem), `forma de pagamento`. Há um **modelo** para baixar na própria tela.

## Notas

- Auditoria `npm audit` aponta avisos apenas em dependências de
  desenvolvimento/transitivas (`esbuild` do Vitest, `uuid` do `exceljs`); nada
  no caminho de produção. Atualizar o Node para 20.19+/22 permite subir o
  Vitest para a versão mais recente.
