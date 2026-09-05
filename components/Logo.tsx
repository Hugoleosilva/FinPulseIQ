export function Logo({ tamanho = 28 }: { tamanho?: number }) {
  return (
    <span className="inline-flex items-center gap-2 font-extrabold text-texto">
      <svg
        width={tamanho}
        height={tamanho}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <rect x="1" y="1" width="22" height="22" rx="7" fill="var(--acento)" />
        <path
          d="M4 12.5h3l2-4 2.5 7 2-9 2 6h2.5"
          stroke="#fff"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span style={{ fontSize: tamanho * 0.7 }}>
        Fin<span className="text-acento">Pulse</span>
        <span className="text-texto-suave">IQ</span>
      </span>
    </span>
  );
}
