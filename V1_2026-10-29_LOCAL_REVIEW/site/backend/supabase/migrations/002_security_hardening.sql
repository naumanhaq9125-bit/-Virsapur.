-- Virsapur fail-closed CMS hardening. Safe to apply after 001 and required for activation.
create extension if not exists pgcrypto;

drop policy if exists "Public can read published singleton snapshots" on public.cms_singletons;
drop policy if exists "Public can read published record snapshots" on public.cms_records;
drop policy if exists "Public can read redirects" on public.cms_redirects;

do $$ declare p record; begin
  for p in select schemaname,tablename,policyname from pg_policies where schemaname='public' and tablename=any(array['admin_profiles','cms_singletons','cms_records','cms_revisions','cms_redirects','cms_audit_log','cms_publish_jobs','cms_live_snapshots','cms_publication_versions','cms_rate_limits'])
  loop execute format('drop policy if exists %I on %I.%I',p.policyname,p.schemaname,p.tablename); end loop;
end $$;

revoke all on table public.admin_profiles, public.cms_singletons, public.cms_records,
  public.cms_revisions, public.cms_redirects, public.cms_audit_log, public.cms_publish_jobs
  from public, anon, authenticated;
revoke all on all sequences in schema public from public, anon, authenticated;

create table if not exists public.cms_live_snapshots (
  content_kind text not null check (content_kind in ('record','singleton')),
  collection text not null,
  record_id text not null,
  data jsonb not null,
  content_version text not null,
  live_at timestamptz not null default now(),
  primary key (content_kind, collection, record_id)
);

create table if not exists public.cms_publication_versions (
  id uuid primary key default gen_random_uuid(),
  content_kind text not null check (content_kind in ('record','singleton')),
  collection text not null,
  record_id text not null,
  action text not null check (action in ('publish','unpublish')),
  candidate_data jsonb,
  content_version text not null unique,
  state text not null default 'staged' check (state in ('staged','building','verified','live','failed','superseded','promotion_uncertain')),
  actor_id uuid not null references auth.users(id),
  deployment_id text,
  deployment_url text,
  deployment_created_at timestamptz,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  promoted_at timestamptz
);

create table if not exists public.cms_rate_limits (
  key_hash text primary key,
  window_started_at timestamptz not null,
  request_count integer not null check (request_count >= 0),
  updated_at timestamptz not null default now()
);

alter table public.cms_publish_jobs add column if not exists publication_version_id uuid references public.cms_publication_versions(id);
alter table public.cms_publish_jobs add column if not exists content_version text;
alter table public.cms_publish_jobs add column if not exists deployment_id text;
alter table public.cms_publish_jobs add column if not exists deployment_created_at timestamptz;
alter table public.cms_publish_jobs drop constraint if exists cms_publish_jobs_state_check;
alter table public.cms_publish_jobs add constraint cms_publish_jobs_state_check check (state in ('staged','building','verified','promoting','live','failed','promotion_uncertain'));

