"use client";

import { useState } from "react";
import { Botao, Aviso } from "@/components/ui";

const IAS = [
  { nome: "ChatGPT", url: "https://chatgpt.com/" },
  { nome: "Claude", url: "https://claude.ai/new" },
  { nome: "Gemini", url: "https://gemini.google.com/app" },
];

export function ExportarDiagnostico({
  markdown,
  nomeArquivo,
}: {
  markdown: string;
  nomeArquivo: string;
}) {
  const [copiadoDoc, setCopiadoDoc] = useState(false);
  const [abriu, setAbriu] = useState<string | null>(null);

  const copiar = async (texto: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(texto);
      return true;
    } catch {
      return false;
    }
  };

  const baixar = () => {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nomeArquivo;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const copiarEabrir = async (ia: { nome: string; url: string }) => {
    const ok = await copiar(markdown);
    setCopiadoDoc(ok);
    setAbriu(ia.nome);
    window.open(ia.url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="mb-2 font-bold text-texto">
          Passo 1 — pegue o diagnóstico
        </p>
        <div className="flex flex-wrap gap-3">
          <Botao
            variante="secundario"
            onClick={async () => setCopiadoDoc(await copiar(markdown))}
          >
            {copiadoDoc ? "Copiado! ✓" : "Copiar o diagnóstico"}
          </Botao>
          <Botao variante="secundario" onClick={baixar}>
            Baixar como arquivo (.md)
          </Botao>
        </div>
      </div>

      <div>
        <p className="mb-2 font-bold text-texto">
          Passo 2 — abra uma IA (já copia o texto para você)
        </p>
        <div className="flex flex-wrap gap-3">
          {IAS.map((ia) => (
            <Botao key={ia.nome} onClick={() => copiarEabrir(ia)}>
              Abrir o {ia.nome}
            </Botao>
          ))}
        </div>
      </div>

      {abriu ? (
        <Aviso tipo="ok" titulo={`O ${abriu} abriu em outra aba`}>
          O texto do diagnóstico já está copiado. Nessa outra aba:
          <ol className="ml-4 mt-1 list-decimal space-y-1">
            <li>
              Clique na caixa de escrever mensagem e <strong>cole</strong>: no
              computador, aperte <kbd>Ctrl</kbd> + <kbd>V</kbd>; no celular,
              segure o dedo na caixa e toque em “Colar”.
            </li>
            <li>Envie a mensagem. A pergunta já vai junto, dentro do texto.</li>
            <li>Leia o plano de ação que a IA vai montar para você.</li>
          </ol>
        </Aviso>
      ) : (
        <Aviso tipo="info">
          Dica: “copiar” guarda o texto na memória do aparelho; “colar” põe esse
          texto onde o cursor estiver. É assim que o diagnóstico chega até a IA.
        </Aviso>
      )}

      <details className="rounded-2xl border border-borda p-4">
        <summary className="cursor-pointer font-bold">
          Ver o texto completo do diagnóstico e a pergunta que será feita à IA
        </summary>
        <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-fundo p-3 text-xs text-texto-suave">
          {markdown}
        </pre>
      </details>
    </div>
  );
}
