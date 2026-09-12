/**
 * SABEDORIA — biblioteca de "Notas de Reprogramação".
 *
 * Cada nó do Mapa Mental carrega três coisas:
 *   1. A Voz da Sabedoria — citação verificada na fonte (autor + obra).
 *   2. A Pergunta Socrática — auto-investigação pela Dicotomia do Controle.
 *   3. O Micro-Desafio — ação de ~2 minutos para testar a resposta nova.
 *
 * As citações abaixo foram conferidas nas fontes. O que é interpretação aparece
 * marcado como "(paráfrase)" — nunca como aspas do autor.
 */

export type Voz = {
  quote: string;
  author: string;
  source: string;
};

export type Nota = {
  id: string;
  nome: string;
  /** onde o nó se senta no mapa: o que você controla ou o que não controla */
  controle: "interno" | "externo";
  fase: number;
  voz: Voz;
  pergunta: string;
  desafio: string;
  keywords: string[];
};

/* ══════════════════════════════════════════════════════════════════════
   A FILOSOFIA OFICIAL DO XP — Sêneca, Carta 75
   ══════════════════════════════════════════════════════════════════════ */

export const FILOSOFIA_XP: Voz = {
  quote: "Eles já chegaram a um ponto de onde não há como retroceder, mas ainda não sabem disso.",
  author: "Sêneca",
  source: "Cartas a Lucílio, 75.9 (tradução a partir de R. M. Gummere)",
};

export const XP_RESUMO =
  "O objetivo não é subir de nível rápido. É garantir um lugar de onde não se possa retroceder.";

export const CONSOLIDACAO: Voz = {
  quote: "Ninguém retoma o progresso no ponto em que o deixou.",
  author: "Sêneca",
  source: "Cartas a Lucílio, 71.35",
};

/* ══════════════════════════════════════════════════════════════════════
   A VOZ DE CADA FASE
   ══════════════════════════════════════════════════════════════════════ */

export const VOZES_FASE: Record<number, Voz> = {
  1: {
    quote:
      "Algumas coisas estão ao nosso alcance, outras não. Ao nosso alcance estão o julgamento, o impulso, o desejo e a aversão. Fora dele estão o corpo, a propriedade, a reputação e os cargos.",
    author: "Epicteto",
    source: "Encheirídion, 1",
  },
  2: {
    quote:
      "Quando você acha que já deu tudo, você está em apenas 40% do que o seu corpo é capaz. Esse é o limite que nós mesmos colocamos.",
    author: "David Goggins",
    source: "Can't Hurt Me (2019)",
  },
  3: {
    quote:
      "Se algo externo te dói, não é isso que te perturba, mas o teu próprio julgamento sobre isso. E está ao teu alcance apagar esse julgamento agora.",
    author: "Marco Aurélio",
    source: "Meditações, 8.47",
  },
  4: {
    quote: "O que é imperfeito necessariamente oscila: ora avança, ora escorrega.",
    author: "Sêneca",
    source: "Cartas a Lucílio, 71.35",
  },
  5: {
    quote:
      "Buscar significa ter um objetivo. Mas encontrar significa ser livre, estar aberto, não ter objetivo.",
    author: "Hermann Hesse",
    source: "Siddhartha (1922)",
  },
};

/* ══════════════════════════════════════════════════════════════════════
   O AVISO — Alexandre, o Grande
   ══════════════════════════════════════════════════════════════════════ */

export const AVISO_ALEXANDRE = {
  titulo: "O aviso de Alexandre",
  texto:
    "Alexandre montou o maior império do mundo antigo em onze anos. Morreu aos 32, sem sucessor definido, e em poucos anos seus próprios generais tinham fatiado tudo o que ele conquistou.",
  licao: "Velocidade sem fundação colapsa.",
  complemento:
    "Uma escultura leva anos. Um império erguido em uma década desmorona antes da próxima geração. Aqui, XP não mede pressa: mede o quanto o terreno já não volta a ser o que era.",
};

/* ══════════════════════════════════════════════════════════════════════
   DICOTOMIA DO CONTROLE — os dois anéis do Mapa
   ══════════════════════════════════════════════════════════════════════ */

export const ANEL_INTERNO = [
  { id: "julgamento", label: "Julgamento" },
  { id: "impulso", label: "Impulso" },
  { id: "atencao", label: "Atenção" },
  { id: "acao", label: "Ação" },
  { id: "esforco", label: "Esforço" },
  { id: "resposta", label: "Resposta" },
];

