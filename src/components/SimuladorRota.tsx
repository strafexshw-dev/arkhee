import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { db as supabase } from "@/lib/db";
import { grantXp } from "@/lib/arcano";
import { ANEL_EXTERNO, ANEL_INTERNO, DICOTOMIA_VOZ, notaPara, type Nota } from "@/lib/sabedoria";
import { promptEvidencia, ROTA_VAZIA, type RotaDraft } from "@/lib/rota";

const PASSOS = [
  { letra: "A", nome: "Antigo", desc: "O caminho que já existe" },
  { letra: "B", nome: "Intervenção", desc: "O que está ao seu alcance" },
  { letra: "C", nome: "Novo", desc: "A resposta que você escolhe" },
  { letra: "D", nome: "Evidência", desc: "O que aconteceu de fato" },
];

const field =
  "w-full rounded-xl border border-input bg-surface/60 px-3.5 py-2.5 text-body outline-none transition-colors duration-[var(--duration-fast)] focus:border-primary/60";

/**
 * Simulador de cenários (Fase III): transforma o Mapa de descrição em
 * prescrição. Cada rota sai daqui gravada em thought_patterns — o mesmo
 * schema de sempre, sem tabela nova.
 */
export function SimuladorRota({
  userId,
  initial,
  passoInicial = 0,
  onClose,
  onSaved,
}: {
  userId: string;
  initial?: Partial<RotaDraft> | null;
  passoInicial?: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [passo, setPasso] = useState(passoInicial);
  const [draft, setDraft] = useState<RotaDraft>({ ...ROTA_VAZIA, ...initial });
  const [emJogo, setEmJogo] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const set = (patch: Partial<RotaDraft>) => setDraft((d) => ({ ...d, ...patch }));

  /** Diagnóstico: o texto escrito até aqui parece ligado a qual nó? */
  const sugestao: Nota | null = useMemo(() => {
    if (draft.name.startsWith("~~")) return null;
    return notaPara(`${draft.name} ${draft.trigger_text} ${draft.thought} ${draft.emotion}`);
  }, [draft.name, draft.trigger_text, draft.thought, draft.emotion]);

  const jaConectado = sugestao ? draft.name.startsWith(sugestao.nome) : false;

  function conectar() {
    if (!sugestao) return;
    const base = draft.name.trim();
    set({ name: base ? `${sugestao.nome} · ${base}` : sugestao.nome });
    toast.success(`Conectado ao nó ${sugestao.nome}.`);
  }

  function alternarEmJogo(label: string) {
    setEmJogo((atual) =>
      atual.includes(label) ? atual.filter((l) => l !== label) : [...atual, label],
    );
  }

  const podeAvancar =
    passo === 0
      ? draft.name.trim().length > 1
      : passo === 1
        ? draft.new_thought.trim().length > 3
        : passo === 2
          ? draft.new_action.trim().length > 3
          : true;

  async function salvar() {
    setBusy(true);
    try {
      const payload = {
        user_id: userId,
        name: draft.name.trim(),
        trigger_text: draft.trigger_text.trim() || null,
        thought: draft.thought.trim() || null,
        emotion: draft.emotion.trim() || null,
        old_response: draft.old_response.trim() || null,
        old_result: draft.old_result.trim() || null,
        new_thought: draft.new_thought.trim() || null,
        new_action: draft.new_action.trim() || null,
        new_evidence: draft.new_evidence.trim() || null,
      };

      if (draft.id) {
        await supabase.from("thought_patterns").update(payload).eq("id", draft.id);
      } else {
        await supabase.from("thought_patterns").insert(payload);
      }
      await grantXp(userId, 60, "nova rota neural");

      if (payload.new_evidence) {
        await supabase.from("journal_entries").insert({
          user_id: userId,
          prompt: promptEvidencia(payload.name),
          content: payload.new_evidence,
        });
        await grantXp(userId, 20, "evidência de rota");
      }

      toast.success("Rota gravada no seu mapa.");
      onSaved();
    } catch {
      toast.error("Não foi possível gravar a rota.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-start overflow-y-auto bg-background/85 px-4 py-8 backdrop-blur-md">
      <div className="glass-strong arcane-glow rise-in w-full max-w-lg p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="label-arcane">Simulador de rota</div>
            <h2 className="mt-1.5 font-display text-subtitle leading-tight">
              {draft.id ? "Continuar esta rota" : "Criar uma rota nova"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-border px-3 py-1 text-micro text-muted-foreground transition-colors hover:text-foreground"
          >
            fechar ✕
          </button>
        </div>

        {/* trilha A → B → C → D */}
        <ol className="mt-5 flex items-center gap-1.5">
          {PASSOS.map((p, i) => (
            <li key={p.letra} className="flex flex-1 items-center gap-1.5">
              <button
                onClick={() => i <= passo && setPasso(i)}
                disabled={i > passo}
                className={`grid size-7 shrink-0 place-items-center rounded-full border font-display text-small transition-colors duration-[var(--duration-base)] ${
                  i === passo
                    ? "border-primary bg-primary text-primary-foreground"
                    : i < passo
                      ? "border-primary/50 text-primary"
                      : "border-border text-muted-foreground"
                }`}
                aria-current={i === passo ? "step" : undefined}
              >
                {p.letra}
              </button>
              {i < PASSOS.length - 1 && (
                <span
                  className={`h-px flex-1 ${i < passo ? "bg-primary/50" : "bg-border"}`}
                  aria-hidden
                />
              )}
            </li>
          ))}
        </ol>
        <p className="mt-2 text-micro text-muted-foreground">
          {PASSOS[passo]!.nome} — {PASSOS[passo]!.desc}
        </p>

        <div className="mt-5 space-y-3">
          {passo === 0 && (
            <>
              <input
                className={field}
                placeholder="Nome do padrão (ex: medo de julgamento na reunião)"
                value={draft.name}
                onChange={(e) => set({ name: e.target.value })}
                autoFocus
              />
              <input
                className={field}
                placeholder="Gatilho: o que dispara isso?"
                value={draft.trigger_text}
                onChange={(e) => set({ trigger_text: e.target.value })}
              />
              <input
                className={field}
                placeholder="Pensamento automático"
                value={draft.thought}
                onChange={(e) => set({ thought: e.target.value })}
              />
              <input
                className={field}
                placeholder="Emoção"
                value={draft.emotion}
                onChange={(e) => set({ emotion: e.target.value })}
              />
              <input
                className={field}
                placeholder="Resposta antiga"
                value={draft.old_response}
                onChange={(e) => set({ old_response: e.target.value })}
              />
              <input
                className={field}
                placeholder="Resultado que ela sempre produz"
                value={draft.old_result}
                onChange={(e) => set({ old_result: e.target.value })}
              />

              {sugestao && !jaConectado && (
                <div className="rise-in flex flex-wrap items-center gap-3 rounded-xl border border-primary/25 bg-ember-soft px-4 py-3">
                  <span className="text-small text-foreground">
                    Isso parece ligado ao nó{" "}
                    <strong className="text-primary">{sugestao.nome}</strong>.
                  </span>
                  <button
                    onClick={conectar}
                    className="rounded-pill border border-primary/50 px-3 py-1 text-micro text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                  >
                    conectar
                  </button>
                </div>
              )}
              {sugestao && jaConectado && <BlocoNota nota={sugestao} />}
            </>
          )}

          {passo === 1 && (
            <>
              <blockquote className="quote-arcane border-l border-primary/30 pl-4 text-body">
                “{DICOTOMIA_VOZ.quote}”
                <footer className="mt-2 font-sans text-micro not-italic text-muted-foreground">
                  {DICOTOMIA_VOZ.author} · {DICOTOMIA_VOZ.source}
                </footer>
              </blockquote>

              <div className="grid gap-3 sm:grid-cols-2">
                <ColunaChips
                  titulo="Ao seu alcance"
                  tone="interno"
                  itens={ANEL_INTERNO.map((n) => n.label)}
                  emJogo={emJogo}
                  onToggle={alternarEmJogo}
                />
                <ColunaChips
                  titulo="Fora do seu alcance"
                  tone="externo"
                  itens={ANEL_EXTERNO.map((n) => n.label)}
                  emJogo={emJogo}
                  onToggle={alternarEmJogo}
                />
              </div>
              <p className="text-micro text-muted-foreground">
                Isto é um espelho, não um formulário — a seleção não é gravada, serve só para você
                enxergar onde a situação realmente acontece.
              </p>

              <label className="block">
                <span className="label-arcane mb-2 block">
                  {sugestao ? sugestao.pergunta : "O que você controla nesta situação?"}
                </span>
                <textarea
                  className={field}
                  rows={3}
                  placeholder="Escreva com suas palavras..."
                  value={draft.new_thought}
                  onChange={(e) => set({ new_thought: e.target.value })}
                />
              </label>
            </>
          )}

          {passo === 2 && (
            <>
              <label className="block">
                <span className="label-arcane mb-2 block">Pensamento consciente</span>
                <textarea
                  className={field}
                  rows={2}
                  value={draft.new_thought}
                  onChange={(e) => set({ new_thought: e.target.value })}
                />
              </label>
              <label className="block">
                <span className="label-arcane mb-2 block">Nova ação — concreta e pequena</span>
                <textarea
                  className={field}
                  rows={2}
                  placeholder="O que você vai fazer diferente da próxima vez?"
                  value={draft.new_action}
                  onChange={(e) => set({ new_action: e.target.value })}
                />
              </label>
              {sugestao && (
                <div className="rounded-xl border border-border bg-surface/40 px-4 py-3 text-small text-muted-foreground">
                  <span className="label-arcane mb-1.5 block text-primary">
                    Micro-desafio sugerido
                  </span>
                  {sugestao.desafio}
                </div>
              )}
            </>
          )}

          {passo === 3 && (
            <>
              <label className="block">
                <span className="label-arcane mb-2 block">
                  O que aconteceu depois que você agiu diferente?
                </span>
                <textarea
                  className={field}
                  rows={4}
                  placeholder="Pode preencher agora ou voltar aqui depois — a rota já nasce no mapa."
                  value={draft.new_evidence}
                  onChange={(e) => set({ new_evidence: e.target.value })}
                />
              </label>
              <p className="text-small text-muted-foreground">
                Com evidência, a rota acende no mapa em âmbar e vale{" "}
                <span className="text-primary">+20 XP</span> além dos +60 da rota.
              </p>
            </>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            onClick={() => (passo === 0 ? onClose() : setPasso(passo - 1))}
            className="rounded-xl border border-border px-5 py-2.5 text-small text-muted-foreground transition-colors duration-[var(--duration-fast)] hover:text-foreground"
          >
            {passo === 0 ? "Cancelar" : "Voltar"}
          </button>
          {passo < PASSOS.length - 1 ? (
            <button
              disabled={!podeAvancar}
              onClick={() => setPasso(passo + 1)}
              className="rounded-xl bg-primary px-6 py-2.5 text-small font-medium text-primary-foreground transition-transform duration-[var(--duration-fast)] ease-arcane hover:scale-[1.02] disabled:opacity-40 disabled:hover:scale-100"
            >
              Continuar
            </button>
          ) : (
            <button
              disabled={busy || !draft.name.trim()}
              onClick={salvar}
              className="ember-glow rounded-xl bg-primary px-6 py-2.5 text-small font-medium text-primary-foreground transition-transform duration-[var(--duration-fast)] ease-arcane hover:scale-[1.02] disabled:opacity-40"
            >
              {busy ? "Gravando..." : "Gravar rota no mapa"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ColunaChips({
  titulo,
  tone,
  itens,
  emJogo,
  onToggle,
}: {
  titulo: string;
  tone: "interno" | "externo";
  itens: string[];
  emJogo: string[];
  onToggle: (label: string) => void;
}) {
  return (
    <div>
      <div className={`label-arcane mb-2 ${tone === "interno" ? "text-primary" : "text-accent"}`}>
        {titulo}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {itens.map((item) => {
          const on = emJogo.includes(item);
          return (
            <button
              key={item}
              onClick={() => onToggle(item)}
              aria-pressed={on}
              className={`rounded-pill border px-3 py-1 text-micro transition-colors duration-[var(--duration-fast)] ${
                on
                  ? tone === "interno"
                    ? "border-primary/60 bg-ember-soft text-primary"
                    : "border-accent/60 bg-arcane-soft text-accent"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {item}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function BlocoNota({ nota }: { nota: Nota }) {
  return (
    <div className="rise-in space-y-3 rounded-xl border border-border bg-surface/40 p-4">
      <div className="label-arcane text-primary">Nota de reprogramação · {nota.nome}</div>
      <blockquote className="quote-arcane text-body">
        “{nota.voz.quote}”
        <footer className="mt-1.5 font-sans text-micro not-italic text-muted-foreground">
          {nota.voz.author} · {nota.voz.source}
        </footer>
      </blockquote>
      <p className="text-small text-muted-foreground">
        <span className="label-arcane mr-2 text-foreground">Pergunta</span>
        {nota.pergunta}
      </p>
      <p className="text-small text-muted-foreground">
        <span className="label-arcane mr-2 text-foreground">2 minutos</span>
        {nota.desafio}
      </p>
    </div>
  );
}
