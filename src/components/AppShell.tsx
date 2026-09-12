import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Compass, Brain, Network, Route as RouteIcon, Sparkles, Hourglass } from "lucide-react";
import { AmbientField } from "@/components/AmbientField";

const NAV = [
  { to: "/hoje", label: "Hoje", icon: Compass },
  { to: "/reprogramar", label: "Reprogramar", icon: Brain },
  { to: "/mapa", label: "Mapa", icon: Network },
  { to: "/comparacao", label: "Comparar", icon: Hourglass },
  { to: "/jornada", label: "Jornada", icon: RouteIcon },
  { to: "/eu-futuro", label: "Eu Futuro", icon: Sparkles },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="relative min-h-screen md:flex">
      <AmbientField />

      <aside className="relative z-10 hidden w-60 shrink-0 border-r border-border/60 p-6 md:block">
        <div className="mb-10">
          <div className="label-arcane">Reflexo</div>
          <div className="font-display text-2xl gradient-text">Arcano</div>
        </div>
        <nav className="space-y-1">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-small transition-all duration-[var(--duration-fast)] ease-arcane ${
                  active
                    ? "bg-ember-soft text-foreground shadow-[inset_0_1px_0_0_oklch(1_0_0/5%)]"
                    : "text-muted-foreground hover:bg-secondary/35 hover:text-foreground"
                }`}
              >
                <Icon className={`size-4 ${active ? "text-primary" : ""}`} strokeWidth={1.5} />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="relative z-10 mx-auto w-full max-w-2xl px-5 pb-28 pt-8 md:max-w-3xl md:pb-16">
        {children}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/85 backdrop-blur-xl md:hidden">
        <div className="flex">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`relative flex flex-1 flex-col items-center gap-1 py-3 text-[0.62rem] tracking-wide transition-colors duration-[var(--duration-fast)] ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {active && (
                  <span
                    className="absolute inset-x-5 top-0 h-px bg-primary/70 blur-[1px]"
                    aria-hidden
                  />
                )}
                <Icon className="size-[18px]" strokeWidth={1.5} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export function PageTitle({
  kicker,
  title,
  quote,
}: {
  kicker?: string;
  title: string;
  quote?: string;
}) {
  return (
    <header className="rise-in mb-9">
      {kicker && <div className="label-arcane mb-2.5">{kicker}</div>}
      <h1 className="font-display text-title leading-tight">{title}</h1>
      {quote && <p className="quote-arcane mt-4 max-w-lg">{quote}</p>}
      <div className="rule-arcane mt-6 max-w-24 text-micro" aria-hidden>
        ✦
      </div>
    </header>
  );
}
