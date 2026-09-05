import { lerSessao } from "@/lib/sessao";
import { PODE_VER } from "@/lib/acesso";
import { buscarUsuarioPorLogin } from "@/lib/repo";
import { getDocumentoMeta, lerDocumento } from "@/lib/arquivos";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessao = await lerSessao();
  if (!sessao) return new Response("Não autorizado", { status: 401 });

  const { id } = await params;
  const doc = await getDocumentoMeta(id);
  if (!doc) return new Response("Não encontrado", { status: 404 });

  let permitido = doc.userId === sessao.userId;
  if (!permitido) {
    const parceiroLogin = PODE_VER[sessao.login];
    if (parceiroLogin) {
      const parceiro = await buscarUsuarioPorLogin(parceiroLogin);
      permitido = !!parceiro && parceiro.id === doc.userId;
    }
  }
  if (!permitido) return new Response("Proibido", { status: 403 });

  const buf = await lerDocumento(doc.gridId);
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": doc.mime || "application/octet-stream",
      "Content-Disposition": `inline; filename="${encodeURIComponent(
        doc.nomeArquivo,
      )}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
