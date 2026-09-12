import { createFileRoute, Link } from "@tanstack/react-router";

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
        <div className="absolute size-[340px] rounded-full border border-primary/20 pulse-slow" />
        <div className="absolute size-[180px] rounded-full border border-accent/25" />
      </div>

      <div className="relative z-10 max-w-xl text-center">
        <div className="label-arcane mb-4">Reflexo Arcano</div>
        <h1 className="font-display text-5xl leading-[1.05] md:text-6xl">
          Você não chegou aqui
          <br />
          para criar <span className="gradient-text">hábitos</span>.
        </h1>
        <p className="quote-arcane mx-auto mt-6 max-w-md">
          Você chegou porque existe uma versão sua que ainda aparece pouco. Vamos encontrá-la.
        </p>
        <Link
          to="/auth"
          className="ember-glow mt-10 inline-flex items-center justify-center rounded-full bg-primary px-8 py-3 text-sm font-medium tracking-wide text-primary-foreground transition-transform hover:scale-[1.02]"
        >
          Começar
        </Link>
      </div>
    </div>
  );
}
