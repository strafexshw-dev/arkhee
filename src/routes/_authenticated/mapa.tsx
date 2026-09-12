import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { AppShell, PageTitle } from "@/components/AppShell";
import { LegendaMapa, MapaGrafo, type SelecaoMapa } from "@/components/MapaGrafo";
import { PainelMapa } from "@/components/PainelMapa";
import { SimuladorRota } from "@/components/SimuladorRota";
import { grantXp } from "@/lib/arcano";
import { db as supabase } from "@/lib/db";
import {
  arquetiposLivres,
  estadoDoMapa,
  STAGES,
  type EvidenciaDiario,
  type PadraoMapa,
  type Stage,
} from "@/lib/mapa";
import { promptEvidencia, type RotaDraft } from "@/lib/rota";
import { NOTAS, type Nota } from "@/lib/sabedoria";

export const Route = createFileRoute("/_authenticated/mapa")({
  head: () => ({
    meta: [
      { title: "Mapa Mental — Reflexo Arcano" },
      {
        name: "description",
        content:
          "Um mapa neural dos seus padrões: cada nó ganha cor conforme você o reconhece, rompe a reação automática e registra evidência de que agiu diferente.",
      },
      { property: "og:title", content: "Mapa Mental — Reflexo Arcano" },
      {
        property: "og:description",
        content: "Cinco estágios de consciência, não de sucesso.",
      },
    ],
  }),
  component: Mapa,
});

const BOTAO =
  "ember-glow rounded-xl bg-primary px-5 py-2.5 text-small font-medium text-primary-foreground transition-transform duration-[var(--duration-fast)] ease-arcane hover:scale-[1.02]";
const BOTAO_FANTASMA =
  "rounded-xl border border-border px-4 py-2 text-small text-muted-foreground transition-colors duration-[var(--duration-fast)] hover:border-primary/40 hover:text-foreground";
const BOTAO_MINI =
  "rounded-lg px-2.5 py-1 text-micro text-muted-foreground transition-colors duration-[var(--duration-fast)] hover:text-foreground";
const CARTAO = "rounded-xl border border-border bg-surface/40 p-4";

type AberturaSimulador = { initial: Partial<RotaDraft>; passo: number } | null;

function diasAtras(dias: number) {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return d;
}

