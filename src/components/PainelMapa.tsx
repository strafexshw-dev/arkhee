import { useEffect, useState } from "react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  forcaDaRota,
  leituraDaForca,
  ORDEM_STAGES,
  STAGES,
  type PadraoMapa,
  type Stage,
} from "@/lib/mapa";
import { DICOTOMIA_RESUMO, NOTAS, type Controle, type Nota } from "@/lib/sabedoria";
import type { SelecaoMapa } from "@/components/MapaGrafo";

type Props = {
  aberto: boolean;
  selecao: SelecaoMapa;
  padrao?: PadraoMapa | null | undefined;
  onFechar: () => void;
  /** abre o simulador já no passo D (evidência) */
  onRegistrarEvidencia?: ((padrao: PadraoMapa) => void) | undefined;
  /** registra uma evidência rápida, sem formulário */
  onEvidenciaRapida?: ((padrao: PadraoMapa) => void) | undefined;
  onContinuarRota?: ((padrao: PadraoMapa) => void) | undefined;
  onMapearArquetipo?: ((nota: Nota) => void) | undefined;
  onRemover?: ((padrao: PadraoMapa) => Promise<void> | void) | undefined;
};

const BOTAO =
  "ember-glow rounded-xl bg-primary px-5 py-2.5 text-small font-medium text-primary-foreground transition-transform duration-[var(--duration-fast)] ease-arcane hover:scale-[1.02]";
const BOTAO_FANTASMA =
  "rounded-xl border border-border px-4 py-2 text-small text-muted-foreground transition-colors duration-[var(--duration-fast)] hover:border-primary/40 hover:text-foreground";
const CARTAO = "rounded-xl border border-border bg-surface/40 p-4";

function Rotulo({ children }: { children: React.ReactNode }) {
  return <span className="label-arcane">{children}</span>;
}

/** Escada dos cinco estágios: onde o padrão está e o que falta. */
function EscadaDeEstagios({ stage }: { stage: Stage }) {
  const atual = STAGES[stage].ordem;
  return (
    <div>
      <div className="flex items-center gap-1" aria-hidden>
        {ORDEM_STAGES.map((s) => {
          const info = STAGES[s];
          return (
            <span
              key={s}
              className="h-1.5 flex-1 rounded-full transition-colors duration-500 ease-arcane"
              style={{
                backgroundColor: info.ordem <= atual ? info.cor : "var(--border)",
              }}
            />
          );
        })}
      </div>
      <div className="mt-2.5 flex items-center gap-2">
        <span
          className="inline-block size-2.5 rounded-full"
          style={{
            backgroundColor: STAGES[stage].cor,
            boxShadow: `0 0 ${4 + STAGES[stage].glow * 14}px ${STAGES[stage].cor}`,
          }}
        />
        <p className="text-small" style={{ color: STAGES[stage].cor }}>
          <span className="font-medium">{STAGES[stage].nome}</span>
          <span className="text-muted-foreground"> · {STAGES[stage].fase}</span>
        </p>
      </div>
      <p className="mt-1 text-micro text-muted-foreground">{STAGES[stage].resumo}</p>
    </div>
  );
}

/** A linha nova não nasce pronta: ela se completa com dias e ações. */
function ConexaoNova({ padrao, evidencias }: { padrao: PadraoMapa; evidencias: number }) {
  if (!padrao.new_action) return null;
  const forca = forcaDaRota({ criadoEm: padrao.created_at, evidencias });
  const leitura = leituraDaForca(forca);
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <Rotulo>Conexão do caminho novo</Rotulo>
        <span className="text-micro" style={{ color: STAGES.reprogrammed.cor }}>
          {leitura.pct}%
        </span>
      </div>
      <div
        className="mt-1.5 h-1.5 overflow-hidden rounded-full"
        style={{ backgroundColor: "var(--border)" }}
        role="progressbar"
        aria-valuenow={leitura.pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Quanto do caminho novo já se conectou"
      >
        <div
          className="h-full rounded-full transition-[width] duration-[1400ms] ease-arcane"
          style={{
            width: `${leitura.pct}%`,
            backgroundColor: STAGES.reprogrammed.cor,
            boxShadow: `0 0 8px ${STAGES.reprogrammed.cor}`,
          }}
        />
      </div>
      <p className="mt-1 text-micro text-muted-foreground">{leitura.falta}</p>
    </div>
  );
}

