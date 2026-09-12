import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { db as supabase } from "@/lib/db";
import { AppShell, PageTitle } from "@/components/AppShell";
import { PHASES, XP_PER_LEVEL, levelFromXp } from "@/lib/arcano";
import {
  AVISO_ALEXANDRE,
  CONSOLIDACAO,
  FILOSOFIA_XP,
  VOZES_FASE,
  XP_RESUMO,
} from "@/lib/sabedoria";

export const Route = createFileRoute("/_authenticated/jornada")({
  head: () => ({
    meta: [
      { title: "Jornada — Reflexo Arcano" },
      {
        name: "description",
        content:
          "As cinco fases da transformação e a filosofia de progresso de Sêneca: garantir um lugar de onde não se possa retroceder.",
      },
      { property: "og:title", content: "Jornada — Reflexo Arcano" },
      { property: "og:description", content: "As cinco fases da sua transformação psicológica." },
    ],
  }),
  component: Jornada,
});

type Estado = "concluida" | "consolidando" | "em-curso" | "trancada";

const ROTULO_ESTADO: Record<Estado, string> = {
  concluida: "consolidada ✦",
  consolidando: "em consolidação",
  "em-curso": "em curso",
  trancada: "ainda não",
};

function Jornada() {
  const [xp, setXp] = useState(0);
  const [stats, setStats] = useState({ missions: 0, votes: 0, checkins: 0 });
  const [porFase, setPorFase] = useState<Record<number, number>>({});

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const id = auth.user!.id;
      const [{ data: p }, m, v, c, { data: missoes }, { data: concluidas }] = await Promise.all([
        supabase.from("profiles").select("xp").eq("id", id).maybeSingle(),
        supabase
          .from("mission_completions")
          .select("id", { count: "exact", head: true })
          .eq("user_id", id),
        supabase.from("habit_logs").select("id", { count: "exact", head: true }).eq("user_id", id),
        supabase
          .from("mental_checkins")
          .select("id", { count: "exact", head: true })
          .eq("user_id", id),
        supabase.from("missions").select("id, phase"),
        supabase.from("mission_completions").select("mission_id").eq("user_id", id),
      ]);

      setXp(p?.xp ?? 0);
      setStats({ missions: m.count ?? 0, votes: v.count ?? 0, checkins: c.count ?? 0 });

      const faseDaMissao = new Map<string, number>();
      for (const missao of missoes ?? []) faseDaMissao.set(missao.id, missao.phase);

      const contagem: Record<number, number> = {};
      for (const registro of concluidas ?? []) {
        const fase = faseDaMissao.get(registro.mission_id);
        if (fase === undefined) continue;
        contagem[fase] = (contagem[fase] ?? 0) + 1;
      }
      setPorFase(contagem);
    })();
  }, []);

  const { level, progress } = levelFromXp(xp);

  return (
    <AppShell>
      <PageTitle
        kicker="Jornada"
        title="Cada fase é uma transformação"
        quote="Não são níveis. São estados de consciência que você atravessa."
      />

      {/* a filosofia oficial do XP */}
      <section className="glass-strong arcane-glow rise-in p-6">
        <div className="label-arcane text-primary">A regra desta jornada</div>
        <p className="mt-3 font-display text-lead leading-snug">{XP_RESUMO}</p>
        <blockquote className="quote-arcane mt-4 border-l border-primary/30 pl-4 text-body">
          “{FILOSOFIA_XP.quote}”
          <footer className="mt-2 font-sans text-micro not-italic text-muted-foreground">
            {FILOSOFIA_XP.author} · {FILOSOFIA_XP.source}
          </footer>
        </blockquote>
      </section>

      <div
        className="glass rise-in mt-4 grid grid-cols-3 divide-x divide-border/60 p-5 text-center"
        style={{ animationDelay: "60ms" }}
      >
        <Stat label="Missões" value={stats.missions} />
        <Stat label="Votos" value={stats.votes} />
        <Stat label="Check-ins" value={stats.checkins} />
      </div>

      <div className="mt-6 space-y-4">
        {PHASES.map((phase, i) => {
          const phaseLevel = i + 1;
          const evidencias = porFase[phaseLevel] ?? 0;
          const consolidada = evidencias >= 1;
          const estado: Estado =
            level > phaseLevel
              ? consolidada
                ? "concluida"
                : "consolidando"
              : level === phaseLevel
                ? "em-curso"
                : "trancada";
          const voz = VOZES_FASE[phaseLevel]!;

          return (
            <div
              key={phase.name}
              className={`glass rise-in p-6 ${estado === "em-curso" ? "arcane-glow border-primary/40" : ""} ${
                estado === "trancada" ? "opacity-50" : ""
              }`}
              style={{ animationDelay: `${120 + i * 60}ms` }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="label-arcane">{phase.n}</div>
                  <h2 className="mt-2 font-display text-subtitle leading-tight">{phase.name}</h2>
                </div>
                <span
                  className={`chip-arcane shrink-0 ${
                    estado === "trancada" || estado === "consolidando" ? "chip-muted" : ""
                  }`}
                >
                  {estado === "trancada"
                    ? `${phaseLevel * XP_PER_LEVEL} XP`
                    : ROTULO_ESTADO[estado]}
                </span>
              </div>

              <p className="quote-arcane mt-3">{phase.quote}</p>

              <blockquote className="mt-4 border-l border-border pl-4 text-small text-muted-foreground">
                “{voz.quote}”
                <footer className="mt-1.5 text-micro">
                  {voz.author} · {voz.source}
                </footer>
              </blockquote>

              <p className="mt-4 text-small text-muted-foreground">Objetivo: {phase.goal}</p>

              {estado === "em-curso" && (
                <>
                  <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-[700ms] ease-arcane"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-micro text-muted-foreground">
                    <span>{progress}% do nível</span>
                    <span>
                      {evidencias} {evidencias === 1 ? "evidência" : "evidências"} de consolidação
                    </span>
                  </div>
                </>
              )}

              {estado === "consolidando" && (
                <div className="mt-4 rounded-xl border border-primary/25 bg-ember-soft/40 px-4 py-3">
                  <div className="label-arcane text-primary">Ainda não é terreno firme</div>
                  <p className="mt-1.5 text-small text-muted-foreground">
                    Você passou por esta fase, mas não registrou nenhuma missão dela. Sem evidência,
                    o progresso volta para o ponto em que começou.
                  </p>
                  <p className="mt-2 text-micro text-muted-foreground">
                    “{CONSOLIDACAO.quote}” — {CONSOLIDACAO.author}, {CONSOLIDACAO.source}
                  </p>
                </div>
              )}

              {estado === "concluida" && (
                <div className="mt-4 text-micro text-muted-foreground">
                  {evidencias} {evidencias === 1 ? "evidência" : "evidências"} de que este chão já
                  não cede.
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* o aviso — Alexandre como contraponto, não como ideal */}
      <section className="rise-in mt-8 rounded-3xl border border-destructive/25 bg-card p-6">
        <div className="label-arcane text-destructive">{AVISO_ALEXANDRE.titulo}</div>
        <p className="mt-3 text-body text-muted-foreground">{AVISO_ALEXANDRE.texto}</p>
        <p className="mt-4 font-display text-subtitle text-foreground">{AVISO_ALEXANDRE.licao}</p>
        <p className="mt-3 text-small text-muted-foreground">{AVISO_ALEXANDRE.complemento}</p>
      </section>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="font-display text-subtitle text-primary">{value}</div>
      <div className="label-arcane mt-1">{label}</div>
    </div>
  );
}
