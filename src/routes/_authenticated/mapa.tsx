import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { db as supabase } from "@/lib/db";
import { AppShell, PageTitle } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/mapa")({
  head: () => ({
    meta: [
      { title: "Mapa Mental — Reflexo Arcano" },
      { name: "description", content: "Um mapa neural dos seus gatilhos, crenças, emoções e novos caminhos." },
      { property: "og:title", content: "Mapa Mental — Reflexo Arcano" },
      { property: "og:description", content: "Veja seus padrões e o novo caminho sendo construído." },
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

function Mapa() {
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [counts, setCounts] = useState({ beliefs: 0, emotions: 0, triggers: 0, habits: 0, traits: 0 });
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const id = auth.user!.id;
      const [{ data: tp }, b, c, h, tr] = await Promise.all([
        supabase.from("thought_patterns").select("*").eq("user_id", id).order("created_at"),
        supabase.from("beliefs").select("id", { count: "exact", head: true }).eq("user_id", id),
        supabase.from("mental_checkins").select("id", { count: "exact", head: true }).eq("user_id", id),
        supabase.from("habits").select("id", { count: "exact", head: true }).eq("user_id", id),
        supabase.from("identity_traits").select("id", { count: "exact", head: true }).eq("user_id", id),
      ]);
      setPatterns((tp ?? []) as Pattern[]);
      setCounts({
        beliefs: b.count ?? 0,
        emotions: c.count ?? 0,
        triggers: (tp ?? []).length,
        habits: h.count ?? 0,
        traits: tr.count ?? 0,
      });
    })();
  }, []);

  const nodes = [
    { label: "Crenças", value: counts.beliefs },
    { label: "Emoções", value: counts.emotions },
    { label: "Gatilhos", value: counts.triggers },
    { label: "Hábitos", value: counts.habits },
    { label: "Identidade", value: counts.traits },
  ];

  const active = patterns.find((p) => p.id === selected) ?? null;

  return (
    <AppShell>
      <PageTitle
        kicker="Mapa mental"
        title="O que orbita você"
        quote="Este mapa não é teoria: ele é feito dos dados que você mesma gerou."
      />

      <div className="relative mx-auto mb-10 aspect-square w-full max-w-sm">
        <div className="orbit-slow absolute inset-6 rounded-full border border-border/60" />
        <div className="absolute inset-16 rounded-full border border-accent/20 pulse-slow" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
          <div className="label-arcane">Você</div>
          <div className="mt-1 font-display text-3xl gradient-text">✦</div>
        </div>
        {nodes.map((n, i) => {
          const angle = (i / nodes.length) * Math.PI * 2 - Math.PI / 2;
          const x = 50 + Math.cos(angle) * 40;
          const y = 50 + Math.sin(angle) * 40;
          return (
            <div
              key={n.label}
              className="absolute -translate-x-1/2 -translate-y-1/2 text-center"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <div className="glass px-3 py-2">
                <div className="text-[0.68rem] tracking-widest text-muted-foreground uppercase">{n.label}</div>
                <div className="font-display text-lg text-primary">{n.value}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="label-arcane mb-3">Padrões mapeados</div>
      {patterns.length === 0 && (
        <div className="glass p-6 text-sm text-muted-foreground">
          Nenhum padrão ainda. Mapeie o primeiro em Reprogramar → Padrões automáticos.
        </div>
      )}
      <div className="space-y-2">
        {patterns.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelected(selected === p.id ? null : p.id)}
            className="glass w-full p-4 text-left font-display text-lg hover:bg-secondary/30"
          >
            {p.name}
          </button>
        ))}
      </div>

      {active && (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="glass p-5">
            <div className="label-arcane mb-3">Caminho antigo</div>
            <Chain
              items={[
                ["Gatilho", active.trigger_text],
                ["Pensamento", active.thought],
                ["Emoção", active.emotion],
                ["Resposta antiga", active.old_response],
                ["Resultado", active.old_result],
              ]}
            />
          </div>
          <div className="glass arcane-glow p-5">
            <div className="label-arcane mb-3 text-primary">Novo caminho</div>
            <Chain
              items={[
                ["Pensamento consciente", active.new_thought],
                ["Nova ação", active.new_action],
                ["Nova evidência", active.new_evidence],
              ]}
            />
          </div>
        </div>
      )}
    </AppShell>
  );
}

function Chain({ items }: { items: [string, string | null][] }) {
  return (
    <ol className="space-y-3">
      {items.map(([label, value], i) => (
        <li key={label}>
          <div className="text-[0.65rem] uppercase tracking-widest text-muted-foreground">{label}</div>
          <div className="text-sm">{value || "—"}</div>
          {i < items.length - 1 && <div className="mt-2 text-xs text-muted-foreground">↓</div>}
        </li>
      ))}
    </ol>
  );
}
