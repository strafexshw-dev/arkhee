/**
 * Formato de uma rota neural (o exercício A → B → C → D do Mapa).
 * Mora aqui para os componentes ficarem só com componentes.
 *
 * Uma rota é gravada em `thought_patterns` — nenhuma coluna nova foi
 * necessária: o schema original já descrevia o caminho antigo e o novo.
 */
export type RotaDraft = {
  /** id de um thought_patterns existente, ou null para rota nova */
  id: string | null;
  name: string;
  /* A · caminho antigo */
  trigger_text: string;
  thought: string;
  emotion: string;
  old_response: string;
  old_result: string;
  /* B/C · caminho novo */
  new_thought: string;
  new_action: string;
  /* D · evidência */
  new_evidence: string;
};

export const ROTA_VAZIA: RotaDraft = {
  id: null,
  name: "",
  trigger_text: "",
  thought: "",
  emotion: "",
  old_response: "",
  old_result: "",
  new_thought: "",
  new_action: "",
  new_evidence: "",
};

/** Prompt usado no diário quando uma rota ganha evidência. */
export function promptEvidencia(nomeRota: string) {
  return `Evidência da rota: ${nomeRota}`;
}
