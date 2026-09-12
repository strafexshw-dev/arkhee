/**
 * PROVAS — evidência que o corpo assina.
 *
 * Descrever o que aconteceu é bom; mostrar enquanto acontece é outra coisa.
 * Uma prova física é verificada no navegador, em dois níveis:
 *
 *   1. `pose`     — MoveNet (tfjs) estima o esqueleto e a contagem segue a
 *                   oscilação vertical dos ombros;
 *   2. `movimento` — sem rede para o modelo, cai para diferença de quadros:
 *                   o centroide vertical do movimento oscila do mesmo jeito.
 *
 * Nos dois casos a contagem é um ciclo completo (descer e voltar) com
 * histerese e janela de tempo: acenar para a câmera não conta flexão.
 * O método e a presença registrados vão junto no diário — a evidência diz
 * como foi verificada, não apenas que aconteceu.
 */

export type ProvaCorpo = {
  id: string;
  nome: string;
  meta: number;
  /** como posicionar a câmera para a contagem confiar */
  posicionamento: string;
  /** banda mínima de histerese, em fração da altura do quadro */
  bandaMinima: number;
};

export const PROVAS_CORPO: ProvaCorpo[] = [
  {
    id: "flexoes",
    nome: "Flexões",
    meta: 10,
    posicionamento: "Câmera de lado ou na frente, corpo inteiro no quadro.",
    bandaMinima: 0.05,
  },
  {
    id: "agachamentos",
    nome: "Agachamentos",
    meta: 15,
    posicionamento: "Câmera na frente, de pé, corpo inteiro no quadro.",
    bandaMinima: 0.06,
  },
  {
    id: "polichinelos",
    nome: "Polichinelos",
    meta: 20,
    posicionamento: "Câmera na frente, dois passos de distância.",
    bandaMinima: 0.05,
  },
];

export type MetodoProva = "pose" | "movimento";

export type ResultadoProva = {
  provaId: string;
  reps: number;
  segundos: number;
  metodo: MetodoProva;
  /** fração de quadros com sinal válido durante a contagem (0..1) */
  presenca: number;
};

/** Texto que vai para o diário: a evidência declara o próprio método. */
export function resumoProva(prova: ProvaCorpo, r: ResultadoProva): string {
  const metodo =
    r.metodo === "pose"
      ? "verificação por pose (esqueleto estimado no navegador)"
      : "verificação por movimento (diferença de quadros, no navegador)";
  const presenca = Math.round(r.presenca * 100);
  return `Prova física: ${r.reps} ${prova.nome.toLowerCase()} em ${r.segundos}s — ${metodo}, presença ${presenca}% do tempo.`;
}

/* ── contador de ciclos: puro, sem DOM, testável ─────────────────────────── */

export type ContadorReps = {
  reps: number;
  /** sinal está na fase alta (corpo descido) */
  alta: boolean;
  /** referência da última inversão */
  ref: number;
  banda: number;
  /** menor e maior sinal da fase atual (para medir amplitude) */
  minFase: number;
  maxFase: number;
  /** amplitude do último ciclo completo */
  amplitude: number;
  ultimoGiro: number;
  /** quando a fase alta atual começou (para medir o 1º ciclo) */
  tAlta: number;
  quadros: number;
  quadrosValidos: number;
};

export function novoContador(banda: number): ContadorReps {
  return {
    reps: 0,
    alta: false,
    ref: Number.NaN,
    banda,
    minFase: Number.POSITIVE_INFINITY,
    maxFase: Number.NEGATIVE_INFINITY,
    amplitude: 0,
    ultimoGiro: 0,
    tAlta: 0,
    quadros: 0,
    quadrosValidos: 0,
  };
}

/**
 * Um passo da contagem. `sinal` é uma grandeza que oscila com o corpo
 * (altura dos ombros, centroide do movimento...). Retorna um estado novo.
 *
 * Regra de fé: só conta ciclo completo (descer E voltar) entre 0,8s e 6s.
 */
export function passoContador(
  c: ContadorReps,
  sinal: number,
  agora: number,
  valido = true,
): ContadorReps {
  const prox: ContadorReps = {
    ...c,
    quadros: c.quadros + 1,
    quadrosValidos: c.quadrosValidos + (valido ? 1 : 0),
    minFase: Math.min(c.minFase, sinal),
    maxFase: Math.max(c.maxFase, sinal),
  };

  if (Number.isNaN(prox.ref)) {
    prox.ref = sinal;
    return prox;
  }

  if (!prox.alta && sinal > prox.ref + prox.banda) {
    prox.alta = true;
    prox.ref = sinal;
    prox.minFase = sinal;
    prox.maxFase = sinal;
    prox.tAlta = agora;
    return prox;
  }

  if (prox.alta && sinal < prox.ref - prox.banda) {
    // 1º ciclo: não há giro anterior — estima o período pelo tempo de descida
    const giro = prox.ultimoGiro === 0 ? (agora - prox.tAlta) * 2 : agora - prox.ultimoGiro;
    const ritmoOk = giro >= 800 && giro <= 6000;
    prox.amplitude = prox.maxFase - prox.minFase;
    prox.alta = false;
    prox.ref = sinal;
    prox.minFase = sinal;
    prox.maxFase = sinal;
    if (ritmoOk) {
      prox.reps = c.reps + 1;
      prox.ultimoGiro = agora;
    } else {
      prox.ultimoGiro = agora;
    }
    return prox;
  }

  return prox;
}

/** Banda de histerese a partir da amplitude de um ciclo de calibração. */
export function bandaPorAmplitude(amplitude: number, minima: number): number {
  return Math.max(minima, Math.min(0.3, amplitude * 0.4));
}

export function presencaDe(c: ContadorReps): number {
  return c.quadros === 0 ? 0 : c.quadrosValidos / c.quadros;
}