alter table public.cms_live_snapshots enable row level security;
alter table public.cms_publication_versions enable row level security;
alter table public.cms_rate_limits enable row level security;
revoke all on table public.cms_live_snapshots, public.cms_publication_versions, public.cms_rate_limits from public, anon, authenticated;

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('virsapur-private','virsapur-private',false,12582912,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('virsapur-public','virsapur-public',true,12582912,array['image/webp'])
on conflict (id) do update set file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
update storage.buckets set public=false where id='virsapur-media';
revoke all on table storage.objects from anon, authenticated;

create or replace function public.stage_cms_publication(
  p_content_kind text, p_collection text, p_record_id text, p_actor_id uuid, p_unpublish boolean default false
) returns public.cms_publication_versions
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_source jsonb; v_version text; v_row public.cms_publication_versions;
begin
  if not exists(select 1 from public.admin_profiles where user_id=p_actor_id and role='owner') then raise exception 'owner role required'; end if;
  if exists(select 1 from public.cms_publication_versions where state='promotion_uncertain') then raise exception 'publishing is blocked until the uncertain promotion is reconciled'; end if;
  if p_content_kind='singleton' then
    select data into v_source from public.cms_singletons where key=p_record_id for update;
  elsif p_content_kind='record' then
    select data into v_source from public.cms_records where collection=p_collection and id=p_record_id for update;
  else raise exception 'invalid content kind'; end if;
  if v_source is null then raise exception 'content not found'; end if;
  v_version := encode(digest(p_content_kind||':'||p_collection||':'||p_record_id||':'||clock_timestamp()::text||':'||gen_random_uuid()::text,'sha256'),'hex');
  insert into public.cms_publication_versions(content_kind,collection,record_id,action,candidate_data,content_version,actor_id)
  values(p_content_kind,p_collection,p_record_id,case when p_unpublish then 'unpublish' else 'publish' end,case when p_unpublish then null else v_source end,v_version,p_actor_id)
  returning * into v_row;
  insert into public.cms_publish_jobs(state,trigger,actor_id,publication_version_id,content_version,detail)
  values('staged',case when p_unpublish then 'unpublish' else 'publish' end,p_actor_id,v_row.id,v_version,jsonb_build_object('contentKind',p_content_kind,'collection',p_collection,'id',p_record_id));
  return v_row;
end $$;

create or replace function public.promote_cms_publication(p_version_id uuid,p_actor_id uuid)
returns public.cms_publication_versions
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_row public.cms_publication_versions;
begin
  if not exists(select 1 from public.admin_profiles where user_id=p_actor_id and role='owner') then raise exception 'owner role required'; end if;
  select * into v_row from public.cms_publication_versions where id=p_version_id for update;
  if v_row.id is null then raise exception 'publication version not found'; end if;
  if v_row.state <> 'verified' then raise exception 'only a verified deployment can become live'; end if;
  if v_row.action='unpublish' then
    delete from public.cms_live_snapshots where content_kind=v_row.content_kind and collection=v_row.collection and record_id=v_row.record_id;
  else
    insert into public.cms_live_snapshots(content_kind,collection,record_id,data,content_version,live_at)
    values(v_row.content_kind,v_row.collection,v_row.record_id,v_row.candidate_data,v_row.content_version,now())
    on conflict(content_kind,collection,record_id) do update set data=excluded.data,content_version=excluded.content_version,live_at=excluded.live_at;
  end if;
  update public.cms_publication_versions set state='superseded',updated_at=now()
    where id<>v_row.id and content_kind=v_row.content_kind and collection=v_row.collection and record_id=v_row.record_id and state='live';
  update public.cms_publication_versions set state='live',promoted_at=now(),updated_at=now() where id=v_row.id returning * into v_row;
  update public.cms_publish_jobs set state='live',updated_at=now() where publication_version_id=v_row.id;
  if v_row.content_kind='record' then
    update public.cms_records set published_data=v_row.candidate_data,status=case when v_row.action='unpublish' then 'draft' else 'published' end,published_at=case when v_row.action='unpublish' then null else now() end where collection=v_row.collection and id=v_row.record_id;
  else
    update public.cms_singletons set published_data=v_row.candidate_data,status=case when v_row.action='unpublish' then 'draft' else 'published' end,published_at=case when v_row.action='unpublish' then null else now() end where key=v_row.record_id;
  end if;
  return v_row;
end $$;

create or replace function public.consume_cms_rate_limit(p_key_hash text,p_limit integer,p_window_seconds integer)
returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
declare v_count integer;
begin
  insert into public.cms_rate_limits(key_hash,window_started_at,request_count) values(p_key_hash,now(),1)
  on conflict(key_hash) do update set
    window_started_at=case when public.cms_rate_limits.window_started_at < now()-make_interval(secs=>p_window_seconds) then now() else public.cms_rate_limits.window_started_at end,
    request_count=case when public.cms_rate_limits.window_started_at < now()-make_interval(secs=>p_window_seconds) then 1 else public.cms_rate_limits.request_count+1 end,
    updated_at=now() returning request_count into v_count;
  return v_count <= p_limit;
end $$;

revoke all on function public.stage_cms_publication(text,text,text,uuid,boolean) from public,anon,authenticated;
revoke all on function public.promote_cms_publication(uuid,uuid) from public,anon,authenticated;
revoke all on function public.consume_cms_rate_limit(text,integer,integer) from public,anon,authenticated;
grant execute on function public.stage_cms_publication(text,text,text,uuid,boolean) to service_role;
grant execute on function public.promote_cms_publication(uuid,uuid) to service_role;
grant execute on function public.consume_cms_rate_limit(text,integer,integer) to service_role;

create index if not exists cms_live_snapshot_version_idx on public.cms_live_snapshots(content_version);
create index if not exists cms_publication_target_idx on public.cms_publication_versions(content_kind,collection,record_id,created_at desc);
create unique index if not exists cms_publish_jobs_deployment_id_idx on public.cms_publish_jobs(deployment_id) where deployment_id is not null;
