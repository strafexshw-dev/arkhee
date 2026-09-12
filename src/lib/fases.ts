/**
 * MARCOS DE FASE — quando a pessoa atravessou uma fase.
 *
 * O mapa vive no hoje: não se arrasta o tempo pela tela. A viagem no tempo é
 * uma recompensa — só quem passou de fase ganha o direito de comparar os
 * mapas. Os marcos saem da própria trilha de XP: cada vez que o acumulado
 * cruza um nível, uma fase ficou para trás.
 */
import { levelFromXp } from "@/lib/arcano";

export type EventoXp = { amount: number; created_at: string | null };

/** Datas (crescentes) em que o acumulado de XP cruzou um nível. */
export function marcosDeNivel(eventos: EventoXp[]): string[] {
  const comData = eventos.filter(
    (e): e is { amount: number; created_at: string } => !!e.created_at,
  );
  const ordenados = [...comData].sort((a, b) => a.created_at.localeCompare(b.created_at));

  const marcos: string[] = [];
  let acumulado = 0;
  let nivel = levelFromXp(0).level;

  for (const evento of ordenados) {
    acumulado += evento.amount;
    const novo = levelFromXp(acumulado).level;
    if (novo > nivel) {
      nivel = novo;
      marcos.push(evento.created_at);
    }
  }
  return marcos;
}

export type MarcoComparacao = {
  /** passou de fase ao menos uma vez? sem isso, a comparação fica trancada */
  passou: boolean;
  /** início da última fase concluída — o "antes" da comparação */
  marco: string | null;
  /** todas as passagens de fase, para contar a história */
  marcos: string[];
};

/**
 * O "antes" da comparação é o início da última fase concluída: é o mapa que
 * a pessoa trouxe para a travessia. Com uma passagem só, compara-se desde o
 * começo da jornada — a fase inteira que ficou para trás.
 */
export function marcoDaComparacao(
  eventos: EventoXp[],
  inicioDaJornada: string | null,
): MarcoComparacao {
  const marcos = marcosDeNivel(eventos);
  if (marcos.length === 0) return { passou: false, marco: null, marcos };

  const marco =
    marcos.length >= 2 ? (marcos[marcos.length - 2] ?? null) : (inicioDaJornada ?? marcos[0]!);
  return { passou: true, marco, marcos };
}