export const ANEL_EXTERNO = [
  { id: "opiniao", label: "Opinião alheia" },
  { id: "resultado", label: "Resultado" },
  { id: "passado", label: "Passado" },
  { id: "reputacao", label: "Reputação" },
  { id: "outros", label: "O que os outros fazem" },
  { id: "tempo", label: "O tempo que resta" },
];

export const DICOTOMIA_VOZ: Voz = VOZES_FASE[1]!;

/* ══════════════════════════════════════════════════════════════════════
   NOTAS DE REPROGRAMAÇÃO — os nós mais comuns
   ══════════════════════════════════════════════════════════════════════ */

export const NOTAS: Nota[] = [
  {
    id: "medo-julgamento",
    nome: "Medo de julgamento",
    controle: "externo",
    fase: 1,
    voz: VOZES_FASE[3]!,
    pergunta:
      "O que exatamente está ao seu alcance aqui — a opinião de quem olha, ou o que você decide fazer enquanto é olhado?",
    desafio:
      "Por 2 minutos, escreva o que você faria se ninguém fosse saber. Depois faça a menor versão disso hoje.",
    keywords: [
      "julg",
      "vergonha",
      "ridicul",
      "exposi",
      "plateia",
      "vitrine",
      "ser vista",
      "me verem",
    ],
  },
  {
    id: "catastrofizacao",
    nome: "Catastrofização",
    controle: "interno",
    fase: 1,
    voz: {
      quote:
        "São mais as coisas que nos assustam do que as que nos oprimem; sofremos mais pela imaginação do que pela realidade.",
      author: "Sêneca",
      source: "Cartas a Lucílio, 13.4",
    },
    pergunta:
      "Dessa história que você está contando, o que é fato observado e o que é projeção sua?",
    desafio:
      "Escreva o pior cenário em uma linha. Ao lado, escreva o que você faria se ele acontecesse. Leia os dois.",
    keywords: [
      "desastre",
      "catastr",
      "pior cenario",
      "terror",
      "panico",
      "ansiedad",
      "angustia",
      "tragedia",
      "e se der",
    ],
  },
  {
    id: "procrastinacao",
    nome: "Procrastinação",
    controle: "interno",
    fase: 2,
    voz: {
      quote: "Não é que tenhamos pouco tempo de vida; é que desperdiçamos muito dele.",
      author: "Sêneca",
      source: "Da Brevidade da Vida, 1.1",
    },
    pergunta:
      "O que você está evitando sentir ao adiar — tédio, medo de errar, ou a suspeita de que não vai sair como você quer?",
    desafio:
      "Faça 2 minutos da tarefa sem editar nada. Só comece. O objetivo não é terminar, é romper a inércia.",
    keywords: ["adia", "procrastin", "amanha", "deixar para", "preguica", "evitar", "empurrar"],
  },
  {
    id: "perfeccionismo",
    nome: "Perfeccionismo",
    controle: "interno",
    fase: 3,
    voz: {
      quote: "Escrever é bom, pensar é melhor. Ser esperto é bom, ser paciente é melhor.",
      author: "Hermann Hesse",
      source: "Siddhartha",
    },
    pergunta: "Essa exigência é sua ou é de alguém que você ainda está tentando satisfazer?",
    desafio:
      "Entregue hoje algo deliberadamente em 70%. Registre o que aconteceu de fato, não o que você temia.",
    keywords: ["perfeit", "excelencia", "impecavel", "erro", "errado", "critica", "revisar"],
  },
  {
    id: "desistencia",
    nome: "Desistir no desconforto",
    controle: "interno",
    fase: 2,
    voz: VOZES_FASE[2]!,
    pergunta:
      "Esse cansaço é o corpo pedindo descanso ou é a mente pedindo alívio? Os dois merecem respostas diferentes.",
    desafio:
      "Escolha um desconforto de 2 minutos (água fria, uma ligação adiada, uma repetição a mais) e atravesse-o sem negociar.",
    keywords: ["desist", "cansad", "exaust", "limite", "nao consigo", "abandonar", "conforto"],
  },
  {
    id: "autossabotagem",
    nome: "Autossabotagem",
    controle: "interno",
    fase: 4,
    voz: CONSOLIDACAO,
    pergunta:
      "O que você ganha mantendo isso? Todo padrão que sobrevive está te protegendo de alguma coisa.",
    desafio:
      "Escreva uma linha: 'eu fazia X para me proteger de Y'. Depois escolha a menor ação que contradiz X hoje.",
    keywords: [
      "sabotag",
      "estragar",
      "arruinar",
      "recaida",
      "sempre igual",
      "de novo",
      "repetir",
      "ciclo",
    ],
  },
  {
    id: "aprovacao",
    nome: "Necessidade de aprovação",
    controle: "externo",
    fase: 1,
    voz: DICOTOMIA_VOZ,
    pergunta:
      "Se ninguém nunca soubesse o que você fez, você ainda faria? A resposta mostra de quem é o comportamento.",
    desafio:
      "Faça hoje uma coisa bem feita e não conte para ninguém. Deixe a evidência ser só sua.",
    keywords: ["aprov", "agradar", "aceit", "pertencer", "rejei", "validar", "elogio", "reconhec"],
  },
  {
    id: "comparacao",
    nome: "Comparação",
    controle: "externo",
    fase: 3,
    voz: {
      quote:
        "Não me cabe julgar a vida de outro homem. Devo julgar, escolher e rejeitar apenas por mim mesmo.",
      author: "Hermann Hesse",
      source: "Siddhartha",
    },
    pergunta:
      "Você está comparando o seu bastidor com o palco do outro? Que dado dessa comparação você realmente tem?",
    desafio:
      "Feche o feed por 2 minutos e escreva uma evidência sua dos últimos 7 dias que ninguém viu.",
    keywords: [
      "compar",
      "inveja",
      "atras",
      "melhor que eu",
      "instagram",
      "rede social",
      "outros conseguem",
    ],
  },
  {
    id: "reatividade",
    nome: "Reatividade",
    controle: "interno",
    fase: 2,
    voz: {
      quote: "As consequências da raiva são muito mais graves do que as suas causas.",
      author: "Marco Aurélio",
      source: "Meditações, Livro XI",
    },
    pergunta:
      "Entre o estímulo e a sua resposta, quantos segundos cabem? O que muda se couberem sessenta?",
    desafio:
      "Na próxima irritação, respire três vezes antes de responder. Anote depois o que a pausa revelou.",
    keywords: [
      "raiva",
      "irritad",
      "explod",
      "brigar",
      "impuls",
      "reaj",
      "grosso",
      "arrepend",
      "na hora",
    ],
  },
  {
    id: "pressa",
    nome: "Velocidade sem fundação",
    controle: "interno",
    fase: 4,
    voz: FILOSOFIA_XP,
    pergunta:
      "O que você quer é chegar logo ou não voltar mais para onde estava? As duas coisas exigem ritmos diferentes.",
    desafio:
      "Liste três coisas que você já consolidou e não perde mais. Comece por elas, não pelo que falta.",
    keywords: ["pressa", "rapido", "urgente", "atrasad", "tempo perdido", "correr", "quanto antes"],
  },
];

