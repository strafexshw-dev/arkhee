import { useEffect, useState } from "react";
import { isDemoActive, restartDemo, stopDemo } from "@/lib/db";

/**
 * Barra que aparece só quando o modo demo está ligado.
 * Renderizada no root, então vale para todas as telas.
 */
export function DemoBar() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(isDemoActive());
  }, []);

  if (!active) return null;

  return (
    <div className="sticky top-0 z-50 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-primary/25 bg-background/92 px-4 py-2 backdrop-blur-xl">
      <span className="label-arcane">✦ Modo demo</span>
      <span className="hidden text-[0.7rem] text-muted-foreground sm:inline">
        dados de exemplo no seu navegador — nada é gravado no banco real
      </span>
      <span className="flex items-center gap-2">
        <button
          onClick={restartDemo}
          className="rounded-full border border-border px-3 py-1 text-[0.68rem] text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
        >
          Reiniciar dados
        </button>
        <button
          onClick={stopDemo}
          className="rounded-full border border-primary/40 px-3 py-1 text-[0.68rem] text-primary transition-colors hover:bg-ember-soft"
        >
          Sair do demo
        </button>
      </span>
    </div>
  );
}
