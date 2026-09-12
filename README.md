# Mind Weaver

Sim. Para a primeira versão (MVP), eu estruturaria o desenvolvimento para que a pessoa abra o app e imediatamente sinta: “isso está construindo uma versão nova de mim”.



Arquitetura da primeira interface



O menu principal teria 5 áreas:



Hoje · Reprogramar · Mapa · Jornada · Eu Futuro



No mobile, essas cinco opções ficam na barra inferior. No desktop, podem virar uma sidebar lateral.



1. Tela “Hoje” — Dashboard principal



Essa é a tela mais importante do produto.



No topo:



Boa noite, Ruana.

Quem você está treinando para se tornar?



Depois, um grande card:



ESTADO ATUAL



Nível 03 — Reprogramação



████████░░ 78%



1.240 XP · 🔥 12 dias



Logo abaixo:



Como sua mente está agora?



😣 — 😕 — 😐 — 🙂 — ⚡



Ao selecionar, o sistema registra o estado mental daquele dia.



Depois entra:



MISSÃO DE HOJE



> Observe um pensamento automático que apareceu hoje e escreva o que você normalmente faria por causa dele.







[ Começar missão ]



E então os hábitos:



EVIDÊNCIAS DE IDENTIDADE



Em vez de:



❌ “Hábitos de hoje”



Eu usaria:



> Cada ação é um voto na pessoa que você está se tornando.







○ Treinar

✓ Ler 10 minutos

✓ Meditar

○ Dormir antes das 23h



E no final:



Você deu 2 votos para sua nova identidade hoje.





---



2. Reprogramar



Aqui fica o “treinamento mental”.



A tela pode começar com:



REPROGRAMAR



Você não precisa lutar contra todos os seus pensamentos. Primeiro precisa descobrir de onde eles vêm.



Teríamos módulos como:



Crenças

Descubra crenças que estão dirigindo comportamentos.



Padrões automáticos

Identifique situações que ativam determinadas respostas.



Visualização

Sessões guiadas relacionadas à identidade futura.



Afirmações

Afirmações personalizadas, evitando virar simplesmente uma lista genérica de frases.



Reflexões

Perguntas e exercícios de escrita.



Áudios

Sessões de 5, 10 ou 20 minutos.



O conteúdo vai sendo desbloqueado conforme a jornada.





---



3. Mapa Mental



Essa seria uma das telas mais diferentes do produto.



Visualmente, imagino algo parecido com um mapa neural interativo.



No centro:



VOCÊ



E orbitando:



Crenças

Emoções

Gatilhos

Hábitos

Identidade



A pessoa poderia abrir um padrão específico:



Medo de julgamento



Gatilho



Preciso me expor.



↓



Pensamento



“Vão achar ridículo.”



↓



Emoção



Ansiedade.



↓



Resposta antiga



Evitar.



↓



Resultado



Continuo acreditando que não consigo.



Mas o sistema cria outra ramificação:



NOVO CAMINHO



Pensamento consciente



↓



Publicar mesmo desconfortável



↓



Perceber que nada terrível aconteceu



↓



Nova evidência



↓



“Eu consigo agir mesmo sentindo medo.”



Esse é literalmente o processo de reprogramação sendo visualizado.





---



4. Jornada



Aqui entra a gamificação.



Não faria níveis tradicionais como:



> Level 1

Level 2

Level 3







Cada nível representa uma transformação psicológica.



FASE I



O OBSERVADOR



> Você não pode mudar um padrão que ainda não consegue enxergar.







Objetivo:



Identificar padrões.



↓



FASE II



A RUPTURA



Interromper respostas automáticas.



↓



FASE III



REPROGRAMAÇÃO



Experimentar novas respostas.



↓



FASE IV



IDENTIDADE



Acumular evidências da nova identidade.



↓



FASE V



INTEGRAÇÃO



O comportamento deixa de exigir esforço consciente.



Dentro de cada fase teríamos missões + hábitos + exercícios + XP + marcos.





---



5. Eu Futuro



Essa seria outra tela central.



No onboarding, perguntamos:



> Quem você precisaria se tornar para viver a realidade que deseja?







A pessoa constrói sua identidade.



Por exemplo:



EU FUTURO



Disciplinada

Confiante

Saudável

Financeiramente responsável

Criativa



Agora cada identidade possui comportamentos.



IDENTIDADE



Pessoa disciplinada



████████░░ 81%



Evidências acumuladas



🔥 Treinou 31 vezes

📚 Estudou 18 vezes

🧘 Meditou 22 vezes

🎯 Cumpriu 14 compromissos difíceis



E uma frase:



> Você não precisa acreditar que mudou.

Você precisa acumular evidências até ser difícil acreditar que continua igual.







Isso pode ser extremamente forte dentro do produto.





---



O onboarding



Eu faria o primeiro acesso como uma pequena experiência, não como formulário.



Tela 01



Você não chegou aqui para criar hábitos.



Continuar →



