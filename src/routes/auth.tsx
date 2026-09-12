import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Reflexo Arcano" },
      { name: "description", content: "Acesse sua jornada de reprogramação mental no Reflexo Arcano." },
      { property: "og:title", content: "Entrar — Reflexo Arcano" },
      { property: "og:description", content: "Acesse sua jornada de reprogramação mental." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("up");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/hoje" });
    });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "up") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: name },
            emailRedirectTo: `${window.location.origin}/hoje`,
          },
        });
        if (error) throw error;
        const { data } = await supabase.auth.getSession();
        if (data.session) navigate({ to: "/onboarding" });
        else toast.success("Confirme seu e-mail para continuar.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/hoje" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível continuar.");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Não foi possível entrar com o Google.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/hoje" });
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="glass arcane-glow w-full max-w-sm p-8">
        <div className="label-arcane mb-2">Reflexo Arcano</div>
        <h1 className="font-display text-3xl">
          {mode === "up" ? "Vamos encontrá-la." : "Bem-vinda de volta."}
        </h1>

        <form onSubmit={submit} className="mt-7 space-y-3">
          {mode === "up" && (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Como você quer ser chamada?"
              className="w-full rounded-lg border border-input bg-surface/60 px-4 py-3 text-sm outline-none focus:border-primary/60"
            />
          )}
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-mail"
            className="w-full rounded-lg border border-input bg-surface/60 px-4 py-3 text-sm outline-none focus:border-primary/60"
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha"
            className="w-full rounded-lg border border-input bg-surface/60 px-4 py-3 text-sm outline-none focus:border-primary/60"
          />
          <button
            type="submit"
            disabled={busy}
            className="ember-glow w-full rounded-lg bg-primary py-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            {mode === "up" ? "Criar acesso" : "Entrar"}
          </button>
        </form>

        <button
          onClick={google}
          className="mt-3 w-full rounded-lg border border-border py-3 text-sm text-foreground/90 hover:bg-secondary/50"
        >
          Continuar com Google
        </button>

        <button
          onClick={() => setMode(mode === "up" ? "in" : "up")}
          className="mt-6 w-full text-center text-xs text-muted-foreground hover:text-foreground"
        >
          {mode === "up" ? "Já tenho acesso" : "Criar um acesso"}
        </button>
      </div>
    </div>
  );
}
