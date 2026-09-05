import { Logo } from "@/components/Logo";

export default function LayoutAuth({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center gap-6 px-4 py-10">
      <div className="flex flex-col items-center gap-2 text-center">
        <Logo tamanho={40} />
        <p className="text-texto-suave">
          O pulso da sua saúde financeira: o que entra, o que sai e onde agir.
        </p>
      </div>
      {children}
    </div>
  );
}
