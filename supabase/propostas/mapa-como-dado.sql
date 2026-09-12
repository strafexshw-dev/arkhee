-- ══════════════════════════════════════════════════════════════════════════
--  PROPOSTA (NÃO APLICADA) — o mapa como dado de primeira classe
-- ══════════════════════════════════════════════════════════════════════════
--
--  Este arquivo está em supabase/propostas/ de propósito: ele NÃO é uma
--  migração e não deve ser aplicado automaticamente. É o desenho do schema
--  para quando o mapa precisar guardar estado que não dá para derivar.
--
--  ── O QUE O MAPA FAZ HOJE ────────────────────────────────────────────────
--  Nada aqui é necessário para o mapa funcionar hoje. Os cinco estágios de
--  consciência são DERIVADOS das colunas que já existem:
--
--    unmapped      -> arquétipo da biblioteca sem padrão criado pela pessoa
--    noticed       -> thought_patterns existe, só o caminho antigo (A/B)
--    rupture       -> new_thought preenchido, new_action vazio
--    reprogrammed  -> new_action preenchido, sem evidência
--    integrated    -> existe evidência (new_evidence ou journal_entries com
--                     prompt = 'Evidência da rota: <nome>')
--
--  A derivação vive em src/lib/mapa.ts (estadoDoMapa / stageDe / evidenciasDe).
--
--  ── O QUE SE PERDE COM A DERIVAÇÃO ───────────────────────────────────────
--  1. História exata. Só created_at de padrão e de diário têm data. Quando
--     new_thought/new_action foram escritos, não sabemos — o "antes e depois"
--     de 30 dias é uma reconstrução aproximada, não um replay.
--  2. Força de aresta. Hoje a linha do caminho novo tem opacidade fixa pelo
--     estágio; não há um número 0..1 que cresça com a repetição.
--  3. Posição. Os nós são distribuídos por cálculo (ângulo uniforme no anel
--     da dicotomia). Nada guarda um layout escolhido pela pessoa.
--
--  Se algum dia isso for aplicado, a ordem é: criar as tabelas, backfill a
--  partir de thought_patterns + journal_entries, e só então trocar
--  src/lib/mapa.ts para ler daqui mantendo a derivação como fallback.
--
-- ══════════════════════════════════════════════════════════════════════════

-- ── 1 · NÓS ───────────────────────────────────────────────────────────────
create table if not exists public.pattern_nodes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,

  -- vínculo com o que já existe: 1 padrão pode alimentar 1 nó
  pattern_id uuid references public.thought_patterns (id) on delete set null,
  archetype_id text,                       -- ex.: 'medo-julgamento' (biblioteca)

  label text not null,
  label_short text,                        -- rótulo curto p/ o canvas ("Tempo")

  -- onde o nó se senta na dicotomia do controle (Epicteto, Encheirídion 1)
  control text not null default 'interno' check (control in ('interno', 'externo')),

  -- estágio de consciência: a cor mede o quanto foi visto, não o sucesso
  awareness_stage text not null default 'unmapped'
    check (awareness_stage in ('unmapped','noticed','rupture','reprogrammed','integrated')),

  -- posição em % do canvas (0..100), null = layout automático
  pos_x numeric(5,2),
  pos_y numeric(5,2),
  ring_radius numeric(5,2),

  evidence_count integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pattern_nodes_user_idx on public.pattern_nodes (user_id);
create index if not exists pattern_nodes_stage_idx on public.pattern_nodes (user_id, awareness_stage);

-- ── 2 · ARESTAS ───────────────────────────────────────────────────────────
-- Duas camadas por padrão: o caminho antigo (frio, tracejado, esmaece) e o
-- caminho novo (quente, sólido, ganha força a cada evidência).
create table if not exists public.pattern_edges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,

  from_node uuid not null references public.pattern_nodes (id) on delete cascade,
  to_node uuid references public.pattern_nodes (id) on delete cascade,
  -- null = o centro do mapa ("Você") ou um nó fixo da dicotomia
  to_anchor text,                          -- ex.: 'acao', 'centro', 'opiniao'

  kind text not null check (kind in ('old_path', 'new_path')),

  -- 0..1 — alimenta a espessura e o brilho da linha; cresce com repetição
  strength numeric(3,2) not null default 0.5 check (strength >= 0 and strength <= 1),

  active boolean not null default true,    -- caminho antigo vira false ao romper
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (from_node, to_node, to_anchor, kind)
);

