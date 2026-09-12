/**
 * Modo demo — banco local em memória (persistido em localStorage).
 *
 * Nada aqui toca o Supabase real: os dados são de exemplo e ficam só no
 * navegador de quem ativou o modo demo. Serve para navegar pelas 5 telas
 * sem criar conta e sem gravar nada no banco de produção.
 */

export const DEMO_FLAG_KEY = "arcano.demo";
export const DEMO_DATA_KEY = "arcano.demo.data";
export const DEMO_DATA_VERSION = 1;

export const DEMO_USER_ID = "demo-0000-4000-8000-000000000001";
export const DEMO_USER_EMAIL = "demo@reflexoarcano.app";
export const DEMO_USER_NAME = "Visitante";

export type DemoRow = Record<string, unknown>;
export type DemoData = Record<string, DemoRow[]>;

function storage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** O modo demo só existe no navegador — no servidor ele está sempre desligado. */
export function isDemoActive(): boolean {
  return storage()?.getItem(DEMO_FLAG_KEY) === "1";
}

export function enterDemo(): void {
  const store = storage();
  if (!store) return;
  store.setItem(DEMO_FLAG_KEY, "1");
  store.removeItem(DEMO_DATA_KEY);
  cache = null;
}

export function exitDemo(): void {
  const store = storage();
  if (!store) return;
  store.removeItem(DEMO_FLAG_KEY);
  store.removeItem(DEMO_DATA_KEY);
  cache = null;
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function daysAgoISO(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
}

function hoursAgoISO(hours: number): string {
  return new Date(Date.now() - hours * 3_600_000).toISOString();
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `demo-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

export { newId };

/* ------------------------------------------------------------------ */
/* Dados de exemplo                                                    */
/* ------------------------------------------------------------------ */

const MISSIONS: DemoRow[] = [
  {
    id: "demo-mission-1",
    title: "O primeiro olhar",
    prompt:
      "Observe um pensamento automático que apareceu hoje e escreva o que você normalmente faria por causa dele.",
    phase: 1,
    order_index: 1,
    xp: 50,
  },
  {
    id: "demo-mission-2",
    title: "Rastrear o gatilho",
    prompt:
      "Qual situação de hoje disparou uma reação forte? Descreva o momento exato antes da reação.",
    phase: 1,
    order_index: 2,
    xp: 50,
  },
  {
    id: "demo-mission-3",
    title: "A pausa",
    prompt:
      "Hoje, ao sentir o impulso automático, espere 60 segundos. Escreva o que mudou nesse intervalo.",
    phase: 2,
    order_index: 3,
    xp: 60,
  },
  {
    id: "demo-mission-4",
    title: "Resposta nova",
    prompt:
      "Escolha um padrão conhecido e execute a resposta oposta uma única vez. Registre o resultado.",
    phase: 3,
    order_index: 4,
    xp: 70,
  },
  {
    id: "demo-mission-5",
    title: "Coletar evidência",
    prompt:
      "Escreva três provas concretas de que você já não é a mesma pessoa de três meses atrás.",
    phase: 4,
    order_index: 5,
    xp: 80,
  },
  {
    id: "demo-mission-6",
    title: "Sem esforço",
    prompt: "Que comportamento novo já está acontecendo sem você precisar se convencer?",
    phase: 5,
    order_index: 6,
    xp: 90,
  },
];

const TRAITS = [
  { id: "demo-trait-1", name: "Disciplinada" },
  { id: "demo-trait-2", name: "Confiante" },
  { id: "demo-trait-3", name: "Calma" },
];

const HABITS = [
  { id: "demo-habit-1", title: "Treinar", trait_id: "demo-trait-1" },
  { id: "demo-habit-2", title: "Ler 10 minutos", trait_id: "demo-trait-1" },
  { id: "demo-habit-3", title: "Meditar", trait_id: "demo-trait-3" },
  { id: "demo-habit-4", title: "Dormir antes das 23h", trait_id: "demo-trait-2" },
];

/** Hábitos marcados por dia (índice = dias atrás). Hoje fica vazio de propósito. */
const HABIT_PATTERN: Record<number, number[]> = {
  1: [0, 2],
  2: [0, 1, 2, 3],
  3: [0, 2, 3],
  4: [1, 2],
  5: [0, 1, 2, 3],
  6: [0, 2],
  7: [1, 3],
  8: [0, 1, 2],
  9: [2, 3],
  10: [0, 1],
  11: [0, 2, 3],
  12: [1, 2],
  13: [0, 1, 2, 3],
  14: [0, 3],
};

const MOOD_PATTERN: Record<number, number> = {
  1: 4,
  2: 3,
  3: 3,
  4: 2,
  5: 4,
  6: 3,
  7: 1,
  8: 3,
  9: 4,
};

function seed(): DemoData {
  const habitLogs: DemoRow[] = [];
  for (const [day, habitIndexes] of Object.entries(HABIT_PATTERN)) {
    const doneOn = daysAgoISO(Number(day));
    for (const index of habitIndexes) {
      const habit = HABITS[index];
      if (!habit) continue;
      habitLogs.push({
        id: newId(),
        user_id: DEMO_USER_ID,
        habit_id: habit.id,
        done_on: doneOn,
        created_at: `${doneOn}T21:30:00.000Z`,
      });
    }
  }

  const checkins: DemoRow[] = Object.entries(MOOD_PATTERN).map(([day, mood]) => {
    const date = daysAgoISO(Number(day));
    return {
      id: newId(),
      user_id: DEMO_USER_ID,
      day: date,
      mood,
      note: null,
      created_at: `${date}T12:00:00.000Z`,
    };
  });

  const completions: DemoRow[] = [1, 2, 3, 4].map((day, i) => ({
    id: newId(),
    user_id: DEMO_USER_ID,
    mission_id: `demo-mission-${i + 1}`,
    response: "Registro de exemplo gerado pelo modo demo.",
    day: daysAgoISO(day),
    created_at: hoursAgoISO(day * 24),
  }));

  const xpEvents: DemoRow[] = [
    { amount: 20, reason: "evidência: Treinar", hours: 26 },
    { amount: 10, reason: "check-in mental", hours: 26 },
    { amount: 70, reason: "missão: Resposta nova", hours: 50 },
    { amount: 20, reason: "evidência: Meditar", hours: 50 },
    { amount: 40, reason: "crença mapeada", hours: 74 },
    { amount: 60, reason: "padrão mapeado", hours: 98 },
  ].map((e) => ({
    id: newId(),
    user_id: DEMO_USER_ID,
    amount: e.amount,
    reason: e.reason,
    created_at: hoursAgoISO(e.hours),
  }));

  return {
    profiles: [
      {
        id: DEMO_USER_ID,
        display_name: DEMO_USER_NAME,
        focus_area: "Autoconfiança",
        xp: 1240,
        level: 3,
        streak: 12,
        last_active_date: daysAgoISO(1),
        onboarding_completed: true,
        created_at: hoursAgoISO(24 * 40),
      },
    ],
    future_identities: [
      {
        id: "demo-identity-1",
        user_id: DEMO_USER_ID,
        name: "Eu Futuro",
        description: "Autoconfiança",
        created_at: hoursAgoISO(24 * 40),
      },
    ],
    identity_traits: TRAITS.map((t, i) => ({
      id: t.id,
      user_id: DEMO_USER_ID,
      identity_id: "demo-identity-1",
      name: t.name,
      evidence_count: 0,
      progress: 0,
      created_at: hoursAgoISO(24 * 39 - i),
    })),
    habits: HABITS.map((h, i) => ({
      id: h.id,
      user_id: DEMO_USER_ID,
      title: h.title,
      trait_id: h.trait_id,
      active: true,
      created_at: hoursAgoISO(24 * 38 - i),
    })),
    habit_logs: habitLogs,
    mental_checkins: checkins,
    missions: MISSIONS,
    mission_completions: completions,
    xp_events: xpEvents,
    beliefs: [
      {
        id: newId(),
        user_id: DEMO_USER_ID,
        content: "Se eu não fizer perfeito, não vale a pena começar.",
        origin: "Cobrança na escola",
        new_belief: "Feito é o que ensina. Perfeito é o que paralisa.",
        created_at: hoursAgoISO(74),
      },
      {
        id: newId(),
        user_id: DEMO_USER_ID,
        content: "As pessoas percebem quando eu estou insegura.",
        origin: "Uma apresentação que deu errado",
        new_belief: "Ninguém está me analisando tanto quanto eu mesma.",
        created_at: hoursAgoISO(30),
      },
    ],
    thought_patterns: [
      {
        id: "demo-pattern-1",
        user_id: DEMO_USER_ID,
        name: "Medo de julgamento",
        trigger_text: "Reunião em que preciso falar",
        thought: "Vão perceber que eu não sei o suficiente",
        emotion: "Ansiedade",
        old_response: "Ficar em silêncio e me criticar depois",
        old_result: "Reforço a ideia de que não sou capaz",
        new_thought: "Eu tenho uma contribuição útil, mesmo que imperfeita",
        new_action: "Falar primeiro nos 10 minutos iniciais",
        new_evidence: "Falei na terça e ninguém questionou",
        created_at: hoursAgoISO(98),
      },
      {
        id: "demo-pattern-2",
        user_id: DEMO_USER_ID,
        name: "Procrastinação · projeto novo",
        trigger_text: "Começar um projeto novo",
        thought: "Preciso ter tudo planejado antes de iniciar",
        emotion: "Paralisia",
        old_response: "Adiar e abrir outra aba",
        old_result: "Nada sai e a culpa aumenta",
        new_thought: "A primeira versão existe para ser revisada",
        new_action: "Trabalhar 15 minutos sem editar nada",
        new_evidence: null,
        created_at: hoursAgoISO(40),
      },
      {
        id: "demo-pattern-3",
        user_id: DEMO_USER_ID,
        name: "Necessidade de aprovação · publicar",
        trigger_text: "Terminar algo e pensar em mostrar",
        thought: "Se não gostarem, é porque eu não sou boa",
        emotion: "Vergonha antecipada",
        old_response: "Guardar o trabalho e não publicar",
        old_result: "Ninguém vê e eu continuo sem prova",
        new_thought: null,
        new_action: null,
        new_evidence: null,
        created_at: hoursAgoISO(16),
      },
    ],
    journal_entries: [
      {
        id: newId(),
        user_id: DEMO_USER_ID,
        prompt: "Evidência da rota: Medo de julgamento",
        content: "Falei nos primeiros dez minutos da reunião. Ninguém questionou — e eu sobrevivi.",
        created_at: hoursAgoISO(70),
      },
      {
        id: newId(),
        user_id: DEMO_USER_ID,
        prompt: "Reflexão livre",
        content: "Hoje percebi que eu me preparo demais para conversas que nunca acontecem.",
        created_at: hoursAgoISO(20),
      },
      {
        id: newId(),
        user_id: DEMO_USER_ID,
        prompt: "Escolha um padrão conhecido e execute a resposta oposta uma única vez.",
        content: "Respondi na reunião em vez de esperar o fim. Fui ouvida.",
        created_at: hoursAgoISO(50),
      },
    ],
  };
}

/* ------------------------------------------------------------------ */
/* Persistência                                                        */
/* ------------------------------------------------------------------ */

let cache: DemoData | null = null;

export function getStore(): DemoData {
  if (cache) return cache;

  const raw = storage()?.getItem(DEMO_DATA_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as { version?: number; tables?: DemoData };
      if (parsed.version === DEMO_DATA_VERSION && parsed.tables) {
        cache = parsed.tables;
        return cache;
      }
    } catch {
      // dados corrompidos: recria do zero
    }
  }

  cache = seed();
  persist();
  return cache;
}

export function persist(): void {
  if (!cache) return;
  try {
    storage()?.setItem(
      DEMO_DATA_KEY,
      JSON.stringify({ version: DEMO_DATA_VERSION, tables: cache }),
    );
  } catch {
    // sem localStorage (modo privado): segue só em memória
  }
}

/** Restaura os dados de exemplo sem sair do modo demo. */
export function resetDemoData(): void {
  cache = seed();
  persist();
}

/** Lista de linhas de uma tabela, criando-a se não existir. */
export function tableRows(name: string): DemoRow[] {
  const store = getStore();
  const existing = store[name];
  if (existing) return existing;
  const created: DemoRow[] = [];
  store[name] = created;
  return created;
}

/* ------------------------------------------------------------------ */
/* Regras de banco simuladas (defaults + unicidade)                     */
/* ------------------------------------------------------------------ */

const TABLE_DEFAULTS: Record<string, DemoRow | (() => DemoRow)> = {
  profiles: () => ({
    display_name: null,
    focus_area: null,
    xp: 0,
    level: 1,
    streak: 0,
    last_active_date: null,
    onboarding_completed: false,
  }),
  future_identities: { description: null },
  identity_traits: { identity_id: null, evidence_count: 0, progress: 0 },
  habits: { trait_id: null, active: true },
  habit_logs: () => ({ done_on: todayISO() }),
  mental_checkins: () => ({ day: todayISO(), note: null }),
  missions: { phase: 1, order_index: 0, xp: 50 },
  mission_completions: () => ({ day: todayISO(), response: null }),
  beliefs: { origin: null, new_belief: null },
  thought_patterns: {
    trigger_text: null,
    thought: null,
    emotion: null,
    old_response: null,
    old_result: null,
    new_thought: null,
    new_action: null,
    new_evidence: null,
  },
  journal_entries: { prompt: null },
};

const UNIQUE_KEYS: Record<string, string[][]> = {
  profiles: [["id"]],
  habit_logs: [["habit_id", "done_on"]],
  mental_checkins: [["user_id", "day"]],
  mission_completions: [["user_id", "mission_id", "day"]],
};

export function buildRow(table: string, payload: DemoRow): DemoRow {
  const defaults = TABLE_DEFAULTS[table];
  const base = typeof defaults === "function" ? defaults() : { ...defaults };
  return {
    ...base,
    id: newId(),
    created_at: new Date().toISOString(),
    ...payload,
  };
}

export function isDuplicate(table: string, row: DemoRow): boolean {
  const groups = UNIQUE_KEYS[table] ?? [];
  const rows = tableRows(table);
  return groups.some((keys) =>
    rows.some((existing) => keys.every((key) => existing[key] === row[key])),
  );
}
