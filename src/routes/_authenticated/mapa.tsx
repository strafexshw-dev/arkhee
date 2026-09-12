import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { db as supabase } from "@/lib/db";
import { AppShell, PageTitle } from "@/components/AppShell";
import { LegendaMapa, MapaGrafo, type PadraoNo, type Selecao } from "@/components/MapaGrafo";
import { BlocoNota, SimuladorRota } from "@/components/SimuladorRota";
import { ROTA_VAZIA, promptEvidencia, type RotaDraft } from "@/lib/rota";
import {
  ANEL_EXTERNO,
  ANEL_INTERNO,
  DICOTOMIA_VOZ,
  NOTAS,
  notaPara,
  notaPorId,
  VOZES_FASE,
  type Nota,
} from "@/lib/sabedoria";

export const Route = createFileRoute("/_authenticated/mapa")({
  head: () => ({
    meta: [
      { title: "Mapa Mental — Reflexo Arcano" },
      {
        name: "description",
        content:
          "Um mapa neural dos seus gatilhos, crenças, emoções e novos caminhos — com a dicotomia do controle e notas de reprogramação.",
      },
      { property: "og:title", content: "Mapa Mental — Reflexo Arcano" },
      {
        property: "og:description",
        content: "Diagnostique, simule a rota nova e registre a evidência.",
      },
    ],
  }),
  component: Mapa,
});

type Pattern = {
  id: string;
  name: string;
  trigger_text: string | null;
  thought: string | null;
  emotion: string | null;
  old_response: string | null;
  old_result: string | null;
  new_thought: string | null;
  new_action: string | null;
  new_evidence: string | null;
};

function arquetipoDe(p: Pattern): Nota | null {
  const peloNome = NOTAS.find((nota) => p.name.startsWith(nota.nome));
  if (peloNome) return peloNome;
  return notaPara(
    `${p.name} ${p.trigger_text ?? ""} ${p.thought ?? ""} ${p.emotion ?? ""} ${p.old_response ?? ""}`,
  );
}

function paraRota(p: Pattern): RotaDraft {
  return {
    id: p.id,
    name: p.name,
    trigger_text: p.trigger_text ?? "",
    thought: p.thought ?? "",
    emotion: p.emotion ?? "",
    old_response: p.old_response ?? "",
    old_result: p.old_result ?? "",
    new_thought: p.new_thought ?? "",
    new_action: p.new_action ?? "",
    new_evidence: p.new_evidence ?? "",
  };
}

