import { useEffect, useState } from "react";

import { ANEL_EXTERNO, ANEL_INTERNO, DICOTOMIA_RESUMO, type Controle } from "@/lib/sabedoria";
import { ORDEM_STAGES, STAGES, type Stage } from "@/lib/mapa";

export type SelecaoMapa =
  | { tipo: "centro" }
  | { tipo: "anel"; controle: Controle; id: string; label: string }
  | { tipo: "padrao"; id: string; label: string; stage: Stage; evidencias: number }
  | { tipo: "pedra"; id: string; label: string; controle: Controle }
  | null;

export type NoPadraoGrafo = {
  id: string;
  label: string;
  stage: Stage;
  controle: Controle;
  evidencias: number;
  emRota: boolean;
};

export type NoPedraGrafo = {
  id: string;
  label: string;
  controle: Controle;
};

type Props = {
  /** padrões que a pessoa já mapeou (cada um vira um nó revelado) */
  padroes: NoPadraoGrafo[];
  /** arquétipos da biblioteca ainda não mapeados — pedra bruta */
  pedras: NoPedraGrafo[];
  selecao?: SelecaoMapa;
  onSelect?: (sel: SelecaoMapa) => void;
  /** dispara o pulso neural neste nó (ex.: evidência recém-registrada) */
  pulso?: { id: string; n: number } | null;
  className?: string;
};

/** ângulo em graus → posição em % do canvas */
function posicao(angulo: number, raio: number) {
  const rad = (angulo * Math.PI) / 180;
  return { x: 50 + raio * Math.cos(rad), y: 50 + raio * Math.sin(rad) };
}

