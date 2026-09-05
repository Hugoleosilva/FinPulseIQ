import type { Metadata } from "next";
import { CadastroForm } from "./CadastroForm";

export const metadata: Metadata = { title: "Criar conta — FinPulseIQ" };

export default function PaginaCadastro() {
  return <CadastroForm />;
}
