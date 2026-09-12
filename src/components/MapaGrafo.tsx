import { ANEL_EXTERNO, ANEL_INTERNO } from "@/lib/sabedoria";

export type TipoNo = "centro" | "interno" | "externo" | "padrao";

export type Selecao = { tipo: TipoNo; id: string } | null;

export type PadraoNo = {
  id: string;
  name: string;
  controle: "interno" | "externo";
  /** tem novo caminho desenhado (new_action preenchido) */
  emRota: boolean;
  /** tem evidência registrada (new_evidence preenchido) */
  completo: boolean;
  evidencias: number;
};

type Ponto = { left: number; top: number };

function ponto(angleDeg: number, radius: number): Ponto {
  const rad = (angleDeg * Math.PI) / 180;
  return { left: 50 + radius * Math.cos(rad), top: 50 + radius * Math.sin(rad) };
}

const RAIO_INTERNO = 26;
const RAIO_EXTERNO = 44;

/** Ângulos dos anéis fixos, começando no topo. */
const angulosAnel = (total: number, deslocamento = 0) =>
  Array.from({ length: total }, (_, i) => -90 + deslocamento + (360 / total) * i);

export function MapaGrafo({
  padroes,
  selecionado,
  onSelect,
}: {
  padroes: PadraoNo[];
  selecionado: Selecao;
  onSelect: (selecao: Selecao) => void;
}) {
  const angulosInternos = angulosAnel(ANEL_INTERNO.length);
  const angulosExternos = angulosAnel(ANEL_EXTERNO.length, 30);

  const nosInternos = ANEL_INTERNO.map((no, i) => ({
    ...no,
    tipo: "interno" as const,
    ...ponto(angulosInternos[i]!, RAIO_INTERNO),
  }));
  const nosExternos = ANEL_EXTERNO.map((no, i) => ({
    ...no,
    tipo: "externo" as const,
    ...ponto(angulosExternos[i]!, RAIO_EXTERNO),
  }));

  // padrões do usuário ficam entre os dois anéis, deslocados para não colidir
  const nosPadroes = padroes.map((padrao, i) => {
    const angulo = -90 + 15 + (360 / Math.max(padroes.length, 1)) * i;
    const raio = padrao.controle === "interno" ? 34 : 38;
    return { ...padrao, ...ponto(angulo, raio) };
  });

  const estaSelecionado = (tipo: TipoNo, id: string) =>
    selecionado?.tipo === tipo && selecionado.id === id;

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[440px]">
      {/* anéis-guia */}
      <div
        className="orbit-slow absolute rounded-full border border-dashed border-primary/15"
        style={{ inset: `${50 - RAIO_INTERNO}%` }}
        aria-hidden
      />
      <div
        className="orbit-slower absolute rounded-full border border-accent/12"
        style={{ inset: `${50 - RAIO_EXTERNO}%` }}
        aria-hidden
      />
      <div
        className="pulse-slow absolute inset-[38%] rounded-full bg-primary/8 blur-2xl"
        aria-hidden
      />

      {/* arestas */}
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full" aria-hidden>
        {nosInternos.map((no) => (
          <line
            key={`i-${no.id}`}
            x1="50"
            y1="50"
            x2={no.left}
            y2={no.top}
            stroke="var(--primary)"
            strokeOpacity={estaSelecionado("interno", no.id) ? 0.55 : 0.16}
            strokeWidth="0.3"
          />
        ))}
        {nosExternos.map((no) => (
          <line
            key={`e-${no.id}`}
            x1="50"
            y1="50"
            x2={no.left}
            y2={no.top}
            stroke="var(--arcane)"
            strokeOpacity={estaSelecionado("externo", no.id) ? 0.45 : 0.13}
            strokeWidth="0.25"
            strokeDasharray="1.4 1.4"
          />
        ))}
        {nosPadroes.map((padrao) => {
          const ativo = estaSelecionado("padrao", padrao.id);
          const cor = padrao.completo
            ? "var(--primary)"
            : padrao.emRota
              ? "var(--ember)"
              : "var(--arcane)";
          return (
            <g key={`p-${padrao.id}`}>
              <line
                x1="50"
                y1="50"
                x2={padrao.left}
                y2={padrao.top}
                stroke={cor}
                strokeOpacity={ativo ? 0.85 : padrao.completo ? 0.5 : 0.28}
                strokeWidth={ativo ? 0.55 : 0.35}
              />
              {/* a rota nova aponta para o único lugar onde há controle: a ação */}
              {padrao.emRota && (
                <line
                  x1={padrao.left}
                  y1={padrao.top}
                  x2={nosInternos[3]!.left}
                  y2={nosInternos[3]!.top}
                  stroke="var(--primary)"
                  strokeOpacity={ativo ? 0.9 : 0.45}
                  strokeWidth="0.4"
                  className="route-live"
                />
              )}
            </g>
          );
        })}
      </svg>

      {/* centro */}
      <button
        onClick={() =>
          onSelect(estaSelecionado("centro", "voce") ? null : { tipo: "centro", id: "voce" })
        }
        className="absolute left-1/2 top-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-primary/40 bg-background/80 backdrop-blur-sm transition-transform duration-[var(--duration-fast)] ease-arcane hover:scale-105"
        aria-label="Nó central: você"
      >
        <span className="label-arcane text-[0.5rem]">Você</span>
        <span className="gradient-text font-display text-xl leading-none">✦</span>
      </button>

      {/* anel interno — o que você controla */}
      {nosInternos.map((no) => (
        <NoFixo
          key={no.id}
          left={no.left}
          top={no.top}
          label={no.label}
          tone="interno"
          active={estaSelecionado("interno", no.id)}
          onClick={() =>
            onSelect(estaSelecionado("interno", no.id) ? null : { tipo: "interno", id: no.id })
          }
        />
      ))}

      {/* anel externo — o que você não controla */}
      {nosExternos.map((no) => (
        <NoFixo
          key={no.id}
          left={no.left}
          top={no.top}
          label={no.label}
          tone="externo"
          active={estaSelecionado("externo", no.id)}
          onClick={() =>
            onSelect(estaSelecionado("externo", no.id) ? null : { tipo: "externo", id: no.id })
          }
        />
      ))}

      {/* padrões mapeados pela pessoa */}
      {nosPadroes.map((padrao) => (
        <button
          key={padrao.id}
          onClick={() =>
            onSelect(
              estaSelecionado("padrao", padrao.id) ? null : { tipo: "padrao", id: padrao.id },
            )
          }
          style={{ left: `${padrao.left}%`, top: `${padrao.top}%` }}
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-transform duration-[var(--duration-fast)] ease-arcane hover:scale-125"
          aria-label={`Padrão: ${padrao.name}`}
          title={padrao.name}
        >
          <span
            className={`block rounded-full transition-all duration-[var(--duration-base)] ${
              padrao.completo
                ? "size-3.5 bg-primary shadow-[0_0_12px_var(--primary)]"
                : padrao.emRota
                  ? "size-3 border-2 border-primary bg-background"
                  : "size-2.5 border border-accent/70 bg-arcane-soft"
            } ${estaSelecionado("padrao", padrao.id) ? "ring-2 ring-primary/50 ring-offset-2 ring-offset-background" : ""}`}
          />
        </button>
      ))}
    </div>
  );
}