function reduzMovimento() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function MapaGrafo({ padroes, pedras, selecao, onSelect, pulso, className = "" }: Props) {
  const [reduzido, setReduzido] = useState(false);

  useEffect(() => {
    setReduzido(reduzMovimento());
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduzido(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // anéis fixos da dicotomia
  const nosInternos = ANEL_INTERNO.map((n, i) => ({
    ...n,
    controle: "interno" as Controle,
    ...posicao(-90 + i * 60, 26),
  }));
  const nosExternos = ANEL_EXTERNO.map((n, i) => ({
    ...n,
    controle: "externo" as Controle,
    ...posicao(-90 + 30 + i * 60, 44),
  }));
  const acao = nosInternos[3]!;

  // nós da pessoa: revelados primeiro, pedra bruta depois
  type NoPessoa = {
    tipo: "padrao" | "pedra";
    id: string;
    label: string;
    controle: Controle;
    stage: Stage;
    evidencias: number;
    emRota: boolean;
    x: number;
    y: number;
  };
  const nosPessoa: NoPessoa[] = [];

  (["interno", "externo"] as Controle[]).forEach((controle) => {
    const revelados: NoPessoa[] = padroes
      .filter((p) => p.controle === controle)
      .map((p) => ({ tipo: "padrao", ...p, x: 0, y: 0 }));
    const brutas: NoPessoa[] = pedras
      .filter((p) => p.controle === controle)
      .map((p) => ({
        tipo: "pedra",
        id: p.id,
        label: p.label,
        controle,
        stage: "unmapped",
        evidencias: 0,
        emRota: false,
        x: 0,
        y: 0,
      }));

    const todos = [...revelados, ...brutas];
    const raio = controle === "interno" ? 33 : 38.5;
    const inicio = controle === "interno" ? -60 : -90;
    const passo = todos.length ? 360 / todos.length : 0;

    todos.forEach((no, i) => {
      const { x, y } = posicao(inicio + i * passo, raio);
      nosPessoa.push({ ...no, x, y });
    });
  });

  const selecionado = (id: string, tipo: string) =>
    selecao?.tipo === tipo && (selecao as { id?: string }).id === id;

  return (
    <div className={`relative aspect-square w-full max-w-[27.5rem] ${className}`}>
      {/* profundidade: mais claro perto do centro */}
      <div className="pointer-events-none absolute inset-[16%] rounded-full bg-primary/6 blur-3xl pulse-slow" />

      {/* anéis concêntricos com opacidade escalonada */}
      {[
        { r: "inset-[33%]", op: "border-primary/22" },
        { r: "inset-[24%]", op: "border-primary/12" },
        { r: "inset-[6%]", op: "border-accent/7" },
      ].map((anel) => (
        <div
          key={anel.r}
          aria-hidden
          className={`pointer-events-none absolute ${anel.r} rounded-full border border-dashed ${anel.op}`}
        />
      ))}

      {/* linhas */}
      <svg
        viewBox="0 0 100 100"
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full"
      >
        {nosInternos.map((no) => (
          <line
            key={`li-${no.id}`}
            x1={50}
            y1={50}
            x2={no.x}
            y2={no.y}
            stroke="var(--primary)"
            strokeWidth={no.id === "acao" ? 0.45 : 0.3}
            strokeOpacity={no.id === "acao" ? 0.4 : 0.2}
            strokeDasharray={no.id === "acao" ? "1.6 1.6" : undefined}
          />
        ))}
        {nosExternos.map((no) => (
          <line
            key={`le-${no.id}`}
            x1={50}
            y1={50}
            x2={no.x}
            y2={no.y}
            stroke="var(--accent)"
            strokeWidth={0.22}
            strokeOpacity={0.16}
          />
        ))}

        {nosPessoa.map((no) => {
          if (no.tipo === "pedra") return null;
          const info = STAGES[no.stage];
          const revelado = info.ordem >= 3;
          const ativa = selecionado(no.id, "padrao");
          return (
            <g key={`g-${no.id}`}>
              {/* caminho antigo: frio, tracejado, fino — esmaece quando a rota existe */}
              <line
                x1={50}
                y1={50}
                x2={no.x}
                y2={no.y}
                stroke="var(--stage-unmapped)"
                strokeWidth={0.4}
                strokeOpacity={revelado ? 0.16 : 0.34}
                strokeDasharray="1.2 1.4"
                style={{ transition: "stroke-opacity var(--duration-stage) var(--ease-arcane)" }}
              />
              {/* caminho novo: quente, sólido, com fluxo — só existe depois da Fase III */}
              {no.emRota && (
                <>
                  <line
                    x1={no.x}
                    y1={no.y}
                    x2={acao.x}
                    y2={acao.y}
                    stroke={info.cor}
                    strokeWidth={ativa ? 3.4 : 2.4}
                    strokeOpacity={0.1 + info.glow * 0.1}
                    style={{ transition: "all var(--duration-stage) var(--ease-arcane)" }}
                  />
                  <line
                    x1={no.x}
                    y1={no.y}
                    x2={acao.x}
                    y2={acao.y}
                    stroke={info.cor}
                    strokeWidth={ativa ? 1.15 : 0.8}
                    strokeOpacity={0.5 + info.glow * 0.5}
                    strokeLinecap="round"
                    style={{ transition: "all var(--duration-stage) var(--ease-arcane)" }}
                  />
                  {!reduzido && (
                    <circle r={0.85} fill={info.cor} opacity={0.95}>
                      <animateMotion
                        dur={revelado ? "2.6s" : "3.6s"}
                        repeatCount="indefinite"
                        path={`M ${no.x} ${no.y} L ${acao.x} ${acao.y}`}
                      />
                    </circle>
                  )}
                </>
              )}
            </g>
          );
        })}
      </svg>

      {/* nós fixos — anel interno */}
      {nosInternos.map((no) => {
        const ativa = selecionado(no.id, "anel");
        return (
          <NoBotao
            key={no.id}
            x={no.x}
            y={no.y}
            cor="var(--primary)"
            tamanho={12}
            glow={0.5}
            ativa={ativa}
            rotulo={no.curto}
            dicaAbaixo={no.y < 50}
            dica={`${DICOTOMIA_RESUMO.interno} ${no.label}`}
            ariaLabel={`Nó ${no.label}, dentro do seu controle`}
            onClique={() =>
              onSelect?.({ tipo: "anel", controle: "interno", id: no.id, label: no.label })
            }
          />
        );
      })}

      {/* nós fixos — anel externo */}
      {nosExternos.map((no) => {
        const ativa = selecionado(no.id, "anel");
        return (
          <NoBotao
            key={no.id}
            x={no.x}
            y={no.y}
            cor="var(--accent)"
            tamanho={10}
            glow={0.3}
            ativa={ativa}
            rotulo={no.curto}
            dicaAbaixo={no.y < 50}
            dica={`${DICOTOMIA_RESUMO.externo} ${no.label}`}
            ariaLabel={`Nó ${no.label}, fora do seu controle`}
            onClique={() =>
              onSelect?.({ tipo: "anel", controle: "externo", id: no.id, label: no.label })
            }
          />
        );
      })}

      {/* nós da pessoa */}
      {nosPessoa.map((no) => {
        if (no.tipo === "pedra") {
          return (
            <NoBotao
              key={`pedra-${no.id}`}
              x={no.x}
              y={no.y}
              cor="var(--stage-unmapped)"
              tamanho={8}
              glow={0}
              pedra
              ativa={selecionado(no.id, "pedra")}
              dicaAbaixo={no.y < 50}
              dica={`${no.label} · ainda não mapeado`}
              ariaLabel={`${no.label}, ainda não mapeado`}
              onClique={() =>
                onSelect?.({ tipo: "pedra", id: no.id, label: no.label, controle: no.controle })
              }
            />
          );
        }

        const info = STAGES[no.stage];
        const ativa = selecionado(no.id, "padrao");
        const pulsando = pulso?.id === no.id;
        const rotulo = no.label.includes("·")
          ? (no.label.split("·").pop() ?? no.label).trim()
          : no.label;

        return (
          <div
            key={no.id}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${no.x}%`, top: `${no.y}%` }}
          >
            <NoBotao
              x={0}
              y={0}
              relativo
              pulso={pulsando ? (pulso?.n ?? 0) : null}
              cor={info.cor}
              tamanho={info.tamanho}
              glow={info.glow}
              ativa={ativa}
              rotulo={rotulo}
              dicaAbaixo={no.y < 50}
              dica={`${no.label} · ${info.nome}`}
              ariaLabel={`Padrão ${no.label}, estágio ${info.nome}`}
              onClique={() =>
                onSelect?.({
                  tipo: "padrao",
                  id: no.id,
                  label: no.label,
                  stage: no.stage,
                  evidencias: no.evidencias,
                })
              }
            />
          </div>
        );
      })}

      {/* centro — respiração 4×4 */}
      <button
        type="button"
        onClick={() => onSelect?.({ tipo: "centro" })}
        aria-label="Você — o centro do mapa"
        className="absolute left-1/2 top-1/2 z-10 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-primary/45 bg-surface/90 text-center backdrop-blur-sm transition-transform duration-[var(--duration-fast)] ease-arcane hover:scale-[1.04] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        style={{ boxShadow: "0 0 30px var(--ember-soft), inset 0 0 24px var(--ember-soft)" }}
      >
        <span aria-hidden className="medita text-lg text-primary">
          ✦
        </span>
        <span className="text-micro text-muted-foreground">Você</span>
      </button>

      {/* rótulos do meio das linhas — só do padrão selecionado, para não poluir */}
      {selecao?.tipo === "padrao" &&
        (() => {
          const no = nosPessoa.find((n) => n.id === selecao.id && n.tipo === "padrao");
          if (!no) return null;
          const info = STAGES[no.stage];
          return (
            <>
              <span
                className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-micro text-muted-foreground"
                style={{ left: `${(50 + no.x) / 2}%`, top: `${(50 + no.y) / 2 - 3}%` }}
              >
                padrão antigo
              </span>
              {no.emRota && (
                <span
                  className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-micro"
                  style={{
                    left: `${(no.x + acao.x) / 2}%`,
                    top: `${(no.y + acao.y) / 2 + 3.5}%`,
                    color: info.cor,
                  }}
                >
                  novo caminho
                </span>
              )}
            </>
          );
        })()}
    </div>
  );
}

function NoBotao({
  x,
  y,
  relativo,
  cor,
  tamanho,
  glow,
  ativa,
  pedra,
  rotulo,
  dica,
  dicaAbaixo,
  pulso,
  ariaLabel,
  onClique,
}: {
  x: number;
  y: number;
  relativo?: boolean;
  cor: string;
  tamanho: number;
  glow: number;
  ativa?: boolean;
  pedra?: boolean;
  rotulo?: string;
  dica: string;
  /** tooltip para baixo — evita cortar nos nós do topo do mapa */
  dicaAbaixo?: boolean;
  /** dispara o anel de pulso (evidência recém-registrada) */
  pulso?: number | null;
  ariaLabel: string;
  onClique: () => void;
}) {
  return (
    <span
      className={
        relativo
          ? "tooltip-host relative block"
          : "tooltip-host absolute -translate-x-1/2 -translate-y-1/2"
      }
      style={relativo ? undefined : { left: `${x}%`, top: `${y}%` }}
    >
      <button
        type="button"
        onClick={onClique}
        aria-label={ariaLabel}
        aria-pressed={ativa}
        className={`no-mapa flex flex-col items-center gap-1 rounded-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${ativa ? "z-20" : "z-10"}`}
      >
        <span className="relative block">
          {pulso != null && (
            <span
              key={pulso}
              aria-hidden
              className="pulse-ring pointer-events-none absolute -inset-1 rounded-full border-2"
              style={{ borderColor: cor }}
            />
          )}
          <span
            className={`block rounded-full ${pedra ? "pedra" : ""}`}
            style={{
              width: ativa ? tamanho + 4 : tamanho,
              height: ativa ? tamanho + 4 : tamanho,
              backgroundColor: pedra ? undefined : cor,
              boxShadow: pedra
                ? undefined
                : `0 0 ${4 + glow * 18}px ${cor}, 0 0 ${glow * 40}px ${cor}`,
            }}
          />
        </span>
        {rotulo && (
          <span
            className="no-rotulo"
            style={{ color: ativa ? cor : "var(--muted-foreground)", fontSize: ativa ? 13 : 11 }}
          >
            {rotulo}
          </span>
        )}
      </button>
      <span
        className={`tooltip-arcano left-1/2 -translate-x-1/2 ${
          dicaAbaixo ? "top-full mt-1.5" : "-top-1.5 -translate-y-full"
        }`}
      >
        {dica}
      </span>
    </span>
  );
}

export function LegendaMapa({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-wrap gap-x-4 gap-y-2 ${className}`}>
      {ORDEM_STAGES.map((stage) => {
        const info = STAGES[stage];
        return (
          <span key={stage} className="flex items-center gap-1.5">
            <span
              className={`inline-block rounded-full ${stage === "unmapped" ? "pedra" : ""}`}
              style={{
                width: Math.max(7, info.tamanho - 3),
                height: Math.max(7, info.tamanho - 3),
                backgroundColor: stage === "unmapped" ? undefined : info.cor,
                boxShadow:
                  stage === "unmapped" ? undefined : `0 0 ${4 + info.glow * 12}px ${info.cor}`,
              }}
            />
            <span className="text-micro text-muted-foreground">{info.nome}</span>
          </span>
        );
      })}
    </div>
  );
}