create index if not exists pattern_edges_user_idx on public.pattern_edges (user_id);

-- ── 3 · EVENTOS ───────────────────────────────────────────────────────────
-- É isto que torna o "antes e depois" exato: cada mudança de estágio fica
-- datada, e o mapa de qualquer dia pode ser reconstruído de verdade.
create table if not exists public.pattern_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  node_id uuid not null references public.pattern_nodes (id) on delete cascade,

  kind text not null
    check (kind in ('noticed','rupture','reprogrammed','evidence','integrated','relapse','removed')),
  from_stage text,
  to_stage text,
  note text,                               -- o que a pessoa escreveu como evidência
  created_at timestamptz not null default now()
);

create index if not exists pattern_events_node_time_idx
  on public.pattern_events (node_id, created_at desc);
create index if not exists pattern_events_user_time_idx
  on public.pattern_events (user_id, created_at desc);

-- ── 4 · RLS ───────────────────────────────────────────────────────────────
alter table public.pattern_nodes  enable row level security;
alter table public.pattern_edges  enable row level security;
alter table public.pattern_events enable row level security;

create policy "nodes próprios"   on public.pattern_nodes  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "edges próprios"   on public.pattern_edges  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "events próprios"  on public.pattern_events for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── 5 · BACKFILL (rascunho) ───────────────────────────────────────────────
-- insert into public.pattern_nodes (user_id, pattern_id, label, control, awareness_stage, evidence_count)
-- select
--   tp.user_id,
--   tp.id,
--   tp.name,
--   'interno',                                   -- a classificação real viria de src/lib/mapa.ts
--   case
--     when tp.new_evidence is not null then 'integrated'
--     when tp.new_action  is not null then 'reprogrammed'
--     when tp.new_thought is not null then 'rupture'
--     else 'noticed'
--   end,
--   (tp.new_evidence is not null)::int
-- from public.thought_patterns tp;

-- ── 6 · CONSULTA QUE O MAPA PASSARIA A USAR ───────────────────────────────
-- Reconstrução exata do mapa em uma data qualquer:
--
-- select n.id, n.label, n.control,
--        coalesce(
--          (select e.to_stage from public.pattern_events e
--            where e.node_id = n.id and e.created_at <= $2
--            order by e.created_at desc limit 1),
--          'unmapped'
--        ) as stage_em,
--        (select count(*) from public.pattern_events e
--          where e.node_id = n.id and e.kind = 'evidence' and e.created_at <= $2) as evidencias
-- from public.pattern_nodes n
-- where n.user_id = $1;

-- ── 7 · PROPOSTA: TABELA DE PROVAS FÍSICAS ────────────────────────────────
-- Hoje a prova física (contagem de repetições verificada no navegador) é
-- registrada como journal_entries com prompt "Evidência de desconforto —
-- regra dos 40%" e o método declarado no conteúdo. Funciona, mas mistura
-- prova com relato. Quando houver confiança no fluxo, separar:
--
-- create table if not exists public.proofs (
--   id bigint generated always as identity primary key,
--   user_id uuid not null references auth.users (id) on delete cascade,
--   kind text not null default 'camera_reps',
--   proof_key text not null,              -- 'flexoes' | 'agachamentos' | 'polichinelos'
--   reps integer not null,
--   target integer not null,
--   seconds integer not null,
--   method text not null check (method in ('pose', 'movimento')),
--   presence numeric(3,2) not null,       -- fração de quadros com corpo visível
--   linked_pattern_id uuid references public.thought_patterns (id) on delete set null,
--   linked_mission_id uuid references public.missions (id) on delete set null,
--   created_at timestamptz not null default now()
-- );
-- alter table public.proofs enable row level security;
-- create policy "proofs próprias" on public.proofs
--   for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
