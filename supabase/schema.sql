-- ============================================================
-- Luna Templates — Supabase Schema
-- HPrime Películas · v1.0
-- ============================================================
-- Execute este script no SQL Editor do Supabase (Database → SQL Editor)
-- após criar o projeto. Ele cria a tabela de credenciais Meta com RLS
-- por usuário, garantindo que cada conta só veja suas próprias credenciais.
-- ============================================================

-- 1. Tabela de credenciais Meta (uma por usuário)
create table if not exists public.meta_credentials (
  user_id uuid primary key references auth.users(id) on delete cascade,
  waba_id text not null,
  access_token text not null,
  phone_number_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.meta_credentials is
  'Credenciais Meta WABA por usuário. RLS garante isolamento total.';

-- 2. Trigger para manter updated_at em dia
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_meta_credentials_updated_at on public.meta_credentials;
create trigger trg_meta_credentials_updated_at
  before update on public.meta_credentials
  for each row execute function public.set_updated_at();

-- 3. Row Level Security
alter table public.meta_credentials enable row level security;

-- Cada usuário lê apenas as próprias credenciais
drop policy if exists "Users can read own credentials"
  on public.meta_credentials;
create policy "Users can read own credentials"
  on public.meta_credentials
  for select
  using (auth.uid() = user_id);

-- Cada usuário insere apenas as próprias credenciais
drop policy if exists "Users can insert own credentials"
  on public.meta_credentials;
create policy "Users can insert own credentials"
  on public.meta_credentials
  for insert
  with check (auth.uid() = user_id);

-- Cada usuário atualiza apenas as próprias credenciais
drop policy if exists "Users can update own credentials"
  on public.meta_credentials;
create policy "Users can update own credentials"
  on public.meta_credentials
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Cada usuário deleta apenas as próprias credenciais
drop policy if exists "Users can delete own credentials"
  on public.meta_credentials;
create policy "Users can delete own credentials"
  on public.meta_credentials
  for delete
  using (auth.uid() = user_id);

-- ============================================================
-- OPCIONAL: Tabela de log local de operações em templates
-- Útil para auditoria — mantém histórico de criações/edições/deleções
-- ============================================================

create table if not exists public.template_actions (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null check (action in ('CREATE', 'EDIT', 'DELETE')),
  template_name text not null,
  template_id text,
  language text,
  payload jsonb,
  response jsonb,
  status text,
  created_at timestamptz not null default now()
);

create index if not exists idx_template_actions_user
  on public.template_actions(user_id, created_at desc);

alter table public.template_actions enable row level security;

drop policy if exists "Users can read own actions"
  on public.template_actions;
create policy "Users can read own actions"
  on public.template_actions
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own actions"
  on public.template_actions;
create policy "Users can insert own actions"
  on public.template_actions
  for insert
  with check (auth.uid() = user_id);

-- ============================================================
-- Tabela de mensagens enviadas (relatórios)
-- Registra cada disparo de template para um cliente
-- ============================================================

create table if not exists public.mensagens_enviadas (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  nome_cliente text not null,
  id_cliente text,
  template_enviado text not null,
  categoria text not null check (categoria in ('MARKETING', 'UTILITY', 'AUTHENTICATION')),
  valor numeric(10, 2),
  created_at timestamptz not null default now()
);

create index if not exists idx_mensagens_enviadas_user
  on public.mensagens_enviadas(user_id, created_at desc);

alter table public.mensagens_enviadas enable row level security;

drop policy if exists "Users can read own mensagens"
  on public.mensagens_enviadas;
create policy "Users can read own mensagens"
  on public.mensagens_enviadas
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own mensagens"
  on public.mensagens_enviadas;
create policy "Users can insert own mensagens"
  on public.mensagens_enviadas
  for insert
  with check (auth.uid() = user_id);
