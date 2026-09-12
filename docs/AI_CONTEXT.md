# AI_CONTEXT.md — Contexto para IAs que trabalharem no Arkhee

Este arquivo existe para que qualquer IA (Lovable, Cursor, Copilot, etc.)
entenda **como usar o conteúdo de sabedoria, perguntas e níveis de consciência**
dentro do Arkhee.

## Princípio central

O Arkhee não é um app de hábitos. É um **sistema de reprogramação mental**
baseado na metáfora da escultura: grandeza não se constrói às pressas.

Cada ação é um **voto na nova identidade**. O progresso não é medido por
velocidade, mas por **consolidação**.

## Níveis de consciência (taxonomia do Arkhee)

Baseado na Taxonomia de Bloom adaptada:

| Nível | Nome | Verbo | Objetivo |
|-------|------|-------|----------|
| 1 | Observador | Notar | Reconhecer que o padrão existe |
| 2 | Ruptura | Pausar | Interromper a resposta automática |
| 3 | Reprogramação | Examinar | Testar novas respostas |
| 4 | Identidade | Avaliar | Acumular evidências da nova identidade |
| 5 | Integração | Criar | Comportamento vira natural, sem esforço |

## Como a IA deve usar este conteúdo

### 1. Seleção de pergunta diária
- Determine o nível atual do usuário via `determineAwarenessLevel()`.
- Selecione 1 pergunta do nível correspondente.
- Evite repetir perguntas dos últimos 30 dias.
- Se o usuário responder com insight (palavras como "percebi", "pause",
  "escolhi", "notei"), dê micro-bônus de XP e sugira missão relacionada.

### 2. Uso como questionário de diagnóstico
- Aplique 5 perguntas de cada nível (25 total) para mapear onde o usuário está.
- Score por nível define o ponto de partida na Jornada.

### 3. Uso como check-in rápido
- 1 pergunta por dia, rotativa.
- Resposta alimenta o Mapa Mental (cria/atualiza nós).

### 4. Uso como reflexão profunda
- 1 vez por semana, aplique o bloco completo de um nível.
- Gera "Nota de Reprogramação" salva no diário.

### 5. Uso como missão
- Transforme pergunta em ação: "Hoje, observe X e registre Y."
- Missões têm 3 níveis: leve (2 min), médio (10 min), profundo (30 min).

## Integração com autores e livros

Cada pergunta pode ser enriquecida com:
- **Citação** de autor (Tolle, Zeland, Sêneca, Marco Aurélio, Goggins, etc.)
- **Conceito** do livro
- **Aplicação prática**

Ver `docs/KNOWLEDGE_BLOCKS.md` (a ser criado).

## Estrutura de dados esperada

```sql
CREATE TABLE daily_questions (
  id UUID PRIMARY KEY,
  level TEXT,              -- observer | rupture | reprogramming | identity | integration
  question TEXT,
  objective TEXT,          -- o que essa pergunta busca revelar
  bloom_level TEXT,        -- L1..L6
  tags TEXT[],             -- ex: ["autossabotagem", "medo"]
  author_ref TEXT,         -- ex: "Eckhart Tolle"
  book_ref TEXT,           -- ex: "O Poder do Agora"
  usage TEXT[],            -- ["daily", "quiz", "checkin", "reflection", "mission"]
  created_at TIMESTAMP
);
```

## Tom de voz

- Direto, íntimo, sem clichê de autoajuda.
- Segunda pessoa ("você"), mas sem soar acusatório.
- Perguntas que **desestabilizam** o automático, não que confirmam.
- Nada de "você consegue!" — o app não motiva, ele **revela**.