Tela 02



Você chegou aqui porque existe uma versão sua que ainda aparece pouco.



Continuar →



Tela 03



Vamos encontrá-la.



Então começam perguntas.



O que você mais quer transformar?



◯ Disciplina

◯ Corpo

◯ Dinheiro

◯ Relacionamentos

◯ Autoconfiança

◯ Ansiedade/estresse

◯ Propósito

◯ Outro



Depois:



Quem você precisaria se tornar?



E o usuário seleciona características.



Isso gera automaticamente o primeiro Eu Futuro.





---



Loop principal do produto



Esse é o ponto que eu trataria como prioridade de desenvolvimento.



O usuário entra.



CHECK-IN



↓



Estado mental



↓



MISSÃO



↓



Executa comportamento



↓



HÁBITO



↓



Ganha XP



↓



EVIDÊNCIA DE IDENTIDADE



↓



Mapa é atualizado



↓



EVOLUÇÃO



↓



Volta amanhã.



Ou seja, não são cinco ferramentas desconectadas.



Tudo alimenta tudo.





---



Banco de dados inicial



Para o MVP, eu estruturaria pelo menos:



users



future_identities



identity_traits



habits



habit_logs



mental_checkins



beliefs



triggers



thought_patterns



missions



mission_completions



xp_events



levels



achievements



journal_entries



reprogramming_sessions



Assim conseguimos evoluir posteriormente sem reconstruir todo o sistema.





---



Ordem de desenvolvimento



Eu dividiria o MVP em quatro etapas.



Etapa 1 — Fundação: autenticação, onboarding, perfil, criação do Eu Futuro e estrutura do banco.



Etapa 2 — Loop diário: Dashboard Hoje, hábitos, check-in emocional, streak, XP e missão diária. Quando isso estiver funcionando, já temos um produto utilizável.



Etapa 3 — Reprogramação: crenças, diário/reflexões, exercícios, sessões e sistema de padrões.



Etapa 4 — Metagame: Mapa Mental visual, Jornada, níveis, conquistas, animações, desbloqueios e evolução da identidade.



Eu não começaria pelo mapa neural, apesar de ele ser visualmente muito interessante. Primeiro faria o loop entrar → refletir → agir → registrar → evoluir funcionar perfeitamente. Depois o mapa passa a representar os dados que o usuário realmente gerou.



E visualmente...



Para o Reflexo Arcano, eu seguiria uma direção de “tecnologia arcana”, não um app comum de hábitos: preto/grafite profundo, tipografia limpa, branco suave, detalhes em dourado/âmbar ou violeta, cards quase transparentes, blur muito discreto, partículas e linhas orbitais, animações lentas e símbolos geométricos minimalistas. 



O resultado precisa ficar mais próximo de “estou acessando minha própria mente” do que de “baixei outro aplicativo de hábitos”.



E eu já pensaria o MVP como web app responsivo/PWA, com arquitetura preparada para depois virar aplicativo nativo sem precisar reinventar a experiência.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://arkhee.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/8c698070-3f8d-4635-92d8-97767f541526).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

### Modo demo

Dá para navegar pelas cinco telas sem criar conta e sem gravar nada no banco real:

- na landing, clique em **ou explorar em modo demo**;
- ou em `/auth`, clique em **Explorar em modo demo**.

Com o modo demo ligado, `@/lib/db` devolve um banco local em memória
(`src/lib/demo/`) com dados de exemplo, persistido no `localStorage` do navegador —
nenhuma requisição sai para o Supabase. A barra no topo da tela tem
**Reiniciar dados** (volta ao estado inicial do exemplo) e **Sair do demo**
(retorna ao login real).

As telas não sabem se estão em demo ou não: elas importam sempre
`import { db as supabase } from "@/lib/db"`, e a troca acontece nesse único ponto.

### Design system

Os tokens vivem em `src/styles.css` e têm uma página de referência em **`/design`**
(rota pública, com `noindex`), com peças interativas para conferir o comportamento
antes de usar numa tela.

Decisões registradas lá:

- **Cor** — âmbar/dourado é a *única* cor de ação (CTA, XP, progresso, foco).
  Violeta é apoio místico: véus, órbitas e o Mapa. Nunca aparece em botão.
- **Tipografia** — Cormorant Garamond (títulos e citações) + Space Grotesk
  (corpo e interface), em escala fixa 12 / 14 / 16 / 20 / 24 / 32 / 48.
- **Espaço** — múltiplos de 4px: 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64.
- **Raio e sombra** — 8 a 24px + pílula; profundidade vem de glow colorido
  (âmbar ou violeta), nunca de borda dura.
- **Movimento** — interação 200–400ms com ease-out suave, ambiente 5–30s,
  e tudo desliga em `prefers-reduced-motion`.

### Referências e mecânicas

O app usa cada referência para **legitimar uma mecânica**, não como decoração:

