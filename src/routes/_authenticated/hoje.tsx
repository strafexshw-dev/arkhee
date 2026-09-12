import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { greeting, grantXp, levelFromXp, levelName, today } from "@/lib/arcano";

export const Route = createFileRoute("/_authenticated/hoje")({
  head: () => ({
    meta: [
      { title: "Hoje — Reflexo Arcano" },
      { name: "description", content: "Seu estado atual, o check-in mental, a missão do dia e as evidências de identidade." },
      { property: "og:title", content: "Hoje — Reflexo Arcano" },
      { property: "og:description", content: "Estado atual, check-in mental, missão do dia e evidências de identidade." },
    ],
  }),
  component: Hoje,
});

const MOODS = ["😣", "😕", "😐", "🙂", "⚡"];

type Profile = {
  id: string;
  display_name: string | null;
  xp: number;
  streak: number;
  onboarding_completed: boolean;
};
type Habit = { id: string; title: string };
type Mission = { id: string; title: string; prompt: string; xp: number };

function Hoje() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [doneIds, setDoneIds] = useState<string[]>([]);
  const [mood, setMood] = useState<number | null>(null);
  const [mission, setMission] = useState<Mission | null>(null);
  const [missionDone, setMissionDone] = useState(false);
  const [open, setOpen] = useState(false);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user!.id;
    const t = today();

    const [{ data: p }, { data: h }, { data: logs }, { data: c }, { data: ms }, { data: mc }] =
      await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        supabase.from("habits").select("id, title").eq("user_id", userId).eq("active", true).order("created_at"),
        supabase.from("habit_logs").select("habit_id").eq("user_id", userId).eq("done_on", t),
        supabase.from("mental_checkins").select("mood").eq("user_id", userId).eq("day", t).maybeSingle(),
        supabase.from("missions").select("id, title, prompt, xp").order("order_index"),
        supabase.from("mission_completions").select("mission_id").eq("user_id", userId).eq("day", t),
      ]);

    if (p && !p.onboarding_completed) {
      navigate({ to: "/onboarding" });
      return;
    }

    const lvl = levelFromXp(p?.xp ?? 0).level;
    const chosen = ms?.[Math.min(lvl - 1, (ms?.length ?? 1) - 1)] ?? null;

    setProfile(p as Profile | null);
    setHabits((h ?? []) as Habit[]);
    setDoneIds((logs ?? []).map((l) => l.habit_id));
    setMood(c?.mood ?? null);
    setMission(chosen);
    setMissionDone(!!chosen && (mc ?? []).some((x) => x.mission_id === chosen.id));
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    void load();
  }, [load]);

  async function pickMood(value: number) {
    if (!profile) return;
    setMood(value);
    await supabase
      .from("mental_checkins")
      .upsert({ user_id: profile.id, day: today(), mood: value }, { onConflict: "user_id,day" });
    await grantXp(profile.id, 10, "check-in mental");
    void load();
  }

  async function toggleHabit(habit: Habit) {
    if (!profile) return;
    const isDone = doneIds.includes(habit.id);
    if (isDone) {
      setDoneIds(doneIds.filter((id) => id !== habit.id));
      await supabase.from("habit_logs").delete().eq("habit_id", habit.id).eq("done_on", today());
    } else {
      setDoneIds([...doneIds, habit.id]);
      await supabase
        .from("habit_logs")
        .insert({ user_id: profile.id, habit_id: habit.id, done_on: today() });
      await grantXp(profile.id, 20, `evidência: ${habit.title}`);
      toast.success("Mais um voto na sua nova identidade.");
    }
    void load();
  }

  async function completeMission() {
    if (!profile || !mission) return;
    await supabase.from("mission_completions").insert({
      user_id: profile.id,
      mission_id: mission.id,
      response: answer,
      day: today(),
    });
    await supabase.from("journal_entries").insert({
      user_id: profile.id,
      prompt: mission.prompt,
      content: answer,
    });
    await grantXp(profile.id, mission.xp, `missão: ${mission.title}`);
    setOpen(false);
    setAnswer("");
    toast.success("Missão registrada.");
    void load();
  }

  if (loading) {
    return (
      <AppShell>
        <div className="pulse-slow py-20 text-center text-sm text-muted-foreground">Sintonizando...</div>
      </AppShell>
    );
  }

  const xp = profile?.xp ?? 0;
  const { level, progress } = levelFromXp(xp);
  const votes = doneIds.length;

  return (
    <AppShell>
      <header className="mb-8">
        <div className="label-arcane mb-2">
          {greeting()}, {profile?.display_name ?? "viajante"}.
        </div>
        <h1 className="font-display text-3xl leading-snug">
          Quem você está treinando para se tornar?
        </h1>
      </header>

      <section className="glass arcane-glow p-6">
        <div className="label-arcane">Estado atual</div>
        <div className="mt-2 font-display text-2xl">
          Nível {String(level).padStart(2, "0")} — {levelName(level)}
        </div>
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>{xp.toLocaleString("pt-BR")} XP</span>
          <span>🔥 {profile?.streak ?? 0} dias</span>
        </div>
      </section>

      <section className="mt-6">
        <div className="label-arcane mb-3">Como sua mente está agora?</div>
        <div className="flex gap-2">
          {MOODS.map((emoji, i) => (
            <button
              key={emoji}
              onClick={() => pickMood(i + 1)}
              className={`flex-1 rounded-xl border py-3 text-2xl transition-all ${
                mood === i + 1
                  ? "border-primary/70 bg-ember-soft scale-105"
                  : "border-border hover:bg-secondary/40"
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </section>

      {mission && (
        <section className="glass mt-6 p-6">
          <div className="label-arcane">Missão de hoje</div>
          <p className="quote-arcane mt-3">{mission.prompt}</p>
          {missionDone ? (
            <div className="mt-5 text-sm text-primary">Missão concluída hoje ✦</div>
          ) : open ? (
            <div className="mt-4">
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                rows={5}
                placeholder="Escreva aqui..."
                className="w-full rounded-lg border border-input bg-surface/60 p-3 text-sm outline-none focus:border-primary/60"
              />
              <div className="mt-3 flex gap-2">
                <button
                  disabled={!answer.trim()}
                  onClick={completeMission}
                  className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-40"
                >
                  Concluir missão
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-border px-5 py-2.5 text-sm text-muted-foreground"
                >
                  Depois
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setOpen(true)}
              className="mt-5 rounded-lg border border-primary/50 px-5 py-2.5 text-sm text-primary hover:bg-ember-soft"
            >
              Começar missão
            </button>
          )}
        </section>
      )}

      <section className="mt-6">
        <div className="label-arcane mb-2">Evidências de identidade</div>
        <p className="quote-arcane mb-4">
          Cada ação é um voto na pessoa que você está se tornando.
        </p>
        <div className="glass divide-y divide-border/60">
          {habits.map((habit) => {
            const done = doneIds.includes(habit.id);
            return (
              <button
                key={habit.id}
                onClick={() => toggleHabit(habit)}
                className="flex w-full items-center gap-3 px-5 py-4 text-left text-sm"
              >
                <span
                  className={`grid size-5 place-items-center rounded-full border text-[11px] ${
                    done ? "border-primary bg-primary text-primary-foreground" : "border-border"
                  }`}
                >
                  {done ? "✓" : ""}
                </span>
                <span className={done ? "text-foreground" : "text-muted-foreground"}>{habit.title}</span>
              </button>
            );
          })}
          {habits.length === 0 && (
            <div className="px-5 py-6 text-sm text-muted-foreground">
              Nenhum hábito ainda. Eles nascem do seu Eu Futuro.
            </div>
          )}
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Você deu <span className="text-primary">{votes}</span>{" "}
          {votes === 1 ? "voto" : "votos"} para sua nova identidade hoje.
        </p>
      </section>
    </AppShell>
  );
}
