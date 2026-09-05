import "server-only";
import { MongoClient, type Db, type Collection, type Document } from "mongodb";

const globalForMongo = globalThis as unknown as {
  _mongoClientPromise?: Promise<MongoClient>;
};

function clientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "Falta a variável de ambiente MONGODB_URI. Copie .env.example para .env.local e preencha.",
    );
  }
  if (!globalForMongo._mongoClientPromise) {
    globalForMongo._mongoClientPromise = new MongoClient(uri).connect();
  }
  return globalForMongo._mongoClientPromise;
}

let indicesCriados = false;

export async function getDb(): Promise<Db> {
  const client = await clientPromise();
  const db = client.db(process.env.MONGODB_DB || "finpulseiq");
  if (!indicesCriados) {
    indicesCriados = true;
    await Promise.all([
      db.collection("users").createIndex({ login: 1 }, { unique: true }),
      db
        .collection("months")
        .createIndex({ userId: 1, key: 1 }, { unique: true }),
      db.collection("cards").createIndex({ userId: 1 }),
      db.collection("compromissos").createIndex({ userId: 1 }),
      db.collection("documentos").createIndex({ userId: 1, criadoEm: -1 }),
    ]).catch((e) => {
      indicesCriados = false;
      throw e;
    });
  }
  return db;
}

export async function col<T extends Document = Document>(
  nome: string,
): Promise<Collection<T>> {
  const db = await getDb();
  return db.collection<T>(nome);
}
