import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { db as supabase } from "@/lib/db";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Seu Eu Futuro — Reflexo Arcano" },
      { name: "description", content: "Construa a identidade que você está treinando para se tornar." },
      { property: "og:title", content: "Seu Eu Futuro — Reflexo Arcano" },
      { property: "og:description", content: "Construa a identidade que você está treinando para se tornar." },
    ],
  }),
  component: Onboarding,
});

const FOCUS = [
  "Disciplina",
  "Corpo",
  "Dinheiro",
  "Relacionamentos",
  "Autoconfiança",
  "Ansiedade / estresse",
  "Propósito",
  "Outro",
];

const TRAITS = [
  "Disciplinada",
  "Confiante",
  "Saudável",
  "Financeiramente responsável",
  "Criativa",
  "Focada",
  "Calma",
  "Corajosa",
];

const DEFAULT_HABITS = ["Treinar", "Ler 10 minutos", "Meditar", "Dormir antes das 23h"];

const INTRO = [
  "Você não chegou aqui para criar hábitos.",
  "Você chegou aqui porque existe uma versão sua que ainda aparece pouco.",
  "Vamos encontrá-la.",
];

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [focus, setFocus] = useState<string | null>(null);
  const [traits, setTraits] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  async function finish() {
    setBusy(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user!.id;

      const { data: identity, error } = await supabase
        .from("future_identities")
        .insert({ user_id: userId, name: "Eu Futuro", description: focus })
        .select("id")
        .single();
      if (error) throw error;

      const { data: created } = await supabase
        .from("identity_traits")
        .insert(traits.map((name) => ({ user_id: userId, identity_id: identity.id, name })))
        .select("id");

      await supabase.from("habits").insert(
        DEFAULT_HABITS.map((title, i) => ({
          user_id: userId,
          title,
          trait_id: created?.[i % (created.length || 1)]?.id ?? null,
        })),
      );

      await supabase
        .from("profiles")
        .update({ onboarding_completed: true, focus_area: focus })
        .eq("id", userId);

      navigate({ to: "/hoje" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível concluir.");
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-14">
      <div className="w-full max-w-md">
        {step < 3 && (
          <div className="text-center">
            <p className="font-display text-3xl leading-snug">{INTRO[step]}</p>
            <button
              onClick={() => setStep(step + 1)}
              className="mt-10 text-sm tracking-widest text-primary"
            >
              CONTINUAR →
            </button>
          </div>
        )}

        {step === 3 && (
          <div>
            <div className="label-arcane mb-3">Passo 1</div>
            <h2 className="font-display text-3xl">O que você mais quer transformar?</h2>
            <div className="mt-6 space-y-2">
              {FOCUS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFocus(f)}
                  className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                    focus === f
                      ? "border-primary/70 bg-ember-soft"
                      : "border-border hover:border-border/80 hover:bg-secondary/40"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <button
              disabled={!focus}
              onClick={() => setStep(4)}
              className="mt-8 w-full rounded-lg bg-primary py-3 text-sm font-medium text-primary-foreground disabled:opacity-40"
            >
              Continuar
            </button>
          </div>
        )}

        {step === 4 && (
          <div>
            <div className="label-arcane mb-3">Passo 2</div>
            <h2 className="font-display text-3xl">Quem você precisaria se tornar?</h2>
            <p className="mt-3 text-sm text-muted-foreground">Escolha as características do seu Eu Futuro.</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {TRAITS.map((t) => {
                const on = traits.includes(t);
                return (
                  <button
                    key={t}
                    onClick={() => setTraits(on ? traits.filter((x) => x !== t) : [...traits, t])}
                    className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                      on ? "border-accent/70 bg-arcane-soft" : "border-border hover:bg-secondary/40"
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
            <button
              disabled={traits.length === 0 || busy}
              onClick={finish}
              className="ember-glow mt-8 w-full rounded-lg bg-primary py-3 text-sm font-medium text-primary-foreground disabled:opacity-40"
            >
              {busy ? "Construindo..." : "Criar meu Eu Futuro"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