function Mapa() {
  const [userId, setUserId] = useState<string | null>(null);
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [counts, setCounts] = useState({
    beliefs: 0,
    emotions: 0,
    triggers: 0,
    habits: 0,
    traits: 0,
  });
  const [evidencias, setEvidencias] = useState<Record<string, number>>({});
  const [selecao, setSelecao] = useState<Selecao>(null);
  const [simulador, setSimulador] = useState<{ rota: RotaDraft; passo: number } | null>(null);

  const load = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    const id = auth.user!.id;
    setUserId(id);

    const [{ data: tp }, b, c, h, tr, { data: journal }] = await Promise.all([
      supabase.from("thought_patterns").select("*").eq("user_id", id).order("created_at"),
      supabase.from("beliefs").select("id", { count: "exact", head: true }).eq("user_id", id),
      supabase
        .from("mental_checkins")
        .select("id", { count: "exact", head: true })
        .eq("user_id", id),
      supabase.from("habits").select("id", { count: "exact", head: true }).eq("user_id", id),
      supabase
        .from("identity_traits")
        .select("id", { count: "exact", head: true })
        .eq("user_id", id),
      supabase.from("journal_entries").select("prompt").eq("user_id", id),
    ]);

    const lista = (tp ?? []) as Pattern[];
    setPatterns(lista);
    setCounts({
      beliefs: b.count ?? 0,
      emotions: c.count ?? 0,
      triggers: lista.length,
      habits: h.count ?? 0,
      traits: tr.count ?? 0,
    });

    const porPadrao: Record<string, number> = {};
    for (const p of lista) {
      const chave = promptEvidencia(p.name);
      porPadrao[p.id] = (journal ?? []).filter((e) => e.prompt === chave).length;
    }
    setEvidencias(porPadrao);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const nos: PadraoNo[] = patterns.map((p) => {
    const nota = arquetipoDe(p);
    const extras = evidencias[p.id] ?? 0;
    return {
      id: p.id,
      name: p.name,
      controle: nota?.controle ?? "interno",
      emRota: !!p.new_action,
      completo: !!p.new_evidence || extras > 0,
      evidencias: extras,
    };
  });

  const padraoSelecionado =
    selecao?.tipo === "padrao" ? patterns.find((p) => p.id === selecao.id) : null;
  const notaSelecionada = padraoSelecionado ? arquetipoDe(padraoSelecionado) : null;

  function abrirSimulador(rota?: RotaDraft, passo = 0) {
    if (!rota) {
      setSimulador({
        rota: { ...ROTA_VAZIA, name: selecaoNotaNome() },
        passo,
      });
      return;
    }
    setSimulador({ rota, passo });
  }

  /** se a pessoa clicou num nó-arquétipo, a rota já nasce conectada a ele */
  function selecaoNotaNome(): string {
    if (selecao?.tipo === "padrao") return "";
    if (selecao?.tipo === "interno" || selecao?.tipo === "externo") {
      const anel = selecao.tipo === "interno" ? ANEL_INTERNO : ANEL_EXTERNO;
      const no = anel.find((n) => n.id === selecao.id);
      const nota = NOTAS.find((n) =>
        n.nome.toLowerCase().includes((no?.label ?? "").toLowerCase()),
      );
      return nota ? nota.nome : "";
    }
    return "";
  }

  return (
    <AppShell>
      <PageTitle
        kicker="Mapa mental"
        title="O que orbita você"
        quote="O centro é o que você controla. A borda é o que nunca foi seu. Seus padrões vivem entre os dois."
      />

      <div className="rise-in mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <span className="chip-muted">{counts.triggers} gatilhos</span>
          <span className="chip-muted">{counts.beliefs} crenças</span>
          <span className="chip-muted">{counts.emotions} check-ins</span>
          <span className="chip-muted">{counts.habits} hábitos</span>
          <span className="chip-muted">{counts.traits} identidades</span>
        </div>
        <button
          onClick={() => abrirSimulador()}
          className="ember-glow rounded-xl bg-primary px-5 py-2.5 text-small font-medium text-primary-foreground transition-transform duration-[var(--duration-fast)] ease-arcane hover:scale-[1.02]"
        >
          Criar rota nova
        </button>
      </div>

      <div
        className="glass-strong arcane-glow rise-in p-5 sm:p-7"
        style={{ animationDelay: "60ms" }}
      >
        <MapaGrafo padroes={nos} selecionado={selecao} onSelect={setSelecao} />
        <LegendaMapa />
      </div>

      {/* painel do que foi selecionado */}
      {selecao && (
        <div className="rise-in mt-6">
          {selecao.tipo === "padrao" && padraoSelecionado ? (
            <PainelPadrao
              padrao={padraoSelecionado}
              nota={notaSelecionada}
              onContinuar={() => abrirSimulador(paraRota(padraoSelecionado), 0)}
              onEvidencia={() => abrirSimulador(paraRota(padraoSelecionado), 3)}
            />
          ) : (
            <PainelNo
              selecao={selecao}
              onUsar={(nota) => abrirSimulador({ ...ROTA_VAZIA, name: nota.nome })}
            />
          )}
        </div>
      )}

      {/* lista de padrões */}
      <div className="mt-9">
        <div className="label-arcane mb-3">Padrões mapeados</div>
        {patterns.length === 0 ? (
          <div className="glass p-6 text-small text-muted-foreground">
            Nenhum padrão ainda. Comece por{" "}
            <strong className="text-foreground">Criar rota nova</strong> — leva dois minutos e o nó
            já aparece no mapa.
          </div>
        ) : (
          <div className="glass divide-y divide-border/60 overflow-hidden">
            {patterns.map((p) => {
              const ativo = selecao?.tipo === "padrao" && selecao.id === p.id;
              const nota = arquetipoDe(p);
              const completo = !!p.new_evidence || (evidencias[p.id] ?? 0) > 0;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelecao(ativo ? null : { tipo: "padrao", id: p.id })}
                  className={`flex w-full items-center gap-3 px-5 py-4 text-left transition-colors duration-[var(--duration-fast)] hover:bg-secondary/30 ${
                    ativo ? "bg-ember-soft/60" : ""
                  }`}
                >
                  <span
                    className={`size-2 shrink-0 rounded-full ${
                      completo
                        ? "bg-primary shadow-[0_0_10px_var(--primary)]"
                        : p.new_action
                          ? "border-2 border-primary"
                          : "bg-accent/60"
                    }`}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-lead leading-tight">
                      {p.name}
                    </span>
                    {nota && (
                      <span className="mt-0.5 block text-micro text-muted-foreground">
                        nó {nota.nome} ·{" "}
                        {nota.controle === "interno" ? "ao seu alcance" : "fora do seu alcance"}
                      </span>
                    )}
                  </span>
                  {(evidencias[p.id] ?? 0) > 0 && (
                    <span className="chip-arcane shrink-0">{evidencias[p.id]} ✦</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <Biblioteca onUsar={(nota) => abrirSimulador({ ...ROTA_VAZIA, name: nota.nome })} />

      {simulador && userId && (
        <SimuladorRota
          userId={userId}
          initial={simulador.rota}
          passoInicial={simulador.passo}
          onClose={() => setSimulador(null)}
          onSaved={() => {
            setSimulador(null);
            void load();
          }}
        />
      )}
    </AppShell>
  );
}

function PainelPadrao({
  padrao,
  nota,
  onContinuar,
  onEvidencia,
}: {
  padrao: Pattern;
  nota: Nota | null;
  onContinuar: () => void;
  onEvidencia: () => void;
}) {
  return (
    <div className="glass-strong p-6">
      <div className="label-arcane">Rota selecionada</div>
      <h2 className="mt-1.5 font-display text-subtitle leading-tight">{padrao.name}</h2>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface/40 p-5">
          <div className="label-arcane mb-3">Caminho antigo</div>
          <Chain
            items={[
              ["Gatilho", padrao.trigger_text],
              ["Pensamento", padrao.thought],
              ["Emoção", padrao.emotion],
              ["Resposta antiga", padrao.old_response],
              ["Resultado", padrao.old_result],
            ]}
          />
        </div>
        <div className="arcane-glow rounded-xl border border-primary/25 bg-ember-soft/40 p-5">
          <div className="label-arcane mb-3 text-primary">Novo caminho</div>
          <Chain
            items={[
              ["Pensamento consciente", padrao.new_thought],
              ["Nova ação", padrao.new_action],
              ["Evidência", padrao.new_evidence],
            ]}
          />
        </div>
      </div>

      {nota && (
        <div className="mt-5">
          <BlocoNota nota={nota} />
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          onClick={onContinuar}
          className="rounded-xl border border-primary/50 px-5 py-2.5 text-small text-primary transition-colors duration-[var(--duration-fast)] hover:bg-ember-soft"
        >
          Continuar esta rota
        </button>
        <button
          onClick={onEvidencia}
          className="ember-glow rounded-xl bg-primary px-5 py-2.5 text-small font-medium text-primary-foreground transition-transform duration-[var(--duration-fast)] ease-arcane hover:scale-[1.02]"
        >
          Registrar evidência
        </button>
      </div>
    </div>
  );
}

function PainelNo({ selecao, onUsar }: { selecao: Selecao; onUsar: (nota: Nota) => void }) {
  const [aberta, setAberta] = useState<string | null>(null);

  if (selecao?.tipo === "centro") {
    return (
      <div className="glass-strong arcane-glow p-6">
        <div className="label-arcane">Centro</div>
        <h2 className="mt-1.5 font-display text-subtitle">A faculdade que governa</h2>
        <blockquote className="quote-arcane mt-4 border-l border-primary/30 pl-4 text-body">
          “{DICOTOMIA_VOZ.quote}”
          <footer className="mt-2 font-sans text-micro not-italic text-muted-foreground">
            {DICOTOMIA_VOZ.author} · {DICOTOMIA_VOZ.source}
          </footer>
        </blockquote>
        <p className="mt-4 text-small text-muted-foreground">
          Todo padrão que você mapeia nasce aqui: não no que aconteceu, mas no julgamento sobre o
          que aconteceu. É o único nó que nunca pode ser retirado de você.
        </p>
      </div>
    );
  }

  const interno = selecao?.tipo === "interno";
  const anel = interno ? ANEL_INTERNO : ANEL_EXTERNO;
  const no = anel.find((n) => n.id === selecao?.id);
  const voz = interno ? DICOTOMIA_VOZ : VOZES_FASE[3]!;
  const relacionadas = NOTAS.filter((n) =>
    interno ? n.controle === "interno" : n.controle === "externo",
  );

  return (
    <div className="glass-strong p-6">
      <div className={`label-arcane ${interno ? "text-primary" : "text-accent"}`}>
        {interno ? "Ao seu alcance" : "Fora do seu alcance"}
      </div>
      <h2 className="mt-1.5 font-display text-subtitle">{no?.label ?? "Nó"}</h2>
      <blockquote className="quote-arcane mt-4 border-l border-primary/30 pl-4 text-body">
        “{voz.quote}”
        <footer className="mt-2 font-sans text-micro not-italic text-muted-foreground">
          {voz.author} · {voz.source}
        </footer>
      </blockquote>
      <p className="mt-4 text-small text-muted-foreground">
        {interno
          ? "Isto responde a você. Não ao clima, não ao humor, não à plateia: a você."
          : "Isto nunca esteve sob seu comando. Sofrer por aqui é pagar duas vezes pela mesma coisa."}
      </p>

      <div className="mt-5">
        <div className="label-arcane mb-2">Nós ligados a este {interno ? "lado" : "anel"}</div>
        <div className="flex flex-wrap gap-2">
          {relacionadas.map((nota) => (
            <button
              key={nota.id}
              onClick={() => setAberta(aberta === nota.id ? null : nota.id)}
              className={`rounded-pill border px-3.5 py-1.5 text-micro transition-colors duration-[var(--duration-fast)] ${
                aberta === nota.id
                  ? "border-primary/60 bg-ember-soft text-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {nota.nome}
            </button>
          ))}
        </div>
        {aberta && (
          <div className="mt-4">
            <BlocoNota nota={notaPorId(aberta)!} />
            <button
              onClick={() => onUsar(notaPorId(aberta)!)}
              className="mt-3 rounded-xl border border-primary/50 px-5 py-2.5 text-small text-primary transition-colors duration-[var(--duration-fast)] hover:bg-ember-soft"
            >
              Criar rota a partir deste nó
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Biblioteca({ onUsar }: { onUsar: (nota: Nota) => void }) {
  const [aberta, setAberta] = useState<string | null>(null);

  return (
    <section className="mt-12">
      <div className="label-arcane mb-2">Biblioteca</div>
      <h2 className="font-display text-subtitle">Notas de Reprogramação</h2>
      <p className="quote-arcane mt-3 text-body">
        Cada nó vem com uma voz, uma pergunta socrática e uma ação de dois minutos. A sabedoria
        deixa de ser citação e vira ferramenta.
      </p>

      <div className="glass mt-5 divide-y divide-border/60 overflow-hidden">
        {NOTAS.map((nota) => {
          const ativa = aberta === nota.id;
          return (
            <div key={nota.id}>
              <button
                onClick={() => setAberta(ativa ? null : nota.id)}
                aria-expanded={ativa}
                className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors duration-[var(--duration-fast)] hover:bg-secondary/30"
              >
                <span
                  className={`size-2 shrink-0 rounded-full ${
                    nota.controle === "interno"
                      ? "bg-primary/70"
                      : "border border-accent/70 bg-arcane-soft"
                  }`}
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-lead leading-tight">
                    {nota.nome}
                  </span>
                  <span className="mt-0.5 block text-micro text-muted-foreground">
                    {nota.controle === "interno" ? "ao seu alcance" : "fora do seu alcance"} · fase{" "}
                    {nota.fase}
                  </span>
                </span>
                <span className="text-micro text-muted-foreground">{ativa ? "−" : "+"}</span>
              </button>
              {ativa && (
                <div className="px-5 pb-5">
                  <BlocoNota nota={nota} />
                  <button
                    onClick={() => onUsar(nota)}
                    className="mt-3 rounded-xl border border-primary/50 px-5 py-2.5 text-small text-primary transition-colors duration-[var(--duration-fast)] hover:bg-ember-soft"
                  >
                    Mapear este padrão
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Chain({ items }: { items: [string, string | null][] }) {
  return (
    <ol className="space-y-3">
      {items.map(([label, value], i) => (
        <li key={label}>
          <div className="label-arcane text-[0.55rem]">{label}</div>
          <div className="mt-0.5 text-small">{value || "—"}</div>
          {i < items.length - 1 && <div className="mt-2 text-micro text-muted-foreground">↓</div>}
        </li>
      ))}
    </ol>
  );
}
