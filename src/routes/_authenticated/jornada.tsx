import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, PageTitle } from "@/components/AppShell";
import { PHASES, XP_PER_LEVEL, levelFromXp } from "@/lib/arcano";

export const Route = createFileRoute("/_authenticated/jornada")({
  head: () => ({
    meta: [
      { title: "Jornada — Reflexo Arcano" },
      { name: "description", content: "As cinco fases da transformação: observar, romper, reprogramar, identidade e integração." },
      { property: "og:title", content: "Jornada — Reflexo Arcano" },
      { property: "og:description", content: "As cinco fases da sua transformação psicológica." },
    ],
  }),
  component: Jornada,
});

function Jornada() {
  const [xp, setXp] = useState(0);
  const [stats, setStats] = useState({ missions: 0, votes: 0, checkins: 0 });

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const id = auth.user!.id;
      const [{ data: p }, m, v, c] = await Promise.all([
        supabase.from("profiles").select("xp").eq("id", id).maybeSingle(),
        supabase.from("mission_completions").select("id", { count: "exact", head: true }).eq("user_id", id),
        supabase.from("habit_logs").select("id", { count: "exact", head: true }).eq("user_id", id),
        supabase.from("mental_checkins").select("id", { count: "exact", head: true }).eq("user_id", id),
      ]);
      setXp(p?.xp ?? 0);
      setStats({ missions: m.count ?? 0, votes: v.count ?? 0, checkins: c.count ?? 0 });
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

      <div className="glass mb-8 grid grid-cols-3 divide-x divide-border/60 p-5 text-center">
        <Stat label="Missões" value={stats.missions} />
        <Stat label="Votos" value={stats.votes} />
        <Stat label="Check-ins" value={stats.checkins} />
      </div>

      <div className="space-y-4">
        {PHASES.map((phase, i) => {
          const phaseLevel = i + 1;
          const state = level > phaseLevel ? "done" : level === phaseLevel ? "current" : "locked";
          return (
            <div
              key={phase.name}
              className={`glass p-6 ${state === "current" ? "arcane-glow border-primary/40" : ""} ${
                state === "locked" ? "opacity-50" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="label-arcane">{phase.n}</div>
                <div className="text-xs text-muted-foreground">
                  {state === "done" ? "concluída ✦" : state === "current" ? "em curso" : `${phaseLevel * XP_PER_LEVEL} XP`}
                </div>
              </div>
              <h2 className="mt-2 font-display text-2xl">{phase.name}</h2>
              <p className="quote-arcane mt-3">{phase.quote}</p>
              <p className="mt-3 text-sm text-muted-foreground">Objetivo: {phase.goal}</p>
              {state === "current" && (
                <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="font-display text-2xl text-primary">{value}</div>
      <div className="label-arcane mt-1">{label}</div>
    </div>
  );
}
