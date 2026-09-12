import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { AnimatedCheck } from "@/components/AnimatedCheck";
import { ProgressRing } from "@/components/ProgressRing";
import { roman } from "@/lib/arcano";

export const Route = createFileRoute("/design")({
  head: () => ({
    meta: [
      { title: "Design system — Reflexo Arcano" },
      {
        name: "description",
        content: "Tokens de cor, tipografia, espaço, raio, sombra e movimento do Reflexo Arcano.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: DesignSystem,
});

const COLORS = [
  { token: "--bg / --background", className: "bg-background", note: "grafite profundo" },
  { token: "--surface", className: "bg-surface", note: "um degrau acima do fundo" },
  { token: "--brand / --primary", className: "bg-primary", note: "âmbar · ÚNICA cor de ação" },
  { token: "--brand-soft", className: "bg-ember-soft", note: "âmbar a 16% · fundos de destaque" },
  { token: "--mystic / --arcane", className: "bg-arcane", note: "violeta · véus, órbitas, Mapa" },
  { token: "--mystic-soft", className: "bg-arcane-soft", note: "violeta a 18%" },
  { token: "--text / --foreground", className: "bg-foreground", note: "branco suave, nunca puro" },
  { token: "--muted-foreground", className: "bg-muted-foreground", note: "texto de apoio" },
  { token: "--success", className: "bg-success", note: "confirmação" },
  { token: "--danger / --destructive", className: "bg-destructive", note: "destruir, sair" },
];

const TYPE_SCALE = [
  { name: "text-micro", px: "12px", use: "rótulos, contadores, meta", className: "text-micro" },
  { name: "text-small", px: "14px", use: "corpo denso, botões", className: "text-small" },
  { name: "text-body", px: "16px", use: "corpo padrão", className: "text-body" },
  { name: "text-lead", px: "20px", use: "citações, destaque", className: "text-lead" },
  { name: "text-subtitle", px: "24px", use: "título de bloco", className: "text-subtitle" },
  { name: "text-title", px: "32px", use: "título de tela", className: "text-title font-display" },
  { name: "text-hero", px: "48px", use: "pergunta-âncora", className: "text-hero font-display" },
];

const SPACE_SCALE = [4, 8, 12, 16, 24, 32, 48, 64];

const RADII = [
  { name: "rounded-sm", className: "rounded-sm", note: "8px · chips" },
  { name: "rounded-lg", className: "rounded-lg", note: "12px · botões, inputs" },
  { name: "rounded-xl", className: "rounded-xl", note: "16px · itens de lista" },
  { name: "rounded-2xl", className: "rounded-2xl", note: "20px · cards (glass)" },
  { name: "rounded-3xl", className: "rounded-3xl", note: "24px · card protagonista" },
  { name: "rounded-pill", className: "rounded-full", note: "999px · selos" },
];

const MOTION = [
  { token: "--duration-instant", value: "120ms", use: "feedback de toque (:active)" },
  { token: "--duration-fast", value: "200ms", use: "hover, cor, foco" },
  { token: "--duration-base", value: "280ms", use: "expandir, revelar" },
  { token: "--duration-slow", value: "400ms", use: "entrada de bloco, check, pop" },
  { token: "--duration-ambient", value: "6500ms", use: "respiração do título, véus" },
];

const MOODS = ["😣", "😕", "😐", "🙂", "⚡"];

function DesignSystem() {
  const [mood, setMood] = useState<number | null>(3);
  const [checked, setChecked] = useState(true);
  const [progress, setProgress] = useState(48);

  return (
    <div className="relative mx-auto max-w-3xl px-5 py-14 md:px-8">
      <header className="mb-14">
        <div className="label-arcane mb-3">Reflexo Arcano</div>
        <h1 className="font-display text-title md:text-hero">Design system</h1>
        <p className="quote-arcane mt-5 max-w-xl">
          Tecnologia arcana: grafite profundo, âmbar como única cor de ação, violeta só como véu,
          vidro quase transparente e movimento lento.
        </p>
        <p className="mt-5 text-small text-muted-foreground">
          Fonte dos tokens: <code className="text-primary">src/styles.css</code> ·{" "}
          <Link
            to="/"
            className="underline decoration-border underline-offset-4 hover:text-primary"
          >
            voltar ao início
          </Link>
        </p>
      </header>

      <Section title="Cor" caption="Âmbar pede ação. Violeta nunca aparece em botão.">
        <div className="grid gap-3 sm:grid-cols-2">
          {COLORS.map((color) => (
            <div key={color.token} className="glass flex items-center gap-4 p-3.5">
              <span
                className={`size-12 shrink-0 rounded-xl border border-border ${color.className}`}
              />
              <span className="min-w-0">
                <span className="block truncate font-mono text-micro text-primary">
                  {color.token}
                </span>
                <span className="mt-1 block text-small text-muted-foreground">{color.note}</span>
              </span>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Tipografia"
        caption="Cormorant Garamond nos títulos · Space Grotesk no corpo."
      >
        <div className="glass divide-y divide-border/60">
          {TYPE_SCALE.map((t) => (
            <div key={t.name} className="flex flex-wrap items-baseline gap-x-5 gap-y-1 px-5 py-4">
              <span className={`min-w-0 flex-1 ${t.className}`}>A mente muda de forma</span>
              <span className="font-mono text-micro text-primary">{t.name}</span>
              <span className="font-mono text-micro text-muted-foreground">{t.px}</span>
              <span className="w-full text-micro text-muted-foreground sm:w-auto">{t.use}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Espaço" caption="Escala de 4px — sem meios termos.">
        <div className="glass flex flex-wrap items-end gap-4 p-5">
          {SPACE_SCALE.map((size) => (
            <div key={size} className="flex flex-col items-center gap-2">
              <span className="bg-primary/70" style={{ width: size, height: size }} />
              <span className="font-mono text-micro text-muted-foreground">{size}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Raio & sombra" caption="Profundidade vem de glow, nunca de borda dura.">
        <div className="grid gap-3 sm:grid-cols-3">
          {RADII.map((r) => (
            <div key={r.name} className="border border-edge bg-surface/60 p-4 text-center">
              <div
                className={`mx-auto mb-3 size-12 border border-primary/40 bg-ember-soft ${r.className}`}
              />
              <div className="font-mono text-micro text-primary">{r.name}</div>
              <div className="mt-1 text-micro text-muted-foreground">{r.note}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="glass soft-glow p-5 text-center text-small">soft-glow</div>
          <div className="glass arcane-glow p-5 text-center text-small">arcane-glow</div>
          <div className="glass-strong ember-glow p-5 text-center text-small">ember-glow</div>
        </div>
      </Section>

      <Section
        title="Movimento"
        caption="Interação 200–400ms, ease-out. Ambiente 5–30s. Tudo desliga em prefers-reduced-motion."
      >
        <div className="glass divide-y divide-border/60">
          {MOTION.map((m) => (
            <div key={m.token} className="flex flex-wrap items-center gap-x-5 gap-y-1 px-5 py-3.5">
              <span className="font-mono text-micro text-primary">{m.token}</span>
              <span className="font-mono text-micro text-muted-foreground">{m.value}</span>
              <span className="w-full text-small text-muted-foreground sm:w-auto sm:flex-1">
                {m.use}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="glass-strong p-6 text-center">
            <div className="label-arcane mb-3">breathe · título que pulsa</div>
            <div className="hero-glow font-display text-subtitle">Quem você está se tornando?</div>
          </div>
          <div className="glass-strong relative grid place-items-center overflow-hidden p-6">
            <div className="label-arcane absolute left-5 top-4">orbit · ambiente</div>
            <div className="orbit-slow size-28 rounded-full border border-dashed border-border" />
            <div className="pulse-slow absolute size-16 rounded-full bg-accent/20 blur-2xl" />
            <div className="float-slow absolute size-1.5 rounded-full bg-primary shadow-[0_0_10px_var(--primary)]" />
          </div>
        </div>
      </Section>

      <Section title="Componentes" caption="Peças vivas — interaja.">
        <div className="glass-strong p-6">
          <div className="label-arcane mb-3">mood-orb · micro-animação ao escolher</div>
          <div className="grid max-w-sm grid-cols-5 gap-2.5">
            {MOODS.map((emoji, i) => (
              <button
                key={emoji}
                onClick={() => setMood(i + 1)}
                data-active={mood === i + 1}
                aria-pressed={mood === i + 1}
                className="mood-orb"
              >
                <span aria-hidden>{emoji}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="glass-strong flex items-center gap-5 p-6">
            <ProgressRing progress={progress} label={`Demo de progresso: ${progress}%`}>
              <div>
                <div className="font-display text-subtitle leading-none text-primary">
                  {roman(Math.floor(progress / 20) + 1)}
                </div>
                <div className="label-arcane mt-1.5 text-[0.55rem]">fase</div>
              </div>
            </ProgressRing>
            <div className="flex-1">
              <div className="label-arcane mb-2">progress-ring</div>
              <input
                type="range"
                min={0}
                max={100}
                value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                className="w-full accent-[var(--primary)]"
                aria-label="Progresso de demonstração"
              />
              <div className="mt-2 font-mono text-micro text-muted-foreground">{progress}%</div>
            </div>
          </div>

          <div className="glass-strong p-6">
            <div className="label-arcane mb-3">animated-check · traço desenhado</div>
            <button
              onClick={() => setChecked(!checked)}
              className="flex w-full items-center gap-3.5 rounded-xl px-3 py-3 text-left text-body transition-colors hover:bg-secondary/30"
              aria-pressed={checked}
            >
              <AnimatedCheck checked={checked} />
              <span className={checked ? "text-foreground" : "text-muted-foreground"}>
                Dormir antes das 23h
              </span>
            </button>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="chip-arcane">+70 XP</span>
              <span className="chip-muted">🔥 12 dias</span>
              <span className="chip-arcane">FASE {roman(3)}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button className="ember-glow rounded-xl bg-primary px-6 py-3 text-small font-medium text-primary-foreground transition-transform duration-[var(--duration-fast)] ease-arcane hover:scale-[1.02]">
            Ação primária
          </button>
          <button className="rounded-xl border border-primary/45 px-6 py-3 text-small text-primary transition-colors duration-[var(--duration-fast)] hover:bg-ember-soft">
            Ação secundária
          </button>
          <button className="rounded-xl border border-border px-6 py-3 text-small text-muted-foreground transition-colors duration-[var(--duration-fast)] hover:text-foreground">
            Neutro
          </button>
          <button className="rounded-xl border border-destructive/45 px-6 py-3 text-small text-destructive transition-colors duration-[var(--duration-fast)] hover:bg-destructive/10">
            Destrutivo
          </button>
        </div>
      </Section>
    </div>
  );
}

function Section({
  title,
  caption,
  children,
}: {
  title: string;
  caption: string;
  children: ReactNode;
}) {
  return (
    <section className="mb-14">
      <div className="rule-arcane mb-6 text-micro" aria-hidden>
        ✦
      </div>
      <h2 className="font-display text-subtitle">{title}</h2>
      <p className="mt-2 max-w-xl text-small text-muted-foreground">{caption}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}
