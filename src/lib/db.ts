/**
 * Ponto único de acesso a dados do app.
 *
 * Com o modo demo desligado (padrão) ele é exatamente o cliente Supabase real.
 * Com o modo demo ligado ele devolve um cliente local com dados de exemplo,
 * sem tocar no banco de produção — útil para navegar pelas telas sem conta.
 *
 * As telas importam assim: `import { db as supabase } from "@/lib/db";`
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { supabase as realSupabase } from "@/integrations/supabase/client";
import { demoClient } from "@/lib/demo/client";
import { enterDemo, exitDemo, isDemoActive, resetDemoData } from "@/lib/demo/store";

export { isDemoActive, enterDemo, exitDemo, resetDemoData };

type Client = SupabaseClient<Database>;

function activeClient(): unknown {
  return isDemoActive() ? demoClient : realSupabase;
}

export const db = new Proxy({} as Client, {
  get(_target, prop) {
    const client = activeClient();
    const value = (client as Record<PropertyKey, unknown>)[prop];
    return typeof value === "function"
      ? (value as (...args: unknown[]) => unknown).bind(client)
      : value;
  },
});

/** Liga o modo demo e recarrega já dentro do app. */
export function startDemo(): void {
  enterDemo();
  window.location.href = "/hoje";
}

/** Desliga o modo demo e volta para a tela de entrada. */
export function stopDemo(): void {
  exitDemo();
  window.location.href = "/auth";
}

/** Restaura os dados de exemplo (mantém o modo demo ligado). */
export function restartDemo(): void {
  resetDemoData();
  window.location.reload();
}
