import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, PageTitle } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/eu-futuro")({
  head: () => ({
    meta: [
      { title: "Eu Futuro — Reflexo Arcano" },
      { name: "description", content: "Sua identidade futura e as evidências acumuladas de que você já está mudando." },
      { property: "og:title", content: "Eu Futuro — Reflexo Arcano" },
      { property: "og:description", content: "Identidade futura e evidências acumuladas." },
    ],
  }),
  component: EuFuturo,
});

type Trait = { id: string; name: string };
type Habit = { id: string; title: string; trait_id: string | null };

function EuFuturo() {
  const [traits, setTraits] = useState<Trait[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<{ habit_id: string }[]>([]);
  const [newTrait, setNewTrait] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    const id = auth.user!.id;
    setUserId(id);
    const [{ data: t }, { data: h }, { data: l }] = await Promise.all([
      supabase.from("identity_traits").select("id, name").eq("user_id", id).order("created_at"),
      supabase.from("habits").select("id, title, trait_id").eq("user_id", id),
      supabase.from("habit_logs").select("habit_id").eq("user_id", id),
    ]);
    setTraits((t ?? []) as Trait[]);
    setHabits((h ?? []) as Habit[]);
    setLogs(l ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function addTrait() {
    if (!userId || !newTrait.trim()) return;
    const { data: identity } = await supabase
      .from("future_identities")
      .select("id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();
    await supabase.from("identity_traits").insert({
      user_id: userId,
      identity_id: identity?.id ?? null,
      name: newTrait.trim(),
    });
    setNewTrait("");
    void load();
  }

  function evidencesFor(traitId: string) {
    const ids = habits.filter((h) => h.trait_id === traitId).map((h) => h.id);
    return logs.filter((l) => ids.includes(l.habit_id)).length;
  }

  return (
    <AppShell>
      <PageTitle kicker="Eu futuro" title="Quem você está se tornando" />

      <div className="space-y-4">
        {traits.map((trait) => {
          const evidences = evidencesFor(trait.id);
          const progress = Math.min(100, evidences * 5);
          const traitHabits = habits.filter((h) => h.trait_id === trait.id);
          return (
            <div key={trait.id} className="glass p-6">
              <div className="label-arcane">Identidade</div>
              <h2 className="mt-1 font-display text-2xl">{trait.name}</h2>
              <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-700"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-2 text-xs text-muted-foreground">{progress}%</div>
              <div className="mt-4 space-y-1 text-sm text-muted-foreground">
                <div className="label-arcane mb-2">Evidências acumuladas</div>
                {traitHabits.length === 0 && <div>Sem comportamentos ligados ainda.</div>}
                {traitHabits.map((h) => (
                  <div key={h.id}>
                    ✦ {h.title} — {logs.filter((l) => l.habit_id === h.id).length}x
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="glass mt-6 flex gap-2 p-4">
        <input
          value={newTrait}
          onChange={(e) => setNewTrait(e.target.value)}
          placeholder="Adicionar característica"
          className="flex-1 rounded-lg border border-input bg-surface/60 px-3 py-2.5 text-sm outline-none focus:border-primary/60"
        />
        <button
          onClick={addTrait}
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
        >
          Adicionar
        </button>
      </div>

      <p className="quote-arcane mt-10 text-center">
        Você não precisa acreditar que mudou. Você precisa acumular evidências até ser difícil
        acreditar que continua igual.
      </p>
    </AppShell>
  );
}