function NoFixo({
  left,
  top,
  label,
  tone,
  active,
  onClick,
}: {
  left: number;
  top: number;
  label: string;
  tone: "interno" | "externo";
  active: boolean;
  onClick: () => void;
}) {
  const interno = tone === "interno";
  return (
    <button
      onClick={onClick}
      style={{ left: `${left}%`, top: `${top}%` }}
      className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
      aria-label={interno ? `Você controla: ${label}` : `Fora do seu controle: ${label}`}
    >
      <span
        className={`block size-2 rounded-full transition-all duration-[var(--duration-base)] ${
          interno
            ? "bg-primary/70 shadow-[0_0_8px_oklch(0.83_0.14_80/45%)]"
            : "border border-accent/60 bg-arcane-soft"
        } ${active ? "scale-150" : ""}`}
      />
      <span
        className={`max-w-[6.5rem] text-center text-[0.58rem] leading-tight tracking-wide transition-colors ${
          active ? (interno ? "text-primary" : "text-accent") : "text-muted-foreground"
        }`}
      >
        {label}
      </span>
    </button>
  );
}

export function LegendaMapa() {
  return (
    <div className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2 text-micro text-muted-foreground">
      <span className="flex items-center gap-2">
        <span className="size-2.5 rounded-full bg-primary shadow-[0_0_10px_var(--primary)]" />
        rota com evidência
      </span>
      <span className="flex items-center gap-2">
        <span className="size-2.5 rounded-full border-2 border-primary" />
        rota em construção
      </span>
      <span className="flex items-center gap-2">
        <span className="size-2 rounded-full border border-accent/70 bg-arcane-soft" />
        padrão antigo
      </span>
    </div>
  );
}
