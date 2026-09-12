# QUIZ_SYSTEM.md — Como usar as perguntas no Arkhee

As 250 perguntas de `DAILY_QUESTIONS.md` podem ser usadas de 5 formas:

## 1. Pergunta diária (1 por dia)

- Rotação: 1 pergunta do nível atual do usuário.
- Evitar repetição dos últimos 30 dias.
- Resposta curta (1-3 frases) ou longa (diário).
- Alimenta XP e o Mapa Mental.

## 2. Questionário de diagnóstico (25 perguntas)

- 5 perguntas de cada nível (total 25).
- Aplicado no onboarding e a cada 30 dias.
- Score por nível define ponto de partida na Jornada.
- Exemplo de score:
  - 4-5 acertos no nível 1 → está no Observador
  - 3+ no nível 2 → está na Ruptura
  - etc.

## 3. Check-in rápido (3 perguntas)

- 1 do nível atual, 1 do anterior, 1 do próximo.
- Serve para validar progressão.
- Aplicado semanalmente.

## 4. Reflexão profunda (bloco completo)

- 1 bloco de 10 perguntas de um nível.
- Aplicado 1x por semana.
- Gera "Nota de Reprogramação" salva.

## 5. Missão

- Transformar pergunta em ação:
  - "Hoje, observe X e registre Y."
  - "Hoje, quando sentir Z, pause e faça W."
- 3 níveis: leve (2 min), médio (10 min), profundo (30 min).

## Lógica de progressão

```typescript
function nextLevel(currentLevel: Level, answers: Answer[]): Level {
  const insights = answers.filter(a => a.hasInsight).length;
  const consistency = answers.filter(a => a.isConsistent).length;
  
  if (currentLevel === 'observer' && insights >= 5) return 'rupture';
  if (currentLevel === 'rupture' && insights >= 7) return 'reprogramming';
  if (currentLevel === 'reprogramming' && insights >= 10) return 'identity';
  if (currentLevel === 'identity' && insights >= 12) return 'integration';
  return currentLevel;
}
```

## Detecção de insight

Palavras/frases que indicam insight:
- "percebi", "notei", "pause", "escolhi", "respirei"
- "em vez de", "ao invés de", "consegui"
- "antes eu", "agora eu", "estou mudando"

## Integração com autores

Cada pergunta pode vir com:
- Citação do autor
- Conceito do livro
- Micro-desafio de 2 minutos

Ver `docs/KNOWLEDGE_BLOCKS.md`.
