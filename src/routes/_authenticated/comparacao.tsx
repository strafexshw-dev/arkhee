import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { AppShell, PageTitle } from "@/components/AppShell";
import { MapaGrafo } from "@/components/MapaGrafo";
import { db as supabase } from "@/lib/db";
import { levelFromXp } from "@/lib/arcano";
import { marcoDaComparacao, type EventoXp } from "@/lib/fases";
import {
  arquetiposLivres,
  estadoDoMapa,
  STAGES,
  type EvidenciaDiario,
  type PadraoMapa,
} from "@/lib/mapa";

export const Route = createFileRoute("/_authenticated/comparacao")({
  head: () => ({
    meta: [
      { title: "Comparação — Reflexo Arcano" },
      {
        name: "description",
        content:
          "O mapa de quando a fase começou contra o mapa de hoje. Abre só depois da primeira travessia.",
      },
      { property: "og:title", content: "Comparação de mapas — Reflexo Arcano" },
    ],
  }),
  component: Comparacao,
});

function dataCurta(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function Comparacao() {
  const [xp, setXp] = useState(0);
  const [inicio, setInicio] = useState<string | null>(null);
  const [eventos, setEventos] = useState<EventoXp[]>([]);
  const [padroes, setPadroes] = useState<PadraoMapa[]>([]);
  const [diario, setDiario] = useState<EvidenciaDiario[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const id = auth.user!.id;
      const [{ data: p }, { data: xpEv }, { data: tp }, { data: j }] = await Promise.all([
        supabase.from("profiles").select("xp,created_at").eq("id", id).maybeSingle(),
        supabase.from("xp_events").select("amount,created_at").eq("user_id", id),
        supabase
          .from("thought_patterns")
          .select(
            "id,name,created_at,trigger_text,thought,emotion,old_response,old_result,new_thought,new_action,new_evidence",
          )
          .eq("user_id", id)
          .order("created_at"),
        supabase.from("journal_entries").select("prompt,created_at").eq("user_id", id),
      ]);
      setXp(p?.xp ?? 0);
      setInicio((xpEv ?? []).find((e) => e.created_at)?.created_at ?? p?.created_at ?? null);
      setEventos((xpEv ?? []) as EventoXp[]);
      setPadroes((tp ?? []) as PadraoMapa[]);
      setDiario((j ?? []) as EvidenciaDiario[]);
      setCarregando(false);
    })();
  }, []);

  const marcoInfo = useMemo(() => marcoDaComparacao(eventos, inicio), [eventos, inicio]);
  const hoje = useMemo(() => estadoDoMapa(padroes, diario), [padroes, diario]);
  const antes = useMemo(
    () => (marcoInfo.marco ? estadoDoMapa(padroes, diario, new Date(marcoInfo.marco)) : []),
    [padroes, diario, marcoInfo.marco],
  );

  const { level, progress } = levelFromXp(xp);
  const padroesAntes = useMemo(
    () =>
      marcoInfo.marco
        ? padroes.filter((p) => !p.created_at || p.created_at <= marcoInfo.marco!)
        : [],
    [padroes, marcoInfo.marco],
  );

  if (carregando) {
    return (
      <AppShell>
        <div className="pulse-slow py-24 text-center text-small text-muted-foreground">
          Abrindo os dois mapas...
        </div>
      </AppShell>
    );
  }

  /* ── trancado: a comparação é recompensa de travessia ─────────────────── */
  if (!marcoInfo.passou) {
    return (
      <AppShell>
        <PageTitle
          kicker="Comparação de mapas"
          title="Ainda não há dois mapas"
          quote="Sêneca: garantir um lugar de onde não se possa retroceder. A comparação abre quando uma fase ficar para trás."
        />
        <div className="glass-strong arcane-glow rise-in p-8 text-center">
          <p aria-hidden className="text-title">
            ⧗
          </p>
          <p className="mt-3 font-display text-lead leading-snug">
            Esta tela guarda o seu antes e o seu depois.
          </p>
          <p className="mx-auto mt-3 max-w-md text-small text-muted-foreground">
            Ela abre quando você <span className="text-foreground">passar de fase</span> — quando a
            Fase {level} deixar de ser o seu presente e virar passado consolidado. Até lá, o mapa
            vive só no hoje: é assim que ele mantém o peso do presente.
          </p>
          <div className="mx-auto mt-6 max-w-xs">
            <div className="flex items-center justify-between text-micro text-muted-foreground">
              <span>Fase {level}</span>
              <span>{progress}% do próximo nível</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-500 ease-arcane"
                style={{ width: `${progress}%`, boxShadow: "0 0 8px var(--primary)" }}
              />
            </div>
          </div>
          <Link
            to="/hoje"
            className="ember-glow mt-6 inline-block rounded-xl bg-primary px-6 py-2.5 text-small font-medium text-primary-foreground transition-transform duration-[var(--duration-fast)] ease-arcane hover:scale-[1.02]"
          >
            Continuar no hoje
          </Link>
        </div>
      </AppShell>
    );
  }

  /* ── aberto: dois mapas, uma travessia ────────────────────────────────── */
  const revelados = hoje.length - antes.length;
  const integradosAntes = antes.filter((n) => n.stage === "integrated").length;
  const integradosHoje = hoje.filter((n) => n.stage === "integrated").length;
  const rotaAntes = antes.filter((n) => n.emRota).length;
  const rotaHoje = hoje.filter((n) => n.emRota).length;

  return (
    <AppShell>
      <PageTitle
        kicker="Comparação de mapas"
        title="Quem você trouxe, e quem você é"
        quote="O mapa da esquerda é o que você carregava quando a fase começou. O da direita é o que sobrou depois de você ter agido."
      />

      <div className="mb-5 flex flex-wrap gap-2">
        <span className="chip-muted">
          {marcoInfo.marcos.length}{" "}
          {marcoInfo.marcos.length === 1 ? "fase atravessada" : "fases atravessadas"}
        </span>
        <span className="chip-arcane">
          antes: {marcoInfo.marco ? dataCurta(marcoInfo.marco) : "—"} → hoje
        </span>
        {revelados > 0 && <span className="chip-arcane">+{revelados} nós revelados</span>}
        {integradosHoje - integradosAntes > 0 && (
          <span className="chip-arcane">+{integradosHoje - integradosAntes} integrados</span>
        )}
        {rotaHoje - rotaAntes > 0 && (
          <span className="chip-arcane">+{rotaHoje - rotaAntes} rotas</span>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="glass rise-in p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="label-arcane">Quando a fase começou</span>
            <span className="text-micro text-muted-foreground">
              {marcoInfo.marco ? dataCurta(marcoInfo.marco) : ""}
            </span>
          </div>
          <MapaGrafo
            padroes={antes.map((n) => ({
              id: n.id,
              label: n.label,
              stage: n.stage,
              controle: n.controle,
              evidencias: n.evidencias,
              emRota: n.emRota,
              forca: n.forca,
            }))}
            pedras={arquetiposLivres(padroesAntes).map((nota) => ({
              id: nota.id,
              label: nota.nome,
              controle: nota.controle,
            }))}
            className="mx-auto opacity-80 saturate-[0.7]"
          />
          <p className="mt-2 text-center text-micro text-muted-foreground">
            {antes.length} {antes.length === 1 ? "nó revelado" : "nós revelados"} ·{" "}
            {integradosAntes} {integradosAntes === 1 ? "integrado" : "integrados"}
          </p>
        </section>

        <section
          className="glass-strong arcane-glow rise-in p-4"
          style={{ animationDelay: "80ms" }}
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="label-arcane text-primary">Hoje</span>
            <span className="text-micro text-muted-foreground">
              {dataCurta(new Date().toISOString())}
            </span>
          </div>
          <MapaGrafo
            padroes={hoje.map((n) => ({
              id: n.id,
              label: n.label,
              stage: n.stage,
              controle: n.controle,
              evidencias: n.evidencias,
              emRota: n.emRota,
              forca: n.forca,
            }))}
            pedras={arquetiposLivres(padroes).map((nota) => ({
              id: nota.id,
              label: nota.nome,
              controle: nota.controle,
            }))}
            className="mx-auto"
          />
          <p className="mt-2 text-center text-micro text-muted-foreground">
            {hoje.length} {hoje.length === 1 ? "nó revelado" : "nós revelados"} · {integradosHoje}{" "}
            {integradosHoje === 1 ? "integrado" : "integrados"}
          </p>
        </section>
      </div>

      <p className="mt-6 text-center text-micro text-muted-foreground italic">
        {STAGES.integrated.nome} não é prêmio: é o lugar de onde Sêneca diz que não se retrocede.
      </p>
    </AppShell>
  );
}
