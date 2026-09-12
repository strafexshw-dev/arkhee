import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { db as supabase } from "@/lib/db";
import { AppShell } from "@/components/AppShell";
import { AnimatedCheck } from "@/components/AnimatedCheck";
import { ProgressRing } from "@/components/ProgressRing";
import { greeting, grantXp, levelFromXp, levelName, roman, today } from "@/lib/arcano";
import { VOZES_FASE } from "@/lib/sabedoria";

export const Route = createFileRoute("/_authenticated/hoje")({
  head: () => ({
    meta: [
      { title: "Hoje — Reflexo Arcano" },
      {
        name: "description",
        content:
          "Seu estado atual, o check-in mental, a missão do dia e as evidências de identidade.",
      },
      { property: "og:title", content: "Hoje — Reflexo Arcano" },
      {
        property: "og:description",
        content: "Estado atual, check-in mental, missão do dia e evidências de identidade.",
      },
    ],
  }),
  component: Hoje,
});

const MOODS = ["😣", "😕", "😐", "🙂", "⚡"];

/** Regra dos 40% (Goggins): o desafio extra oferecido depois do primeiro voto. */
const DESAFIO_40_PROMPT = "Evidência de desconforto — regra dos 40%";
const DESAFIO_40_XP = 30;
const GOGGINS = VOZES_FASE[2]!;
const MOOD_LABELS = ["Pesado", "Turvo", "Neutro", "Leve", "Aceso"];
const MOOD_FEEDBACK = [
  "Registrado. Dias pesados também são evidência.",
  "Registrado. Você não precisa resolver isso agora.",
  "Registrado. Neutro também é um dado útil.",
  "Registrado. Guarde essa sensação como referência.",
  "Registrado. Energia em alta: escolha uma coisa difícil.",
];

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
  const [tanque, setTanque] = useState({
    aberto: false,
    texto: "",
    feitoHoje: false,
    salvo: false,
  });

  const load = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user!.id;
    const t = today();

    const [
      { data: p },
      { data: h },
      { data: logs },
      { data: c },
      { data: ms },
      { data: mc },
      { data: d40 },
    ] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase
        .from("habits")
        .select("id, title")
        .eq("user_id", userId)
        .eq("active", true)
        .order("created_at"),
      supabase.from("habit_logs").select("habit_id").eq("user_id", userId).eq("done_on", t),
      supabase
        .from("mental_checkins")
        .select("mood")
        .eq("user_id", userId)
        .eq("day", t)
        .maybeSingle(),
      supabase.from("missions").select("id, title, prompt, xp").order("order_index"),
      supabase.from("mission_completions").select("mission_id").eq("user_id", userId).eq("day", t),
      supabase
        .from("journal_entries")
        .select("id")
        .eq("user_id", userId)
        .eq("prompt", DESAFIO_40_PROMPT)
        .gte("created_at", t),
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
    setTanque((atual) => ({ ...atual, feitoHoje: (d40 ?? []).length > 0 }));
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

  async function salvarDesconforto() {
    if (!profile || !tanque.texto.trim()) return;
    await supabase.from("journal_entries").insert({
      user_id: profile.id,
      prompt: DESAFIO_40_PROMPT,
      content: tanque.texto.trim(),
    });
    await grantXp(profile.id, DESAFIO_40_XP, "evidência de desconforto (40%)");
    setTanque({ aberto: false, texto: "", feitoHoje: true, salvo: true });
    toast.success(`+${DESAFIO_40_XP} XP. Isso é o que ninguém vê.`);
    void load();
  }

  if (loading) {
    return (
      <AppShell>
        <div className="pulse-slow py-24 text-center text-small text-muted-foreground">
          Sintonizando...
        </div>
      </AppShell>
    );
  }

  const xp = profile?.xp ?? 0;
  const { level, progress } = levelFromXp(xp);
  const votes = doneIds.length;

  return (
    <AppShell>
      {/* ── 1 · ABERTURA — a pergunta é a protagonista ─────────────────── */}
      <header className="rise-in relative mb-10 pt-2 text-center">
        <div
          className="pulse-slow pointer-events-none absolute -top-24 left-1/2 size-80 -translate-x-1/2 rounded-full bg-primary/10 blur-[90px]"
          aria-hidden
        />
        <div className="label-arcane relative">
          {greeting()}, {profile?.display_name ?? "viajante"}.
        </div>
        <h1 className="hero-glow relative mx-auto mt-4 max-w-2xl font-display text-title md:text-hero">
          Quem você está treinando <span className="ember-text">para se tornar</span>?
        </h1>
        <div className="rule-arcane relative mx-auto mt-7 max-w-32 text-micro" aria-hidden>
          ✦
        </div>
      </header>

      {/* ── 2 · ESTADO ATUAL — símbolo antes de número ─────────────────── */}
      <section
        className="glass-strong arcane-glow rise-in flex items-center gap-6 p-6"
        style={{ animationDelay: "60ms" }}
      >
        <ProgressRing progress={progress} label={`Progresso do nível atual: ${progress}%`}>
          <div>
            <div className="font-display text-subtitle leading-none text-primary">
              {roman(level)}
            </div>
            <div className="label-arcane mt-1.5 text-[0.55rem]">fase</div>
          </div>
        </ProgressRing>

        <div className="min-w-0">
          <div className="label-arcane">Estado atual</div>
          <div className="mt-1.5 font-display text-subtitle leading-tight">{levelName(level)}</div>
          <div className="mt-3.5 flex flex-wrap items-center gap-2">
            <span className="chip-arcane">{xp.toLocaleString("pt-BR")} XP</span>
            <span className="chip-muted">🔥 {profile?.streak ?? 0} dias</span>
            <span className="chip-muted">{progress}% do nível</span>
          </div>
        </div>
      </section>

      {/* ── 3 · CHECK-IN EMOCIONAL — cinco estados, um toque ───────────── */}
      <section className="rise-in mt-8" style={{ animationDelay: "120ms" }}>
        <div className="label-arcane mb-3">Como sua mente está agora?</div>
        <div className="grid grid-cols-5 gap-2.5 sm:gap-3">
          {MOODS.map((emoji, i) => {
            const active = mood === i + 1;
            return (
              <button
                key={emoji}
                onClick={() => pickMood(i + 1)}
                data-active={active}
                aria-pressed={active}
                aria-label={MOOD_LABELS[i]}
                title={MOOD_LABELS[i]}
                className="mood-orb"
              >
                <span aria-hidden>{emoji}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-3 min-h-5 text-small text-muted-foreground">
          {mood ? MOOD_FEEDBACK[mood - 1] : "Um toque basta. Nada aqui é medido contra você."}
        </p>
      </section>

      {/* ── 4 · MISSÃO DO DIA — um único card em destaque ──────────────── */}
      {mission && (
        <section
          className="rise-in relative mt-8 overflow-hidden rounded-3xl border border-primary/25 bg-card p-6"
          style={{ animationDelay: "180ms" }}
        >
          <div
            className="pulse-slow pointer-events-none absolute -right-20 -top-24 size-64 rounded-full bg-primary/12 blur-[80px]"
            aria-hidden
          />
          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="label-arcane">Missão de hoje</div>
              <h2 className="mt-1.5 font-display text-subtitle leading-tight">{mission.title}</h2>
            </div>
            <span className="chip-arcane shrink-0">+{mission.xp} XP</span>
          </div>

          <p className="quote-arcane relative mt-4">{mission.prompt}</p>

          {missionDone ? (
            <div className="relative mt-6 flex items-center gap-3 rounded-xl border border-primary/25 bg-ember-soft px-4 py-3 text-small text-primary">
              <AnimatedCheck checked />
              Missão concluída hoje
            </div>
          ) : open ? (
            <div className="relative mt-5">
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                rows={5}
                autoFocus
                placeholder="Escreva aqui..."
                className="w-full rounded-xl border border-input bg-surface/60 p-3.5 text-body outline-none transition-colors duration-[var(--duration-fast)] focus:border-primary/60"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  disabled={!answer.trim()}
                  onClick={completeMission}
                  className="ember-glow rounded-xl bg-primary px-5 py-2.5 text-small font-medium text-primary-foreground transition-transform duration-[var(--duration-fast)] ease-arcane hover:scale-[1.02] disabled:opacity-40 disabled:hover:scale-100"
                >
                  Concluir missão
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-border px-5 py-2.5 text-small text-muted-foreground transition-colors duration-[var(--duration-fast)] hover:text-foreground"
                >
                  Depois
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setOpen(true)}
              className="ember-glow relative mt-6 rounded-xl bg-primary px-6 py-3 text-small font-medium text-primary-foreground transition-transform duration-[var(--duration-fast)] ease-arcane hover:scale-[1.02]"
            >
              Começar missão
            </button>
          )}
        </section>
      )}

      {/* ── 5 · EVIDÊNCIAS — lista enxuta e frase final em destaque ────── */}
      <section className="rise-in mt-8" style={{ animationDelay: "240ms" }}>
        <div className="label-arcane mb-2">Evidências de identidade</div>
        <p className="quote-arcane mb-4 text-body">
          Cada ação é um voto na pessoa que você está se tornando.
        </p>

        <div className="glass divide-y divide-border/60 overflow-hidden">
          {habits.map((habit) => {
            const done = doneIds.includes(habit.id);
            return (
              <button
                key={habit.id}
                onClick={() => toggleHabit(habit)}
                aria-pressed={done}
                className="flex w-full items-center gap-3.5 px-5 py-4 text-left text-body transition-colors duration-[var(--duration-fast)] ease-arcane hover:bg-secondary/30"
              >
                <AnimatedCheck checked={done} />
                <span className={done ? "text-foreground" : "text-muted-foreground"}>
                  {habit.title}
                </span>
              </button>
            );
          })}
          {habits.length === 0 && (
            <div className="px-5 py-6 text-small text-muted-foreground">
              Nenhum hábito ainda. Eles nascem do seu Eu Futuro.
            </div>
          )}
        </div>

        {/* ── 5b · REGRA DOS 40% — o convite ao desconforto ─────────── */}
        {votes > 0 && !tanque.feitoHoje && !tanque.aberto && (
          <div className="rise-in mt-5 flex flex-wrap items-center gap-4 rounded-2xl border border-primary/25 bg-ember-soft/50 px-5 py-4">
            <div className="min-w-0 flex-1">
              <div className="label-arcane text-primary">Regra dos 40%</div>
              <p className="mt-1.5 font-display text-lead leading-snug">
                Você ainda tem 60% no tanque.
              </p>
              <p className="mt-1 text-micro text-muted-foreground">
                {GOGGINS.author} · {GOGGINS.source}
              </p>
            </div>
            <button
              onClick={() => setTanque((t) => ({ ...t, aberto: true }))}
              className="rounded-xl border border-primary/50 px-5 py-2.5 text-small text-primary transition-colors duration-[var(--duration-fast)] hover:bg-primary hover:text-primary-foreground"
            >
              Adicionar desconforto
            </button>
          </div>
        )}

        {tanque.aberto && !tanque.feitoHoje && (
          <div className="rise-in mt-5 rounded-2xl border border-primary/25 bg-card p-5">
            <div className="label-arcane text-primary">Evidência de desconforto</div>
            <p className="quote-arcane mt-2 text-body">“{GOGGINS.quote}”</p>
            <textarea
              autoFocus
              rows={3}
              value={tanque.texto}
              onChange={(e) => setTanque((t) => ({ ...t, texto: e.target.value }))}
              placeholder="O que você atravessou hoje que preferiria ter evitado?"
              className="mt-4 w-full rounded-xl border border-input bg-surface/60 p-3.5 text-body outline-none transition-colors duration-[var(--duration-fast)] focus:border-primary/60"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                disabled={!tanque.texto.trim()}
                onClick={salvarDesconforto}
                className="ember-glow rounded-xl bg-primary px-5 py-2.5 text-small font-medium text-primary-foreground transition-transform duration-[var(--duration-fast)] ease-arcane hover:scale-[1.02] disabled:opacity-40 disabled:hover:scale-100"
              >
                Registrar (+{DESAFIO_40_XP} XP)
              </button>
              <button
                onClick={() => setTanque((t) => ({ ...t, aberto: false }))}
                className="rounded-xl border border-border px-5 py-2.5 text-small text-muted-foreground transition-colors duration-[var(--duration-fast)] hover:text-foreground"
              >
                Hoje não
              </button>
            </div>
          </div>
        )}

        {tanque.feitoHoje && (
          <div className="mt-5 flex items-center gap-3 rounded-2xl border border-primary/25 bg-ember-soft/40 px-5 py-4 text-small text-primary">
            <AnimatedCheck checked />
            {tanque.salvo
              ? "Desconforto registrado. Isso ninguém vê, e é o que sustenta o resto."
              : "Você já acrescentou desconforto hoje."}
          </div>
        )}

        <div className="glass-strong ember-glow mt-5 px-5 py-6 text-center">
          <p className="font-display text-lead leading-snug">
            Você deu
            <span className="ember-text mx-2 font-display text-title align-[-0.08em]">{votes}</span>
            {votes === 1 ? "voto" : "votos"} para sua nova identidade hoje.
          </p>
          {votes === 0 && (
            <p className="mt-2.5 text-small text-muted-foreground">
              Um único gesto já muda o que o seu cérebro conclui sobre você.
            </p>
          )}
        </div>
      </section>
    </AppShell>
  );
}
