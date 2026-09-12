/**
 * MAPA — estados de consciência.
 *
 * A cor de um nó não mede sucesso: mede o quanto ele já foi visto. É a
 * metáfora do cinzelamento — a peça começa pedra bruta e vai sendo revelada.
 *
 * Tudo aqui é DERIVADO das colunas que já existem em thought_patterns e
 * journal_entries. Nenhuma migração é necessária para o mapa funcionar; a
 * proposta de schema dedicado está em supabase/propostas/mapa-como-dado.sql.
 */

import { NOTAS, notaPara, type Nota } from "@/lib/sabedoria";
import { promptEvidencia } from "@/lib/rota";

export type Stage = "unmapped" | "noticed" | "rupture" | "reprogrammed" | "integrated";

export type StageInfo = {
  id: Stage;
  nome: string;
  fase: string;
  /** variável CSS com a cor do estágio */
  cor: string;
  /** diâmetro do nó em px */
  tamanho: number;
  /** intensidade do glow, 0..1 */
  glow: number;
  ordem: number;
  resumo: string;
};

export const STAGES: Record<Stage, StageInfo> = {
  unmapped: {
    id: "unmapped",
    nome: "Não mapeado",
    fase: "antes da Fase I",
    cor: "var(--stage-unmapped)",
    tamanho: 8,
    glow: 0,
    ordem: 0,
    resumo: "Pedra bruta. Você ainda não viu isso em si.",
  },
  noticed: {
    id: "noticed",
    nome: "Notado",
    fase: "Fase I · O Observador",
    cor: "var(--stage-noticed)",
    tamanho: 9,
    glow: 0.28,
    ordem: 1,
    resumo: "O padrão foi identificado. Já saiu da pedra.",
  },
  rupture: {
    id: "rupture",
    nome: "Em ruptura",
    fase: "Fase II · A Ruptura",
    cor: "var(--stage-rupture)",
    tamanho: 10,
    glow: 0.55,
    ordem: 2,
    resumo: "Você interrompeu a resposta automática e escreveu a intervenção.",
  },
  reprogrammed: {
    id: "reprogrammed",
    nome: "Reprogramado",
    fase: "Fase III · Reprogramação",
    cor: "var(--stage-reprogrammed)",
    tamanho: 12,
    glow: 0.78,
    ordem: 3,
    resumo: "Uma resposta nova foi escolhida e testada.",
  },
  integrated: {
    id: "integrated",
    nome: "Integrado",
    fase: "Fase IV/V · Identidade",
    cor: "var(--stage-integrated)",
    tamanho: 14,
    glow: 1,
    ordem: 4,
    resumo: "Existe evidência de que você agiu diferente. Isso já é identidade.",
  },
};

export const ORDEM_STAGES: Stage[] = [
  "unmapped",
  "noticed",
  "rupture",
  "reprogrammed",
  "integrated",
];

export type PadraoMapa = {
  id: string;
  name: string;
  created_at: string | null;
  trigger_text: string | null;
  thought: string | null;
  emotion: string | null;
  old_response: string | null;
  old_result: string | null;
  new_thought: string | null;
  new_action: string | null;
  new_evidence: string | null;
};

export type EvidenciaDiario = { prompt: string | null; created_at: string | null };

/** Arquétipo da biblioteca ligado a um padrão (por prefixo do nome ou léxico). */
export function arquetipoDe(p: {
  name: string;
  trigger_text?: string | null;
  thought?: string | null;
  emotion?: string | null;
  old_response?: string | null;
}): Nota | null {
  const peloNome = NOTAS.find((nota) => p.name.startsWith(nota.nome));
  if (peloNome) return peloNome;
  return notaPara(
    `${p.name} ${p.trigger_text ?? ""} ${p.thought ?? ""} ${p.emotion ?? ""} ${p.old_response ?? ""}`,
  );
}

/** Evidências de rota registradas no diário para este padrão (até `ate`, opcional). */
export function evidenciasDe(p: PadraoMapa, diario: EvidenciaDiario[], ate?: Date | null): number {
  const chave = promptEvidencia(p.name);
  const limite = ate ? ate.toISOString() : null;
  const doDiario = diario.filter(
    (e) => e.prompt === chave && (!limite || !e.created_at || e.created_at <= limite),
  ).length;
  const daRota = p.new_evidence ? 1 : 0;
  return doDiario + daRota;
}

/** Estágio derivado — sem coluna nova no banco. */
export function stageDe(p: PadraoMapa, evidencias: number): Stage {
  if (evidencias > 0) return "integrated";
  if (p.new_action) return "reprogrammed";
  if (p.new_thought) return "rupture";
  return "noticed";
}

export type NoPadrao = {
  id: string;
  label: string;
  stage: Stage;
  controle: "interno" | "externo";
  evidencias: number;
  emRota: boolean;
  arquetipo: Nota | null;
};

/**
 * Estado do mapa hoje, ou reconstruído em `ate`.
 *
 * A reconstrução usa o que tem data: a criação do padrão e os registros do
 * diário. Os campos do caminho novo não têm data própria, então valem a partir
 * da criação da rota — é uma aproximação honesta, não um histórico exato
 * (para isso existe a proposta de tabela pattern_events).
 */
export function estadoDoMapa(
  padroes: PadraoMapa[],
  diario: EvidenciaDiario[],
  ate?: Date | null,
): NoPadrao[] {
  const limite = ate ? ate.toISOString() : null;

  return padroes
    .filter((p) => !limite || !p.created_at || p.created_at <= limite)
    .map((p) => {
      const nota = arquetipoDe(p);
      const evidencias = evidenciasDe(p, diario, ate);
      return {
        id: p.id,
        label: p.name,
        stage: stageDe(p, evidencias),
        controle: nota?.controle ?? "interno",
        evidencias,
        emRota: !!p.new_action,
        arquetipo: nota,
      };
    });
}

/** Arquétipos da biblioteca que a pessoa ainda não mapeou (pedra bruta). */
export function arquetiposLivres(padroes: PadraoMapa[]): Nota[] {
  const usados = new Set(padroes.map((p) => arquetipoDe(p)?.id).filter(Boolean));
  return NOTAS.filter((nota) => !usados.has(nota.id));
}
