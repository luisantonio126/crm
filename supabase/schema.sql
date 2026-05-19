-- ============================================================
-- CRM Oliveira Nunes Engenharia — Schema Supabase
-- Execute este arquivo no SQL Editor do Supabase
-- ============================================================

-- ============================================================
-- 1. PERFIS DE USUÁRIO (extensão de auth.users)
-- ============================================================
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  nome        text,
  cargo       text,
  avatar_url  text,
  created_at  timestamptz default now()
);

-- Cria perfil automaticamente quando um usuário se cadastra
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nome)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- 2. CLIENTES
-- ============================================================
create table public.clientes (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz default now(),
  nome        text not null,
  email       text,
  telefone    text,
  cpf_cnpj    text,
  tipo        text default 'pessoa_juridica' check (tipo in ('pessoa_fisica', 'pessoa_juridica')),
  endereco    text,
  cidade      text,
  estado      text,
  cep         text,
  observacoes text,
  ativo       boolean default true,
  created_by  uuid references auth.users(id) on delete set null
);

-- ============================================================
-- 3. PROJETOS
-- ============================================================
create table public.projetos (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz default now(),
  nome             text not null,
  descricao        text,
  cliente_id       uuid references public.clientes(id) on delete set null,
  status           text default 'backlog' check (status in ('backlog', 'em_andamento', 'revisao', 'concluido', 'cancelado')),
  prioridade       text default 'media' check (prioridade in ('baixa', 'media', 'alta')),
  data_inicio      date,
  data_previsao    date,
  data_conclusao   date,
  valor_contrato   numeric(12,2),
  created_by       uuid references auth.users(id) on delete set null
);

-- ============================================================
-- 4. TAREFAS (Kanban)
-- ============================================================
create table public.tarefas (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz default now(),
  projeto_id      uuid references public.projetos(id) on delete cascade,
  titulo          text not null,
  descricao       text,
  status          text default 'backlog' check (status in ('backlog', 'em_andamento', 'revisao', 'concluido')),
  prioridade      text default 'media' check (prioridade in ('baixa', 'media', 'alta')),
  responsavel_id  uuid references auth.users(id) on delete set null,
  data_vencimento date,
  ordem           integer default 0,
  created_by      uuid references auth.users(id) on delete set null
);

-- ============================================================
-- 5. TRANSAÇÕES FINANCEIRAS (fluxo de caixa)
-- ============================================================
create table public.transacoes (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz default now(),
  tipo             text not null check (tipo in ('receita', 'despesa')),
  descricao        text not null,
  valor            numeric(12,2) not null,
  data_vencimento  date not null,
  data_pagamento   date,
  status           text default 'pendente' check (status in ('pendente', 'pago', 'cancelado')),
  categoria        text,
  projeto_id       uuid references public.projetos(id) on delete set null,
  cliente_id       uuid references public.clientes(id) on delete set null,
  observacoes      text,
  recorrente       boolean default false,
  created_by       uuid references auth.users(id) on delete set null
);

-- ============================================================
-- 6. EVENTOS DO CALENDÁRIO
-- ============================================================
create table public.eventos (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz default now(),
  titulo      text not null,
  descricao   text,
  data_inicio timestamptz not null,
  data_fim    timestamptz,
  dia_inteiro boolean default false,
  tipo        text default 'outro' check (tipo in ('reuniao', 'visita', 'prazo', 'pagamento', 'outro')),
  projeto_id  uuid references public.projetos(id) on delete set null,
  cliente_id  uuid references public.clientes(id) on delete set null,
  created_by  uuid references auth.users(id) on delete set null
);

-- ============================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- Apenas usuários autenticados acessam os dados
-- ============================================================

alter table public.profiles    enable row level security;
alter table public.clientes    enable row level security;
alter table public.projetos    enable row level security;
alter table public.tarefas     enable row level security;
alter table public.transacoes  enable row level security;
alter table public.eventos     enable row level security;

-- Profiles: cada usuário lê/edita o próprio perfil; todos autenticados veem todos
create policy "Usuários autenticados veem perfis" on public.profiles
  for select to authenticated using (true);
create policy "Usuário edita próprio perfil" on public.profiles
  for update to authenticated using (auth.uid() = id);

-- Clientes: todos os usuários autenticados têm acesso total
create policy "Acesso total a clientes" on public.clientes
  for all to authenticated using (true) with check (true);

-- Projetos: todos os usuários autenticados têm acesso total
create policy "Acesso total a projetos" on public.projetos
  for all to authenticated using (true) with check (true);

-- Tarefas: todos os usuários autenticados têm acesso total
create policy "Acesso total a tarefas" on public.tarefas
  for all to authenticated using (true) with check (true);

-- Transações: todos os usuários autenticados têm acesso total
create policy "Acesso total a transacoes" on public.transacoes
  for all to authenticated using (true) with check (true);

-- Eventos: todos os usuários autenticados têm acesso total
create policy "Acesso total a eventos" on public.eventos
  for all to authenticated using (true) with check (true);

-- ============================================================
-- 8. ÍNDICES para performance
-- ============================================================
create index on public.clientes (nome);
create index on public.projetos (cliente_id);
create index on public.projetos (status);
create index on public.tarefas (projeto_id);
create index on public.tarefas (status);
create index on public.transacoes (tipo);
create index on public.transacoes (status);
create index on public.transacoes (data_vencimento);
create index on public.eventos (data_inicio);
