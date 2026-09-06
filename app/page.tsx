import { redirect } from "next/navigation";
import { mesAtualKey } from "@/lib/format";

// Precisa rodar a cada requisição para o mês corrente ficar correto.
export const dynamic = "force-dynamic";

export default function Home() {
  redirect(`/mes/${mesAtualKey()}`);
}