function BlocoNota({ nota, onUsar }: { nota: Nota; onUsar?: (() => void) | undefined }) {
  const [aberto, setAberto] = useState(true);
  return (
    <div className={CARTAO}>
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <span>
          <span className="label-arcane text-primary">Nota de reprogramação</span>
          <span className="mt-1 block text-body font-medium">{nota.nome}</span>
        </span>
        <span aria-hidden className="text-muted-foreground">
          {aberto ? "−" : "+"}
        </span>
      </button>

      <div
        className="grid transition-[grid-template-rows] duration-300 ease-arcane"
        style={{ gridTemplateRows: aberto ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="mt-3 space-y-3">
            <blockquote className="quote-arcane text-small">
              “{nota.voz.quote}”
              <footer className="mt-1.5 font-sans text-micro not-italic text-muted-foreground">
                {nota.voz.author} · {nota.voz.source}
              </footer>
            </blockquote>
            <div>
              <Rotulo>Pergunta</Rotulo>
              <p className="mt-1 text-small">{nota.pergunta}</p>
            </div>
            <div>
              <Rotulo>Micro-desafio</Rotulo>
              <p className="mt-1 text-small">{nota.desafio}</p>
            </div>
            {onUsar && (
              <button type="button" className={`${BOTAO_FANTASMA} w-full`} onClick={onUsar}>
                Usar esta nota na minha rota
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ConteudoPadrao({
  padrao,
  evidencias,
  stage,
  onRegistrarEvidencia,
  onEvidenciaRapida,
  onContinuarRota,
  onRemover,
}: {
  padrao: PadraoMapa;
  evidencias: number;
  stage: Stage;
  onRegistrarEvidencia?: ((p: PadraoMapa) => void) | undefined;
  onEvidenciaRapida?: ((p: PadraoMapa) => void) | undefined;
  onContinuarRota?: ((p: PadraoMapa) => void) | undefined;
  onRemover?: ((p: PadraoMapa) => Promise<void> | void) | undefined;
}) {
  const [confirmando, setConfirmando] = useState(false);
  const [notaAberta, setNotaAberta] = useState(false);
  const nota = NOTAS.find((n) => padrao.name.startsWith(n.nome)) ?? null;

  useEffect(() => {
    setConfirmando(false);
    setNotaAberta(false);
  }, [padrao.id]);

  const antigo = [
    { letra: "A", titulo: "Gatilho", valor: padrao.trigger_text },
    { letra: "B", titulo: "Pensamento automático", valor: padrao.thought },
    { letra: "A", titulo: "Reação antiga", valor: padrao.old_response },
    { letra: "A", titulo: "O que isso sempre te custou", valor: padrao.old_result },
  ].filter((c): c is { letra: string; titulo: string; valor: string } => !!c.valor);

  const novo = [
    { titulo: "Pensamento novo", valor: padrao.new_thought },
    { titulo: "Ação nova", valor: padrao.new_action },
    { titulo: "Evidência registrada", valor: padrao.new_evidence },
  ].filter((c): c is { titulo: string; valor: string } => !!c.valor);

  return (
    <>
      <EscadaDeEstagios stage={stage} />

      <ConexaoNova padrao={padrao} evidencias={evidencias} />

      <div className="grid grid-cols-2 gap-3">
        <div className={`${CARTAO} text-center`}>
          <p className="font-display text-subtitle" style={{ color: STAGES.integrated.cor }}>
            {evidencias}
          </p>
          <p className="text-micro text-muted-foreground">
            {evidencias === 1 ? "evidência registrada" : "evidências registradas"}
          </p>
        </div>
        <div className={`${CARTAO} text-center`}>
          <p className="font-display text-subtitle text-primary">
            {padrao.new_action ? "sim" : "ainda não"}
          </p>
          <p className="text-micro text-muted-foreground">novo caminho traçado</p>
        </div>
      </div>

      {antigo.length > 0 && (
        <div>
          <Rotulo>Padrão antigo</Rotulo>
          <ul className="mt-2 space-y-2">
            {antigo.map((c, i) => (
              <li key={`a-${i}`} className="border-l-2 border-muted-foreground/25 pl-3 opacity-70">
                <p className="text-micro text-muted-foreground">
                  {c.letra} · {c.titulo}
                </p>
                <p className="text-small">{c.valor}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {novo.length > 0 ? (
        <div>
          <Rotulo>Novo caminho</Rotulo>
          <ul className="mt-2 space-y-2">
            {novo.map((c, i) => (
              <li
                key={`n-${i}`}
                className="border-l-2 border-primary/70 pl-3"
                style={{ boxShadow: "inset 0 0 24px var(--ember-soft)" }}
              >
                <p className="text-micro text-ember">{c.titulo}</p>
                <p className="text-small">{c.valor}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-small text-muted-foreground italic">
          Este padrão foi notado, mas ainda não tem caminho novo. É exatamente aqui que a Fase II
          começa: interromper a resposta automática.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {onRegistrarEvidencia && (
          <button type="button" className={BOTAO} onClick={() => onRegistrarEvidencia(padrao)}>
            Registrar evidência
          </button>
        )}
        {onEvidenciaRapida && (
          <button
            type="button"
            className={BOTAO_FANTASMA}
            onClick={() => onEvidenciaRapida(padrao)}
          >
            Evidência rápida (sem descrever)
          </button>
        )}
        {nota ? (
          <button type="button" className={BOTAO_FANTASMA} onClick={() => setNotaAberta((v) => !v)}>
            {notaAberta ? "Fechar nota de reprogramação" : "Abrir nota de reprogramação"}
          </button>
        ) : (
          onContinuarRota && (
            <button
              type="button"
              className={BOTAO_FANTASMA}
              onClick={() => onContinuarRota(padrao)}
            >
              Continuar a rota (A→D)
            </button>
          )
        )}
      </div>

      {nota && notaAberta && <BlocoNota nota={nota} onUsar={() => onContinuarRota?.(padrao)} />}

      {onRemover && (
        <div className="mt-auto border-t border-border/50 pt-3">
          {confirmando ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="flex-1 rounded-xl bg-destructive px-4 py-2 text-small font-medium text-destructive-foreground transition-opacity hover:opacity-90"
                onClick={async () => {
                  await onRemover(padrao);
                }}
              >
                Confirmar remoção
              </button>
              <button
                type="button"
                className="rounded-xl px-3 py-2 text-small text-muted-foreground hover:text-foreground"
                onClick={() => setConfirmando(false)}
              >
                cancelar
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="w-full rounded-xl px-4 py-2 text-micro text-muted-foreground transition-colors duration-[var(--duration-fast)] hover:text-destructive"
              onClick={() => setConfirmando(true)}
            >
              Remover do mapa
            </button>
          )}
        </div>
      )}
    </>
  );
}

/**
 * Painel lateral do nó: nome, estágio, caminho antigo → novo e as ações.
 * Lateral direita no desktop, folha inferior no celular.
 */
export function PainelMapa({
  aberto,
  selecao,
  padrao,
  onFechar,
  onRegistrarEvidencia,
  onEvidenciaRapida,
  onContinuarRota,
  onMapearArquetipo,
  onRemover,
}: Props) {
  const mobile = useIsMobile();

  let titulo = "Você";
  let descricao = "O centro do mapa — quem observa tudo isso.";
  if (selecao?.tipo === "anel") {
    titulo = selecao.label;
    descricao = DICOTOMIA_RESUMO[selecao.controle as Controle];
  } else if (selecao?.tipo === "padrao") {
    titulo = selecao.label;
    descricao = `Padrão mapeado · ${selecao.evidencias === 1 ? "1 evidência" : `${selecao.evidencias} evidências`}`;
  } else if (selecao?.tipo === "pedra") {
    titulo = selecao.label;
    descricao = "Ainda não mapeado — pedra bruta.";
  }

  const notaDaPedra = selecao?.tipo === "pedra" ? NOTAS.find((n) => n.id === selecao.id) : null;
  const notasDoAnel =
    selecao?.tipo === "anel" ? NOTAS.filter((n) => n.controle === selecao.controle) : [];
  const stage = selecao?.tipo === "padrao" ? selecao.stage : null;

  return (
    <Sheet open={aberto && !!selecao} onOpenChange={(v) => !v && onFechar()}>
      <SheetContent
        side={mobile ? "bottom" : "right"}
        className="arcane-glow flex max-h-[88dvh] w-full flex-col gap-4 overflow-y-auto border-edge p-5 sm:max-w-[26rem]"
        style={{
          backgroundColor: "oklch(0.2 0.014 285 / 90%)",
          backdropFilter: "blur(18px)",
          borderRadius: mobile
            ? "var(--radius-2xl) var(--radius-2xl) 0 0"
            : "var(--radius-2xl) 0 0 var(--radius-2xl)",
        }}
      >
        <SheetHeader className="text-left">
          <SheetTitle className="font-display text-subtitle leading-tight text-ember">
            {titulo}
          </SheetTitle>
          <SheetDescription className="text-micro">{descricao}</SheetDescription>
        </SheetHeader>

        {selecao?.tipo === "padrao" && padrao && stage && (
          <ConteudoPadrao
            padrao={padrao}
            evidencias={selecao.evidencias}
            stage={stage}
            onRegistrarEvidencia={onRegistrarEvidencia}
            onEvidenciaRapida={onEvidenciaRapida}
            onContinuarRota={onContinuarRota}
            onRemover={onRemover}
          />
        )}

        {selecao?.tipo === "padrao" && !padrao && (
          <p className="text-small text-muted-foreground">Carregando este padrão...</p>
        )}

        {selecao?.tipo === "pedra" && (
          <>
            <p className="text-small text-muted-foreground">
              Este arquétipo existe no mapa, mas você ainda não o reconheceu em si. Enquanto não for
              nomeado, continua pedra bruta — presente, porém invisível.
            </p>
            {notaDaPedra && <BlocoNota nota={notaDaPedra} />}
            {notaDaPedra && (
              <button
                type="button"
                className={BOTAO}
                onClick={() => onMapearArquetipo?.(notaDaPedra)}
              >
                Mapear este padrão
              </button>
            )}
          </>
        )}

        {selecao?.tipo === "anel" && (
          <div className="space-y-3">
            {notasDoAnel.length > 0 && (
              <>
                <Rotulo>Arquétipos deste lado</Rotulo>
                {notasDoAnel.map((nota) => (
                  <div key={nota.id} className={CARTAO}>
                    <p className="text-small font-medium">{nota.nome}</p>
                    <p className="mt-1 text-micro text-muted-foreground">{nota.pergunta}</p>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {selecao?.tipo === "centro" && (
          <div className="space-y-3">
            <p className="text-small">
              Tudo o que está <span className="text-ember">dentro</span> do anel interno é seu:
              julgamento, impulso, atenção, ação, esforço, resposta. Tudo o que está fora — opinião,
              resultado, passado, reputação, os outros, o tempo — não é.
            </p>
            <p className="quote-arcane text-small">
              A distância entre os dois anéis é o tamanho da sua liberdade.
            </p>
            <p className="text-micro text-muted-foreground">
              Epicteto, Encheirídion 1 — a geometria do mapa vem daqui.
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
