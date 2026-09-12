import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { db as supabase } from "@/lib/db";
import { AppShell, PageTitle } from "@/components/AppShell";
import { VOZES_FASE } from "@/lib/sabedoria";

export const Route = createFileRoute("/_authenticated/eu-futuro")({
  head: () => ({
    meta: [
      { title: "Eu Futuro — Reflexo Arcano" },
      {
        name: "description",
        content:
          "Sua identidade futura não como meta a alcançar, mas como qualidade a incorporar hoje — com as evidências acumuladas.",
      },
      { property: "og:title", content: "Eu Futuro — Reflexo Arcano" },
      { property: "og:description", content: "Identidade futura e evidências acumuladas." },
    ],
  }),
  component: EuFuturo,
});

const SIDDHARTHA = VOZES_FASE[5]!;
const JANELA_DIAS = 7;

type Trait = { id: string; name: string };
type Habit = { id: string; title: string; trait_id: string | null };
type Log = { habit_id: string; created_at: string };

function EuFuturo() {
  const [traits, setTraits] = useState<Trait[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [newTrait, setNewTrait] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    const id = auth.user!.id;
    setUserId(id);
    const [{ data: t }, { data: h }, { data: l }] = await Promise.all([
      supabase.from("identity_traits").select("id, name").eq("user_id", id).order("created_at"),
      supabase.from("habits").select("id, title, trait_id").eq("user_id", id),
      supabase.from("habit_logs").select("habit_id, created_at").eq("user_id", id),
    ]);
    setTraits((t ?? []) as Trait[]);
    setHabits((h ?? []) as Habit[]);
    setLogs((l ?? []) as Log[]);
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

  const desde = new Date(Date.now() - JANELA_DIAS * 86_400_000).toISOString();

  function habitIds(traitId: string) {
    return habits.filter((h) => h.trait_id === traitId).map((h) => h.id);
  }

  function evidencesFor(traitId: string) {
    const ids = habitIds(traitId);
    return logs.filter((l) => ids.includes(l.habit_id)).length;
  }

  /** a qualidade só existe se estiver sendo exercida agora, não no futuro */
  function evidencesRecentes(traitId: string) {
    const ids = habitIds(traitId);
    return logs.filter((l) => ids.includes(l.habit_id) && l.created_at >= desde).length;
  }

  return (
    <AppShell>
      <PageTitle
        kicker="Eu futuro"
        title="Quem você está se tornando"
        quote="Não é um lugar onde você chega. É uma qualidade que você exerce hoje — ou não exerce."
      />

      <div className="space-y-4">
        {traits.map((trait, i) => {
          const evidences = evidencesFor(trait.id);
          const recentes = evidencesRecentes(trait.id);
          const progress = Math.min(100, evidences * 5);
          const traitHabits = habits.filter((h) => h.trait_id === trait.id);
          return (
            <div
              key={trait.id}
              className="glass rise-in p-6"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="label-arcane">Identidade</div>
              <h2 className="mt-1 font-display text-subtitle leading-tight">{trait.name}</h2>
              <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-[700ms] ease-arcane"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <span className="chip-arcane">{progress}%</span>
                <span className="chip-muted">{evidences} evidências</span>
                <span className={`chip-muted ${recentes === 0 ? "text-destructive/80" : ""}`}>
                  {recentes} nos últimos {JANELA_DIAS} dias
                </span>
              </div>
              {recentes === 0 && (
                <p className="mt-3 text-small text-muted-foreground">
                  Esta qualidade não foi exercida nesta semana. Ela não volta sozinha.
                </p>
              )}
              <div className="mt-4 space-y-1 text-small text-muted-foreground">
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

        {traits.length === 0 && (
          <div className="glass p-6 text-small text-muted-foreground">
            Nenhuma característica ainda. Descreva a qualidade — não a meta.
          </div>
        )}
      </div>

      <div className="glass mt-6 flex gap-2 p-4">
        <input
          value={newTrait}
          onChange={(e) => setNewTrait(e.target.value)}
          placeholder="Adicionar característica (ex: calma, não 'ser calma em 2027')"
          className="flex-1 rounded-xl border border-input bg-surface/60 px-3.5 py-2.5 text-body outline-none transition-colors duration-[var(--duration-fast)] focus:border-primary/60"
        />
        <button
          onClick={addTrait}
          className="rounded-xl bg-primary px-4 py-2.5 text-small font-medium text-primary-foreground transition-transform duration-[var(--duration-fast)] ease-arcane hover:scale-[1.02]"
        >
          Adicionar
        </button>
      </div>

      {/* Fase V — a virada de Siddhartha: encontrar é não ter objetivo */}
      <section className="glass-strong arcane-glow mt-10 p-6 text-center">
        <div className="label-arcane">Fase V · Integração</div>
        <blockquote className="quote-arcane mt-4 text-lead">“{SIDDHARTHA.quote}”</blockquote>
        <footer className="mt-3 text-micro text-muted-foreground">
          {SIDDHARTHA.author} · {SIDDHARTHA.source}
        </footer>
        <p className="mt-5 text-small text-muted-foreground">
          A gamificação comum te empurra para o próximo nível. Aqui o último nível é o oposto disso:
          o que exigia esforço passa a apenas acontecer — e o Eu Futuro deixa de ser um destino.
        </p>
      </section>

      <p className="quote-arcane mt-10 text-center">
        Você não precisa acreditar que mudou. Você precisa acumular evidências até ser difícil
        acreditar que continua igual.
      </p>
    </AppShell>
  );
}
