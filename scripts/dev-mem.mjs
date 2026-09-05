// Sobe um MongoDB em memória, semeia dados de exemplo e roda `next dev`.
// Uso: node scripts/dev-mem.mjs   (porta 3313)
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient } from "mongodb";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";

const mongod = await MongoMemoryServer.create();
const uri = mongod.getUri();
const client = await new MongoClient(uri).connect();
const db = client.db("finpulseiq");

const hugo = { id: randomUUID(), login: "hugo", nomeExibicao: "Hugo", senhaHash: "seed", criadoEm: new Date().toISOString() };
const ang = { id: randomUUID(), login: "angelica", nomeExibicao: "Angélica", senhaHash: "seed", criadoEm: new Date().toISOString() };
await db.collection("users").insertMany([hugo, ang]);

await db.collection("months").insertOne({
  userId: hugo.id,
  key: "2026-09",
  saldoInicial: 500,
  receitas: [{ id: "r1", descricao: "Salário", valor: 5000, dia: 5, tipo: "fixa" }],
  despesas: [
    { id: "d1", descricao: "Aluguel", valor: 1200, dia: 10, categoria: "Moradia", subcategoria: "Aluguel", meioPagamento: "boleto", cartaoId: null, essencialidade: "essencial", recorrente: true, parcela: null },
    { id: "d2", descricao: "Mercado", valor: 550, dia: 8, categoria: "Alimentação", subcategoria: "Mercado", meioPagamento: "debito", cartaoId: null, essencialidade: "essencial", recorrente: false, parcela: null },
    { id: "d3", descricao: "iFood", valor: 240, dia: 20, categoria: "Alimentação", subcategoria: "Delivery (iFood, etc.)", meioPagamento: "cartao", cartaoId: null, essencialidade: "desnecessario", recorrente: false, parcela: null },
    { id: "d4", descricao: "Streaming", valor: 160, dia: 3, categoria: "Assinaturas", subcategoria: "Streaming (Netflix, etc.)", meioPagamento: "cartao", cartaoId: null, essencialidade: "reduzivel", recorrente: true, parcela: null },
  ],
  criadoEm: new Date().toISOString(),
  atualizadoEm: new Date().toISOString(),
});

console.log("URI:", uri);
console.log("hugo.id:", hugo.id);

const env = {
  ...process.env,
  MONGODB_URI: uri,
  MONGODB_DB: "finpulseiq",
  AUTH_SECRET: "smoke-secret-com-mais-de-dezesseis-caracteres",
};

const child = spawn("npx", ["next", "dev", "-p", "3313"], {
  env,
  stdio: "inherit",
  shell: true,
});

process.on("SIGINT", async () => {
  child.kill();
  await client.close();
  await mongod.stop();
  process.exit(0);
});
