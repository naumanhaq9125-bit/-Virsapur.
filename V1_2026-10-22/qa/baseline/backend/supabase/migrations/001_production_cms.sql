-- Virsapur production CMS foundation. Apply once in a new Supabase project.
create extension if not exists pgcrypto;

create table if not exists public.admin_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','editor')),
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cms_singletons (
  key text primary key,
  status text not null default 'draft' check (status in ('draft','review','published','archived')),
  data jsonb not null,
  published_data jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),
  published_at timestamptz
);

create table if not exists public.cms_records (
  collection text not null,
  id text not null,
  slug text,
  status text not null default 'draft' check (status in ('draft','review','published','archived')),
  data jsonb not null,
  published_data jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),
  published_at timestamptz,
  primary key (collection,id),
  unique (collection,slug)
);

create table if not exists public.cms_revisions (
  id uuid primary key default gen_random_uuid(),
  collection text not null,
  record_id text not null,
  status text not null,
  data jsonb not null,
  reason text not null default 'save',
  actor_id uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.cms_redirects (
  source_path text primary key,
  destination_path text not null,
  permanent boolean not null default true,
  record_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.cms_audit_log (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  actor_id uuid references auth.users(id),
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.cms_publish_jobs (
  id uuid primary key default gen_random_uuid(),
  state text not null check (state in ('queued','building','ready','failed')),
  trigger text not null default 'admin',
  actor_id uuid references auth.users(id),
  provider_job_id text,
  deployment_url text,
  error text,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.admin_profiles enable row level security;
alter table public.cms_singletons enable row level security;
alter table public.cms_records enable row level security;
alter table public.cms_revisions enable row level security;
alter table public.cms_redirects enable row level security;
alter table public.cms_audit_log enable row level security;
alter table public.cms_publish_jobs enable row level security;

revoke all on public.admin_profiles, public.cms_singletons, public.cms_records, public.cms_revisions, public.cms_redirects, public.cms_audit_log, public.cms_publish_jobs from anon, authenticated;

-- Admin mutations intentionally use the server-only Supabase secret key after
-- Auth and role checks in Vercel Functions. That key bypasses RLS and must never
-- be present in browser JavaScript.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('virsapur-private','virsapur-private',false,12582912,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=false, file_size_limit=excluded.file_size_limit, allowed_mime_types=excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('virsapur-public','virsapur-public',true,12582912,array['image/webp'])
on conflict (id) do update set file_size_limit=excluded.file_size_limit, allowed_mime_types=excluded.allowed_mime_types;

create or replace function public.virsapur_media_referenced(media_id text)
returns boolean language sql stable as $$
  select exists(select 1 from public.cms_records where data::text like '%' || media_id || '%')
      or exists(select 1 from public.cms_singletons where data::text like '%' || media_id || '%');
$$;
revoke all on function public.virsapur_media_referenced(text) from public, anon, authenticated;

create index if not exists cms_records_status_idx on public.cms_records(status);
create index if not exists cms_records_collection_slug_idx on public.cms_records(collection,slug);
create index if not exists cms_revisions_lookup_idx on public.cms_revisions(collection,record_id,created_at desc);
create index if not exists cms_audit_created_idx on public.cms_audit_log(created_at desc);
create index if not exists cms_publish_jobs_created_idx on public.cms_publish_jobs(created_at desc);

-- After creating the first Auth user, grant ownership explicitly:
-- insert into public.admin_profiles(user_id,role,display_name)
-- values ('AUTH-USER-UUID','owner','Virsapur owner');
