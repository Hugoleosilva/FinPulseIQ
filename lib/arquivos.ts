import "server-only";
import { randomUUID } from "node:crypto";
import { GridFSBucket, ObjectId } from "mongodb";
import { getDb, col } from "./db";
import {
  TAMANHO_MAX_DOC,
  TIPOS_ACEITOS_DOC,
  type TipoDocumento,
} from "./documentos";

export const TAMANHO_MAX = TAMANHO_MAX_DOC;
export const TIPOS_ACEITOS = TIPOS_ACEITOS_DOC;
export type { TipoDocumento };

export interface DocumentoMeta {
  id: string;
  userId: string;
  gridId: string;
  nomeArquivo: string;
  descricao: string;
  tipo: TipoDocumento;
  mesRef: string | null;
  valor: number | null;
  mime: string;
  tamanho: number;
  criadoEm: string;
}

async function bucket() {
  const db = await getDb();
  return new GridFSBucket(db, { bucketName: "documentos" });
}

export async function salvarDocumento(
  userId: string,
  meta: {
    descricao: string;
    tipo: TipoDocumento;
    mesRef: string | null;
    valor: number | null;
  },
  arquivo: File,
): Promise<void> {
  const buf = Buffer.from(await arquivo.arrayBuffer());
  const b = await bucket();

  const gridId = new ObjectId();
  await new Promise<void>((resolve, reject) => {
    const up = b.openUploadStreamWithId(gridId, arquivo.name, {
      metadata: { userId, contentType: arquivo.type },
    });
    up.on("error", reject);
    up.on("finish", () => resolve());
    up.end(buf);
  });

  const docs = await col<DocumentoMeta>("documentos");
  await docs.insertOne({
    id: randomUUID(),
    userId,
    gridId: gridId.toHexString(),
    nomeArquivo: arquivo.name,
    descricao: meta.descricao,
    tipo: meta.tipo,
    mesRef: meta.mesRef,
    valor: meta.valor,
    mime: arquivo.type,
    tamanho: buf.length,
    criadoEm: new Date().toISOString(),
  });
}

export async function listarDocumentos(
  userId: string,
): Promise<DocumentoMeta[]> {
  const docs = await col<DocumentoMeta>("documentos");
  const lista = await docs
    .find({ userId })
    .sort({ criadoEm: -1 })
    .toArray();
  return lista.map((d) => {
    const { _id: _omitir, ...rest } = d;
    void _omitir;
    return rest;
  });
}

export async function getDocumentoMeta(
  id: string,
): Promise<DocumentoMeta | null> {
  const docs = await col<DocumentoMeta>("documentos");
  return docs.findOne({ id });
}

export async function lerDocumento(
  gridId: string,
): Promise<Buffer> {
  const b = await bucket();
  const chunks: Buffer[] = [];
  await new Promise<void>((resolve, reject) => {
    const dl = b.openDownloadStream(new ObjectId(gridId));
    dl.on("data", (c: Buffer) => chunks.push(c));
    dl.on("error", reject);
    dl.on("end", () => resolve());
  });
  return Buffer.concat(chunks);
}

export async function apagarDocumento(
  userId: string,
  id: string,
): Promise<void> {
  const docs = await col<DocumentoMeta>("documentos");
  const doc = await docs.findOne({ id, userId });
  if (!doc) return;
  const b = await bucket();
  await b.delete(new ObjectId(doc.gridId)).catch(() => {});
  await docs.deleteOne({ id, userId });
}