function camposDe(p: PadraoMapa): Partial<RotaDraft> {
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

/** Abre e fecha sem cortar conteúdo: grid-template-rows 0fr → 1fr. */
function Colapsavel({ aberto, children }: { aberto: boolean; children: React.ReactNode }) {
  return (
    <div
      className="grid transition-[grid-template-rows] duration-300 ease-arcane"
      style={{ gridTemplateRows: aberto ? "1fr" : "0fr" }}
    >
      <div className="overflow-hidden">{children}</div>
    </div>
  );
}

function Mapa() {
  const [userId, setUserId] = useState<string | null>(null);
  const [padroes, setPadroes] = useState<PadraoMapa[]>([]);
  const [diario, setDiario] = useState<EvidenciaDiario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [selecao, setSelecao] = useState<SelecaoMapa>(null);
  const [pulso, setPulso] = useState<{ id: string; n: number } | null>(null);
  const [recuo, setRecuo] = useState(0);
  const [simulador, setSimulador] = useState<AberturaSimulador>(null);
  const [notaAberta, setNotaAberta] = useState<string | null>(null);
  const [fontes, setFontes] = useState({
    gatilhos: 0,
    crencas: 0,
    checkins: 0,
    habitos: 0,
    identidades: 0,
  });

  const load = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    const id = auth.user!.id;
    setUserId(id);

    const contar = (tabela: "beliefs" | "mental_checkins" | "habits" | "identity_traits") =>
      supabase.from(tabela).select("id", { count: "exact", head: true }).eq("user_id", id);

    const [{ data: tp }, { data: journal }, crencas, checkins, habitos, identidades] =
      await Promise.all([
        supabase
          .from("thought_patterns")
          .select(
            "id,name,created_at,trigger_text,thought,emotion,old_response,old_result,new_thought,new_action,new_evidence",
          )
          .eq("user_id", id)
          .order("created_at"),
        supabase.from("journal_entries").select("prompt,created_at").eq("user_id", id),
        contar("beliefs"),
        contar("mental_checkins"),
        contar("habits"),
        contar("identity_traits"),
      ]);

    setPadroes((tp ?? []) as PadraoMapa[]);
    setDiario((journal ?? []) as EvidenciaDiario[]);
    setFontes({
      gatilhos: (tp ?? []).length,
      crencas: crencas.count ?? 0,
      checkins: checkins.count ?? 0,
      habitos: habitos.count ?? 0,
      identidades: identidades.count ?? 0,
    });
    setCarregando(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const hoje = useMemo(() => estadoDoMapa(padroes, diario), [padroes, diario]);
  const noTempo = useMemo(
    () => (recuo > 0 ? estadoDoMapa(padroes, diario, diasAtras(recuo)) : hoje),
    [padroes, diario, recuo, hoje],
  );
  const pedras = useMemo(
    () =>
      arquetiposLivres(padroes).map((nota) => ({
        id: nota.id,
        label: nota.nome,
        controle: nota.controle,
      })),
    [padroes],
  );

  const padraoSelecionado =
    selecao?.tipo === "padrao" ? (padroes.find((p) => p.id === selecao.id) ?? null) : null;

  const integrados = hoje.filter((n) => n.stage === "integrated").length;
  const emRota = hoje.filter((n) => n.emRota).length;
  const reveladosDesde = hoje.length - noTempo.length;

  const evidenciasDe = (nome: string) => {
    const chave = promptEvidencia(nome);
    const noDiario = diario.filter((e) => e.prompt === chave).length;
    const naRota = padroes.find((p) => p.name === nome)?.new_evidence ? 1 : 0;
    return noDiario + naRota;
  };

  const pulsar = (id: string) => setPulso((p) => ({ id, n: (p?.n ?? 0) + 1 }));

  async function removerPadrao(p: PadraoMapa) {
    const { error } = await supabase.from("thought_patterns").delete().eq("id", p.id);
    if (error) {
      toast.error("Não foi possível remover este padrão.");
      return;
    }
    setSelecao(null);
    toast.success("Nó removido do mapa.");
    await load();
  }

  async function evidenciar(p: PadraoMapa) {
    if (!userId) return;
    const texto = "Agir diferente no momento em que o padrão apareceu.";
    const { error } = await supabase.from("journal_entries").insert({
      user_id: userId,
      prompt: promptEvidencia(p.name),
      content: texto,
    });
    if (error) {
      toast.error("Não foi possível registrar a evidência.");
      return;
    }
    if (!p.new_evidence) {
      await supabase.from("thought_patterns").update({ new_evidence: texto }).eq("id", p.id);
    }
    await grantXp(userId, 20, "evidência registrada");
    await load();
    pulsar(p.id);
    toast.success("Evidência registrada. Este nó agora brilha diferente.");
  }

  function abrirNota(nota: Nota) {
    setSimulador({ initial: { name: nota.nome, new_thought: nota.pergunta }, passo: 0 });
    setSelecao(null);
  }

  return (
    <AppShell>
      <PageTitle
        kicker="Mapa mental"
        title="Cada nó começa pedra bruta"
        quote="A cor não mede sucesso — mede o quanto você já viu. O mapa é a escultura aparecendo conforme você cinzela."
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        {/* ── grafo ─────────────────────────────────────────────────── */}
        <section
          className="glass-strong arcane-glow rise-in p-4 sm:p-6"
          style={{ animationDelay: "60ms" }}
        >
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <LegendaMapa />
            <p className="text-micro text-muted-foreground">
              Toque em um nó para abrir o painel dele
            </p>
          </div>

          <MapaGrafo
            padroes={noTempo.map((n) => ({
              id: n.id,
              label: n.label,
              stage: n.stage,
              controle: n.controle,
              evidencias: n.evidencias,
              emRota: n.emRota,
            }))}
            pedras={pedras}
            selecao={selecao}
            onSelect={setSelecao}
            pulso={pulso}
            className="mx-auto"
          />

          {/* antes e depois — o mapa de há 30 dias contra o de hoje */}
          <div className="mt-6 border-t border-border/60 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="label-arcane">Antes e depois</span>
              <span
                className="text-micro"
                style={{ color: recuo ? STAGES.noticed.cor : "var(--muted-foreground)" }}
              >
                {recuo ? `vendo o mapa de há ${recuo} dias` : "vendo o mapa de hoje"}
              </span>
            </div>

            <input
              type="range"
              min={0}
              max={30}
              step={1}
              value={recuo}
              onChange={(e) => setRecuo(Number(e.target.value))}
              aria-label="Voltar no tempo: ver o mapa de até 30 dias atrás"
              className="mt-3 w-full accent-[var(--primary)]"
            />
            <div className="mt-1 flex justify-between text-micro text-muted-foreground">
              <span>há 30 dias</span>
              <span>hoje</span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="chip-muted">
                {noTempo.length} {noTempo.length === 1 ? "nó revelado" : "nós revelados"}
              </span>
              {reveladosDesde > 0 && (
                <span className="chip-arcane">+{reveladosDesde} desde então</span>
              )}
              {recuo > 0 && (
                <button type="button" className={BOTAO_MINI} onClick={() => setRecuo(0)}>
                  voltar para hoje
                </button>
              )}
            </div>
            <p className="mt-2 text-micro text-muted-foreground italic">
              A reconstrução usa a data em que cada padrão foi criado e a data de cada evidência no
              diário.
            </p>
          </div>
        </section>

        <div className="space-y-6">
          {/* ── leitura do momento ────────────────────────────────────── */}
          <section className="glass-strong rise-in p-5" style={{ animationDelay: "120ms" }}>
            <span className="label-arcane">O que o mapa diz agora</span>
            <div className="mt-3 grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="font-display text-subtitle text-primary">{hoje.length}</p>
                <p className="text-micro text-muted-foreground">padrões vistos</p>
              </div>
              <div>
                <p
                  className="font-display text-subtitle"
                  style={{ color: STAGES.reprogrammed.cor }}
                >
                  {emRota}
                </p>
                <p className="text-micro text-muted-foreground">com rota nova</p>
              </div>
              <div>
                <p className="font-display text-subtitle" style={{ color: STAGES.integrated.cor }}>
                  {integrados}
                </p>
                <p className="text-micro text-muted-foreground">integrados</p>
              </div>
            </div>

            <div className="mt-4 space-y-1.5">
              {(Object.keys(STAGES) as Stage[]).map((s) => {
                const info = STAGES[s];
                const n = hoje.filter((no) => no.stage === s).length;
                return (
                  <div key={s} className="flex items-center gap-2 text-micro">
                    <span
                      className={`inline-block size-2 rounded-full ${s === "unmapped" ? "pedra" : ""}`}
                      style={{
                        backgroundColor: s === "unmapped" ? undefined : info.cor,
                        boxShadow: s === "unmapped" ? undefined : `0 0 8px ${info.cor}`,
                      }}
                    />
                    <span className="text-muted-foreground">{info.nome}</span>
                    <span className="ml-auto" style={{ color: n ? info.cor : undefined }}>
                      {n}
                    </span>
                  </div>
                );
              })}
            </div>

            <p className="mt-4 border-t border-border/50 pt-3 text-micro text-muted-foreground">
              Alimentado por {fontes.gatilhos} gatilhos, {fontes.crencas} crenças, {fontes.checkins}{" "}
              check-ins, {fontes.habitos} hábitos e {fontes.identidades} traços de identidade.
            </p>

            <button
              type="button"
              className={`${BOTAO} mt-4 w-full`}
              onClick={() => setSimulador({ initial: {}, passo: 0 })}
            >
              Traçar uma rota nova
            </button>
          </section>

          {/* ── seus padrões ──────────────────────────────────────────── */}
          <section className="glass-strong rise-in p-5" style={{ animationDelay: "180ms" }}>
            <div className="flex items-center justify-between gap-2">
              <span className="label-arcane">Seus padrões</span>
              <span className="chip-muted">{hoje.length}</span>
            </div>

            {carregando ? (
              <p className="mt-4 text-micro text-muted-foreground">Lendo o seu mapa...</p>
            ) : padroes.length === 0 ? (
              <div className="mt-4">
                <p className="text-small text-muted-foreground">
                  Nenhum padrão mapeado ainda: o mapa inteiro está em pedra bruta. É assim que
                  começa — Michelangelo também encarava um bloco antes da estátua.
                </p>
                <button
                  type="button"
                  className={`${BOTAO_FANTASMA} mt-3 w-full`}
                  onClick={() => setSimulador({ initial: {}, passo: 0 })}
                >
                  Nomear o primeiro padrão
                </button>
              </div>
            ) : (
              <ul className="mt-3 space-y-2">
                {padroes.map((p) => {
                  const no = hoje.find((n) => n.id === p.id);
                  const info = STAGES[no?.stage ?? "noticed"];
                  const n = evidenciasDe(p.name);
                  const dentro = no?.controle !== "externo";
                  return (
                    <li key={p.id} className={CARTAO}>
                      <button
                        type="button"
                        className="flex w-full items-start gap-3 text-left"
                        onClick={() =>
                          setSelecao({
                            tipo: "padrao",
                            id: p.id,
                            label: p.name,
                            stage: no?.stage ?? "noticed",
                            evidencias: n,
                          })
                        }
                      >
                        <span
                          className="mt-1 inline-block size-2.5 shrink-0 rounded-full"
                          style={{
                            backgroundColor: info.cor,
                            boxShadow: `0 0 ${4 + info.glow * 14}px ${info.cor}`,
                          }}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-small font-medium">{p.name}</span>
                          <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            <span className="chip-muted" style={{ color: info.cor }}>
                              {info.nome}
                            </span>
                            <span
                              className="chip-muted"
                              title={
                                dentro
                                  ? "Dentro do seu controle: aqui dá para agir"
                                  : "Fora do seu controle: aqui só cabe escolher a resposta"
                              }
                              style={{ color: dentro ? "var(--primary)" : undefined }}
                            >
                              {dentro ? "ao seu alcance" : "fora do seu alcance"}
                            </span>
                            <span
                              className="chip-muted"
                              title="Quantas vezes você registrou ter agido diferente"
                              style={{ color: n ? "var(--stage-integrated)" : undefined }}
                            >
                              {n === 0
                                ? "sem evidência"
                                : n === 1
                                  ? "1 evidência"
                                  : `${n} evidências`}
                            </span>
                          </span>
                        </span>
                      </button>

                      <div className="mt-2 flex flex-wrap justify-end gap-1 border-t border-border/40 pt-2">
                        <button
                          type="button"
                          className={BOTAO_MINI}
                          onClick={() => evidenciar(p)}
                          title="Registrar que você agiu diferente"
                        >
                          + evidência
                        </button>
                        <button
                          type="button"
                          className={BOTAO_MINI}
                          onClick={() => setSimulador({ initial: camposDe(p), passo: 0 })}
                        >
                          editar rota
                        </button>
                        <RemoverNo onConfirmar={() => removerPadrao(p)} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* ── biblioteca ────────────────────────────────────────────── */}
          <section className="glass-strong rise-in p-5" style={{ animationDelay: "240ms" }}>
            <span className="label-arcane">Biblioteca do mapa</span>
            <p className="mt-1 text-micro text-muted-foreground">
              {NOTAS.length} arquétipos apoiados em filosofia e psicologia. O que você ainda não
              reconheceu em si aparece como pedra bruta no grafo.
            </p>

            <div className="mt-4 space-y-2">
              {NOTAS.map((nota) => {
                const ligados = padroes.filter((p) => p.name.startsWith(nota.nome));
                const evidencias = ligados.reduce((soma, p) => soma + evidenciasDe(p.name), 0);
                const aberto = notaAberta === nota.id;
                const dentro = nota.controle === "interno";
                return (
                  <div
                    key={nota.id}
                    className="overflow-hidden rounded-xl border border-border bg-surface/30"
                  >
                    <button
                      type="button"
                      aria-expanded={aberto}
                      onClick={() => setNotaAberta(aberto ? null : nota.id)}
                      className="flex w-full items-center gap-3 p-3 text-left transition-colors duration-[var(--duration-fast)] hover:bg-surface/60"
                    >
                      <span
                        className="inline-block size-2 shrink-0 rounded-full"
                        style={{
                          backgroundColor: ligados.length
                            ? STAGES.integrated.cor
                            : STAGES.unmapped.cor,
                          boxShadow: ligados.length
                            ? `0 0 10px ${STAGES.integrated.cor}`
                            : undefined,
                        }}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-small font-medium">{nota.nome}</span>
                        <span className="mt-1 flex flex-wrap items-center gap-1.5">
                          <span
                            className="chip-muted"
                            style={{ color: dentro ? "var(--primary)" : undefined }}
                          >
                            {dentro ? "ao seu alcance" : "fora do seu alcance"}
                          </span>
                          <span className="text-micro text-muted-foreground">
                            {ligados.length
                              ? `${ligados.length} ${ligados.length === 1 ? "padrão seu" : "padrões seus"}`
                              : "não mapeado"}
                            {evidencias
                              ? ` · ${evidencias} ${evidencias === 1 ? "evidência" : "evidências"}`
                              : ""}
                          </span>
                        </span>
                      </span>
                      <span aria-hidden className="text-muted-foreground">
                        {aberto ? "−" : "+"}
                      </span>
                    </button>

                    <Colapsavel aberto={aberto}>
                      <div className="space-y-3 border-t border-border/50 p-3">
                        <blockquote className="quote-arcane text-small">
                          “{nota.voz.quote}”
                          <footer className="mt-1.5 font-sans text-micro not-italic text-muted-foreground">
                            {nota.voz.author} · {nota.voz.source}
                          </footer>
                        </blockquote>
                        <div>
                          <span className="label-arcane">Pergunta</span>
                          <p className="mt-1 text-small">{nota.pergunta}</p>
                        </div>
                        <div>
                          <span className="label-arcane">Micro-desafio</span>
                          <p className="mt-1 text-small">{nota.desafio}</p>
                        </div>
                        <span className="chip-muted">Fase {nota.fase}</span>
                        {ligados.length === 0 && (
                          <button
                            type="button"
                            className={`${BOTAO_FANTASMA} w-full`}
                            onClick={() => abrirNota(nota)}
                          >
                            Mapear este padrão
                          </button>
                        )}
                      </div>
                    </Colapsavel>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── a geometria ───────────────────────────────────────────── */}
          <section className="glass-strong rise-in p-5" style={{ animationDelay: "300ms" }}>
            <span className="label-arcane">A geometria</span>
            <p className="mt-2 text-small text-muted-foreground">
              O anel interno é o que depende de você: julgamento, impulso, atenção, ação, esforço,
              resposta. O externo é o que nunca foi seu: opinião, resultado, passado, reputação, os
              outros, o tempo. A linha tracejada até <span className="text-foreground">Ação</span> é
              o único caminho que você constrói de fato.
            </p>
            <Link to="/jornada" className={`${BOTAO_FANTASMA} mt-4 block w-full text-center`}>
              Ver em que fase estou
            </Link>
          </section>
        </div>
      </div>

      <PainelMapa
        aberto={!!selecao}
        selecao={selecao}
        padrao={padraoSelecionado}
        onFechar={() => setSelecao(null)}
        onRegistrarEvidencia={(p) => {
          setSelecao(null);
          setSimulador({ initial: camposDe(p), passo: 3 });
        }}
        onEvidenciaRapida={(p) => {
          setSelecao(null);
          evidenciar(p);
        }}
        onContinuarRota={(p) => {
          setSelecao(null);
          setSimulador({ initial: camposDe(p), passo: 0 });
        }}
        onMapearArquetipo={abrirNota}
        onRemover={removerPadrao}
      />

      {simulador && userId && (
        <SimuladorRota
          userId={userId}
          initial={simulador.initial}
          passoInicial={simulador.passo}
          onClose={() => setSimulador(null)}
          onSaved={async () => {
            const id = simulador.initial.id ?? undefined;
            setSimulador(null);
            await load();
            if (id) pulsar(id);
          }}
        />
      )}
    </AppShell>
  );
}

/** Remoção em dois toques: nenhum nó some por um clique distraído. */
function RemoverNo({ onConfirmar }: { onConfirmar: () => void | Promise<void> }) {
  const [confirmando, setConfirmando] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!confirmando) return;
    const t = setTimeout(() => setConfirmando(false), 4000);
    return () => clearTimeout(t);
  }, [confirmando]);

  if (!confirmando) {
    return (
      <button type="button" className={BOTAO_MINI} onClick={() => setConfirmando(true)}>
        remover
      </button>
    );
  }

  return (
    <span className="flex items-center gap-1">
      <button
        type="button"
        disabled={busy}
        className="rounded-lg px-2.5 py-1 text-micro text-destructive transition-colors duration-[var(--duration-fast)] hover:text-destructive/80 disabled:opacity-50"
        onClick={async () => {
          setBusy(true);
          await onConfirmar();
          setBusy(false);
          setConfirmando(false);
        }}
      >
        confirmar
      </button>
      <button type="button" className={BOTAO_MINI} onClick={() => setConfirmando(false)}>
        não
      </button>
    </span>
  );
}
