import { NextResponse, type NextRequest } from "next/server";
import { lerToken } from "@/lib/jwt";

const ROTAS_PUBLICAS = ["/login", "/cadastro"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const ehPublica = ROTAS_PUBLICAS.some(
    (r) => pathname === r || pathname.startsWith(`${r}/`),
  );

  const sessao = await lerToken(req.cookies.get("sessao")?.value);

  // Não logado tentando acessar área interna -> manda para o login
  if (!sessao && !ehPublica) {
    const url = new URL("/login", req.nextUrl);
    if (pathname !== "/") url.searchParams.set("de", pathname);
    return NextResponse.redirect(url);
  }

  // Já logado tentando ver login/cadastro -> manda para o painel
  if (sessao && ehPublica) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg$).*)"],
};
