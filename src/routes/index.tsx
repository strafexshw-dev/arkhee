import { createFileRoute, Link } from "@tanstack/react-router";
import { startDemo } from "@/lib/db";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Reflexo Arcano — treine a versão nova de você" },
      {
        name: "description",
        content:
          "Reflexo Arcano é um app de reprogramação mental: check-in do estado mental, missões diárias, evidências de identidade e um mapa dos seus padrões.",
      },
      { property: "og:title", content: "Reflexo Arcano — treine a versão nova de você" },
      {
        property: "og:description",
        content:
          "Check-in mental, missões, hábitos como evidência de identidade e um mapa visual dos seus padrões.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="orbit-slow size-[520px] rounded-full border border-border/50" />
        <div className="orbit-slower absolute size-[420px] rounded-full border border-dashed border-accent/15" />
        <div className="pulse-slow absolute size-[340px] rounded-full border border-primary/20" />
        <div className="absolute size-[180px] rounded-full border border-accent/25" />
        <div className="pulse-slow absolute size-[620px] rounded-full bg-accent/8 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-xl text-center">
        <div className="label-arcane mb-4">Reflexo Arcano</div>
        <h1 className="hero-glow font-display text-title leading-[1.08] md:text-hero">
          Você não chegou aqui
          <br />
          para criar <span className="ember-text">hábitos</span>.
        </h1>
        <div className="rule-arcane mx-auto mt-7 max-w-28 text-micro" aria-hidden>
          ✦
        </div>
        <p className="quote-arcane mx-auto mt-6 max-w-md">
          Você chegou porque existe uma versão sua que ainda aparece pouco. Vamos encontrá-la.
        </p>
        <div className="mt-10 flex flex-col items-center gap-4">
          <Link
            to="/auth"
            className="ember-glow inline-flex items-center justify-center rounded-pill bg-primary px-8 py-3 text-small font-medium tracking-wide text-primary-foreground transition-transform duration-[var(--duration-fast)] ease-arcane hover:scale-[1.02]"
          >
            Começar
          </Link>
          <button
            onClick={startDemo}
            className="text-micro tracking-wide text-muted-foreground underline decoration-border underline-offset-4 transition-colors duration-[var(--duration-fast)] hover:text-primary"
          >
            ou explorar em modo demo
          </button>
        </div>
      </div>

      <footer className="absolute inset-x-0 bottom-0 z-10 pb-6 text-center">
        <Link
          to="/design"
          className="text-micro tracking-[0.2em] text-muted-foreground/70 uppercase transition-colors duration-[var(--duration-fast)] hover:text-primary"
        >
          design system
        </Link>
      </footer>
    </div>
  );
}
