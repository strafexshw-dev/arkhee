import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { db as supabase } from "@/lib/db";
import { AppShell, PageTitle } from "@/components/AppShell";
import { grantXp, levelFromXp } from "@/lib/arcano";

export const Route = createFileRoute("/_authenticated/reprogramar")({
  head: () => ({
    meta: [
      { title: "Reprogramar — Reflexo Arcano" },
      { name: "description", content: "Crenças, padrões automáticos e reflexões: o treinamento mental do Reflexo Arcano." },
      { property: "og:title", content: "Reprogramar — Reflexo Arcano" },
      { property: "og:description", content: "Crenças, padrões automáticos e reflexões guiadas." },
    ],
  }),
  component: Reprogramar,
});

type Module = "beliefs" | "patterns" | "journal";

const LOCKED = [
  { name: "Visualização", desc: "Sessões guiadas da identidade futura.", level: 3 },
  { name: "Afirmações", desc: "Frases construídas a partir das suas próprias evidências.", level: 4 },
  { name: "Áudios", desc: "Sessões de 5, 10 ou 20 minutos.", level: 5 },
];

function Reprogramar() {
  const [userId, setUserId] = useState<string | null>(null);
  const [level, setLevel] = useState(1);
  const [open, setOpen] = useState<Module | null>(null);
  const [counts, setCounts] = useState({ beliefs: 0, patterns: 0, journal: 0 });

  const [belief, setBelief] = useState({ content: "", origin: "", new_belief: "" });
  const [pattern, setPattern] = useState({
    name: "",
    trigger_text: "",
    thought: "",
    emotion: "",
    old_response: "",
    old_result: "",
    new_thought: "",
    new_action: "",
    new_evidence: "",
  });
  const [entry, setEntry] = useState("");

  const load = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    const id = auth.user!.id;
    setUserId(id);
    const [{ data: p }, b, tp, j] = await Promise.all([
      supabase.from("profiles").select("xp").eq("id", id).maybeSingle(),
      supabase.from("beliefs").select("id", { count: "exact", head: true }).eq("user_id", id),
      supabase.from("thought_patterns").select("id", { count: "exact", head: true }).eq("user_id", id),
      supabase.from("journal_entries").select("id", { count: "exact", head: true }).eq("user_id", id),
    ]);
    setLevel(levelFromXp(p?.xp ?? 0).level);
    setCounts({ beliefs: b.count ?? 0, patterns: tp.count ?? 0, journal: j.count ?? 0 });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveBelief() {
    if (!userId) return;
    await supabase.from("beliefs").insert({ user_id: userId, ...belief });
    await grantXp(userId, 40, "crença mapeada");
    setBelief({ content: "", origin: "", new_belief: "" });
    setOpen(null);
    toast.success("Crença registrada.");
    void load();
  }

  async function savePattern() {
    if (!userId) return;
    await supabase.from("thought_patterns").insert({ user_id: userId, ...pattern });
    await grantXp(userId, 60, "padrão mapeado");
    setPattern({
      name: "",
      trigger_text: "",
      thought: "",
      emotion: "",
      old_response: "",
      old_result: "",
      new_thought: "",
      new_action: "",
      new_evidence: "",
    });
    setOpen(null);
    toast.success("Padrão adicionado ao seu mapa.");
    void load();
  }

  async function saveEntry() {
    if (!userId) return;
    await supabase.from("journal_entries").insert({
      user_id: userId,
      prompt: "Reflexão livre",
      content: entry,
    });
    await grantXp(userId, 30, "reflexão");
    setEntry("");
    setOpen(null);
    toast.success("Reflexão guardada.");
    void load();
  }

  const field =
    "w-full rounded-lg border border-input bg-surface/60 px-3 py-2.5 text-sm outline-none focus:border-primary/60";

  return (
    <AppShell>
      <PageTitle
        kicker="Treinamento mental"
        title="Reprogramar"
        quote="Você não precisa lutar contra todos os seus pensamentos. Primeiro precisa descobrir de onde eles vêm."
      />

      <div className="space-y-4">
        <ModuleCard
          title="Crenças"
          desc="Descubra crenças que estão dirigindo comportamentos."
          count={counts.beliefs}
          onClick={() => setOpen(open === "beliefs" ? null : "beliefs")}
        />
        {open === "beliefs" && (
          <div className="glass space-y-3 p-5">
            <input
              className={field}
              placeholder="Qual crença apareceu?"
              value={belief.content}
              onChange={(e) => setBelief({ ...belief, content: e.target.value })}
            />
            <input
              className={field}
              placeholder="De onde ela veio?"
              value={belief.origin}
              onChange={(e) => setBelief({ ...belief, origin: e.target.value })}
            />
            <input
              className={field}
              placeholder="O que você escolhe acreditar no lugar?"
              value={belief.new_belief}
              onChange={(e) => setBelief({ ...belief, new_belief: e.target.value })}
            />
            <button
              disabled={!belief.content.trim()}
              onClick={saveBelief}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-40"
            >
              Registrar crença
            </button>
          </div>
        )}

        <ModuleCard
          title="Padrões automáticos"
          desc="Identifique situações que ativam determinadas respostas."
          count={counts.patterns}
          onClick={() => setOpen(open === "patterns" ? null : "patterns")}
        />
        {open === "patterns" && (
          <div className="glass space-y-3 p-5">
            <input
              className={field}
              placeholder="Nome do padrão (ex: medo de julgamento)"
              value={pattern.name}
              onChange={(e) => setPattern({ ...pattern, name: e.target.value })}
            />
            <div className="label-arcane pt-2">Caminho antigo</div>
            <input className={field} placeholder="Gatilho" value={pattern.trigger_text} onChange={(e) => setPattern({ ...pattern, trigger_text: e.target.value })} />
            <input className={field} placeholder="Pensamento" value={pattern.thought} onChange={(e) => setPattern({ ...pattern, thought: e.target.value })} />
            <input className={field} placeholder="Emoção" value={pattern.emotion} onChange={(e) => setPattern({ ...pattern, emotion: e.target.value })} />
            <input className={field} placeholder="Resposta antiga" value={pattern.old_response} onChange={(e) => setPattern({ ...pattern, old_response: e.target.value })} />
            <input className={field} placeholder="Resultado" value={pattern.old_result} onChange={(e) => setPattern({ ...pattern, old_result: e.target.value })} />
            <div className="label-arcane pt-2">Novo caminho</div>
            <input className={field} placeholder="Pensamento consciente" value={pattern.new_thought} onChange={(e) => setPattern({ ...pattern, new_thought: e.target.value })} />
            <input className={field} placeholder="Nova ação" value={pattern.new_action} onChange={(e) => setPattern({ ...pattern, new_action: e.target.value })} />
            <input className={field} placeholder="Nova evidência" value={pattern.new_evidence} onChange={(e) => setPattern({ ...pattern, new_evidence: e.target.value })} />
            <button
              disabled={!pattern.name.trim()}
              onClick={savePattern}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-40"
            >
              Adicionar ao mapa
            </button>
          </div>
        )}

        <ModuleCard
          title="Reflexões"
          desc="Perguntas e exercícios de escrita."
          count={counts.journal}
          onClick={() => setOpen(open === "journal" ? null : "journal")}
        />
        {open === "journal" && (
          <div className="glass space-y-3 p-5">
            <textarea
              rows={6}
              className={field}
              placeholder="O que sua mente está tentando te dizer hoje?"
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
            />
            <button
              disabled={!entry.trim()}
              onClick={saveEntry}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-40"
            >
              Guardar reflexão
            </button>
          </div>
        )}

        {LOCKED.map((m) => (
          <div key={m.name} className="glass flex items-center justify-between p-5 opacity-55">
            <div>
              <div className="font-display text-xl">{m.name}</div>
              <div className="mt-1 text-sm text-muted-foreground">{m.desc}</div>
            </div>
            <div className="text-xs text-muted-foreground">
              {level >= m.level ? "Em breve" : `Nível ${m.level}`}
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}

function ModuleCard({
  title,
  desc,
  count,
  onClick,
}: {
  title: string;
  desc: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="glass flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-secondary/30"
    >
      <div>
        <div className="font-display text-xl">{title}</div>
        <div className="mt-1 text-sm text-muted-foreground">{desc}</div>
      </div>
      <div className="text-sm text-primary">{count}</div>
    </button>
  );
}
