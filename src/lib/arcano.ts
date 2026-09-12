import { useEffect, useState } from "react";
import { db as supabase } from "@/lib/db";
import type { Session } from "@supabase/supabase-js";

export const XP_PER_LEVEL = 500;

export const PHASES = [
  {
    n: "FASE I",
    name: "O OBSERVADOR",
    quote: "Você não pode mudar um padrão que ainda não consegue enxergar.",
    goal: "Identificar padrões.",
  },
  {
    n: "FASE II",
    name: "A RUPTURA",
    quote: "Entre o estímulo e a resposta existe um espaço.",
    goal: "Interromper respostas automáticas.",
  },
  {
    n: "FASE III",
    name: "REPROGRAMAÇÃO",
    quote: "Uma resposta nova precisa ser experimentada, não compreendida.",
    goal: "Experimentar novas respostas.",
  },
  {
    n: "FASE IV",
    name: "IDENTIDADE",
    quote: "Cada ação é um voto na pessoa que você está se tornando.",
    goal: "Acumular evidências da nova identidade.",
  },
  {
    n: "FASE V",
    name: "INTEGRAÇÃO",
    quote: "O que exigia esforço agora apenas acontece.",
    goal: "O comportamento deixa de exigir esforço consciente.",
  },
];

export function levelFromXp(xp: number) {
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const progress = Math.round(((xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100);
  return { level, progress };
}

export function levelName(level: number) {
  return PHASES[Math.min(level - 1, PHASES.length - 1)]!.name;
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Boa madrugada";
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, loading, user: session?.user ?? null };
}

export async function grantXp(userId: string, amount: number, reason: string) {
  await supabase.from("xp_events").insert({ user_id: userId, amount, reason });
  const { data: profile } = await supabase
    .from("profiles")
    .select("xp, streak, last_active_date")
    .eq("id", userId)
    .maybeSingle();

  const xp = (profile?.xp ?? 0) + amount;
  const { level } = levelFromXp(xp);

  const t = today();
  let streak = profile?.streak ?? 0;
  if (profile?.last_active_date !== t) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    streak = profile?.last_active_date === yesterday ? streak + 1 : 1;
  }

  await supabase
    .from("profiles")
    .update({ xp, level, streak, last_active_date: t })
    .eq("id", userId);
}
