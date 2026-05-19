-- Tabela de mensagens do chat interno
create table public.mensagens (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz default now(),
  conteudo    text not null,
  autor_id    uuid references auth.users(id) on delete cascade,
  autor_nome  text
);

alter table public.mensagens enable row level security;

create policy "Acesso total a mensagens" on public.mensagens
  for all to authenticated using (true) with check (true);

-- Habilita Realtime para a tabela mensagens
alter publication supabase_realtime add table public.mensagens;
