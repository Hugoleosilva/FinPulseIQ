import "server-only";
import { scrypt, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

/** Gera um hash "salt:hash" (hex) para guardar no banco. */
export async function hashSenha(senha: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derivada = (await scryptAsync(senha, salt, 64)) as Buffer;
  return `${salt}:${derivada.toString("hex")}`;
}

/** Confere a senha contra o hash guardado. */
export async function verificarSenha(
  senha: string,
  hashGuardado: string,
): Promise<boolean> {
  const [salt, hashHex] = hashGuardado.split(":");
  if (!salt || !hashHex) return false;
  const esperado = Buffer.from(hashHex, "hex");
  const derivada = (await scryptAsync(senha, salt, 64)) as Buffer;
  return (
    esperado.length === derivada.length && timingSafeEqual(esperado, derivada)
  );
}
