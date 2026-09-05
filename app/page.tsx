import { redirect } from "next/navigation";
import { mesAtualKey } from "@/lib/format";

export default function Home() {
  redirect(`/mes/${mesAtualKey()}`);
}