| Referência | Onde entra | O que legitima |
| --- | --- | --- |
| Sêneca, *Cartas a Lucílio* 75.9 e 71.35 | Jornada + sistema de XP | Progresso não é subir rápido, é **garantir um lugar de onde não se possa retroceder**. Uma fase só vira "consolidada" com evidência; sem ela fica "em consolidação" |
| Epicteto, *Encheirídion* 1 | Mapa Mental | A **Dicotomia do Controle** vira geometria: anel interno = o que você controla, anel externo = o que nunca foi seu |
| Marco Aurélio, *Meditações* 8.47 | Mapa (nós externos) | O que dói não é o fato, é o julgamento — e o julgamento é seu |
| David Goggins, *Can't Hurt Me* (regra dos 40%) | Hoje | Depois do primeiro voto do dia, o app oferece uma **evidência de desconforto** (+30 XP) |
| Hermann Hesse, *Siddhartha* | Eu Futuro (Fase V) | O Eu Futuro não é meta a alcançar, é **qualidade a incorporar hoje** — por isso cada traço mostra evidências dos últimos 7 dias |
| Alexandre, o Grande | Jornada (aviso) | **Velocidade sem fundação colapsa.** Usado como contraponto, nunca como ideal |

**Biblioteca de Notas de Reprogramação** (`src/lib/sabedoria.ts`): cada nó do mapa
carrega (1) a Voz da Sabedoria, com citação conferida na fonte, (2) a Pergunta
Socrática baseada na dicotomia do controle e (3) o Micro-Desafio de ~2 minutos.
O que é interpretação está marcado como paráfrase.

**O Mapa deixou de ser diagrama e virou mecanismo**, em três camadas:

1. **Diagnóstico** — ao escrever no diário ou nomear um padrão, o app sugere o nó
   correspondente ("isso parece conectado a *Medo de julgamento*") e a pessoa
   confirma a conexão.
2. **Simulador de cenários** — o fluxo A → B → C → D (caminho antigo →
   intervenção pela dicotomia → resposta nova → evidência) grava a rota e ela
   acende no grafo.
3. **Registro histórico** — o mapa guarda a data de cada padrão e de cada
   evidência, e permite voltar no tempo (ver abaixo).

Nada disso exigiu migração: `thought_patterns` já descrevia os dois caminhos, e a
conexão com um nó é feita pelo prefixo do nome (`Medo de julgamento · reunião`).

### O mapa como escultura: cinco estágios de consciência

A cor de um nó **não mede sucesso nem fracasso — mede o quanto ele já foi visto**.
A metáfora é a de Michelangelo: a estátua já está no mármore, o trabalho é tirar o
excesso. No app, cada padrão começa pedra bruta e vai sendo cinzelado.

| Estágio | Cor | Tamanho | Quando acontece (derivação) |
| --- | --- | --- | --- |
| `unmapped` | `#4A4A5A` (fosco, sem glow) | 8px | arquétipo da biblioteca sem padrão criado |
| `noticed` | `#8B5CF6` | 9px | só o caminho antigo (A/B) foi escrito — Fase I |
| `rupture` | `#F59E0B` | 10px | `new_thought` preenchido, `new_action` vazio — Fase II |
| `reprogrammed` | `#EAB308` | 12px | `new_action` preenchido, sem evidência — Fase III |
| `integrated` | `#FDE68A` + glow forte | 14px | existe evidência (`new_evidence` ou diário) — Fase IV/V |

A derivação vive em `src/lib/mapa.ts` (`stageDe`, `evidenciasDe`, `estadoDoMapa`) e
as transições de cor/tamanho duram 520ms (`--duration-stage`).

**Duas camadas de linha.** O caminho antigo é tracejado, frio e fino, e esmaece de
34% para 16% de opacidade quando a rota nova existe. O caminho novo é sólido,
quente (na cor do estágio), tem halo e um ponto de luz que percorre a linha até o
nó *Ação* — desligado em `prefers-reduced-motion`. Ao registrar uma evidência, o
nó recebe um anel de pulso (`pulse-ring`) e a linha nova acende.

**Painel do nó.** Clicar em qualquer nó abre um painel lateral (folha inferior no
celular) com nome, escada dos cinco estágios, contagem explícita de evidências,
padrão antigo → novo caminho lado a lado e as ações: *Registrar evidência*,
*Abrir nota de reprogramação*, *Remover do mapa* (confirmação em dois toques).

**Antes e depois.** Um controle de 0 a 30 dias reconstrói o mapa como ele era:
`estadoDoMapa(padroes, diario, data)` filtra padrões pela data de criação e conta
só as evidências registradas até ali. É uma reconstrução aproximada — os campos do
caminho novo não têm data própria. Para um histórico exato existe a proposta
`supabase/propostas/mapa-como-dado.sql` (`pattern_nodes`, `pattern_edges` com
`strength` 0–1 e `pattern_events`), mantida **fora** de `supabase/migrations/` de
propósito: ela não deve ser aplicada automaticamente.