/* ══════════════════════════════════════════════════════════════════════
   DIAGNÓSTICO — sugerir a conexão de um pensamento a um nó
   ══════════════════════════════════════════════════════════════════════ */

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Diagnóstico: devolve o nó cujo léxico melhor explica o texto.
 * Cada termo vale o próprio tamanho — "exposicao" (9) pesa mais que "pior" (4),
 * então o match específico vence o genérico. Empate mantém a ordem da
 * biblioteca. É uma sugestão, nunca uma sentença: quem confirma é a pessoa.
 */
export function notaPara(texto: string): Nota | null {
  const alvo = normalize(texto);
  if (alvo.trim().length < 4) return null;

  let best: Nota | null = null;
  let bestScore = 0;

  for (const nota of NOTAS) {
    let score = 0;
    for (const keyword of nota.keywords) {
      const termo = normalize(keyword);
      if (alvo.includes(termo)) score += Math.max(2, termo.length);
    }
    if (score > bestScore) {
      bestScore = score;
      best = nota;
    }
  }

  return bestScore > 0 ? best : null;
}

/** Nota pelo id do nó (usado quando o usuário clica num arquétipo do mapa). */
export function notaPorId(id: string): Nota | null {
  return NOTAS.find((nota) => nota.id === id) ?? null;
}
