import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Compass, Brain, Network, Route as RouteIcon, Sparkles } from "lucide-react";

const NAV = [
  { to: "/hoje", label: "Hoje", icon: Compass },
  { to: "/reprogramar", label: "Reprogramar", icon: Brain },
  { to: "/mapa", label: "Mapa", icon: Network },
  { to: "/jornada", label: "Jornada", icon: RouteIcon },
  { to: "/eu-futuro", label: "Eu Futuro", icon: Sparkles },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen md:flex">
      <aside className="hidden w-60 shrink-0 border-r border-border/60 p-6 md:block">
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
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  active
                    ? "bg-arcane-soft text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="size-4" strokeWidth={1.5} />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="mx-auto w-full max-w-2xl px-5 pb-28 pt-8 md:max-w-3xl md:pb-16">
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
                className={`flex flex-1 flex-col items-center gap-1 py-3 text-[0.62rem] tracking-wide transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
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

export function PageTitle({ kicker, title, quote }: { kicker?: string; title: string; quote?: string }) {
  return (
    <header className="mb-8">
      {kicker && <div className="label-arcane mb-2">{kicker}</div>}
      <h1 className="font-display text-4xl leading-tight">{title}</h1>
      {quote && <p className="quote-arcane mt-4 max-w-lg">{quote}</p>}
    </header>
  );
}
