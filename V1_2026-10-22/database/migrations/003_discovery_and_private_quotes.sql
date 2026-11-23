-- UNAPPLIED. Requires 001 + 002. No local application or hosted activation is implied.
-- JSONB records and live snapshots remain the sole editorial/publication authority.
begin;

create table public.cms_discovery_index (
  scope text not null check(scope in ('working','live')),
  collection text not null,
  record_id text not null,
  status text not null,
  slug text,
  title text not null default '',
  summary text not null default '',
  category_ids text[] not null default '{}',
  province_ids text[] not null default '{}',
  district_ids text[] not null default '{}',
  tags text[] not null default '{}',
  content_type text not null default '',
  search_document tsvector not null,
  primary key(scope,collection,record_id)
);
create index cms_discovery_status on public.cms_discovery_index(scope,collection,status,record_id);
create index cms_discovery_search on public.cms_discovery_index using gin(search_document);
create index cms_discovery_categories on public.cms_discovery_index using gin(category_ids);
create index cms_discovery_provinces on public.cms_discovery_index using gin(province_ids);
create index cms_discovery_districts on public.cms_discovery_index using gin(district_ids);
create index cms_discovery_tags on public.cms_discovery_index using gin(tags);

create table public.cms_content_relationships (
  scope text not null,
  collection text not null,
  record_id text not null,
  relationship text not null,
  target_id text not null,
  position integer not null,
  primary key(scope,collection,record_id,relationship,target_id),
  foreign key(scope,collection,record_id) references public.cms_discovery_index on delete cascade
);
create index cms_relationship_inverse on public.cms_content_relationships(scope,relationship,target_id,collection,record_id);

create table public.cms_heritage_components (
  scope text not null,
  collection text not null check(collection='heritagePlaces'),
  record_id text not null,
  component_id text not null,
  position integer not null,
  latitude numeric check(latitude between -90 and 90),
  longitude numeric check(longitude between -180 and 180),
  coordinate_status text,
  coordinate_source text,
  data jsonb not null,
  primary key(scope,collection,record_id,component_id),
  foreign key(scope,collection,record_id) references public.cms_discovery_index on delete cascade,
  check((latitude is null)=(longitude is null))
);
create index cms_components_point on public.cms_heritage_components(scope,latitude,longitude) where latitude is not null;

create function public.cms_text_array(value jsonb) returns text[]
language sql immutable set search_path=public,pg_temp as $$
  select coalesce(array_agg(item #>> '{}'),'{}'::text[])
  from jsonb_array_elements(case when jsonb_typeof(value)='array' then value else '[]'::jsonb end) item
  where jsonb_typeof(item)='string' and item #>> '{}' <> '';
$$;

create function public.cms_refresh_discovery(p_scope text,p_collection text,p_id text,p_status text,p_data jsonb)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare categories text[]; provinces text[]; districts text[]; labels text[]; relation text; part jsonb; idx bigint;
begin
  delete from public.cms_discovery_index where scope=p_scope and collection=p_collection and record_id=p_id;
  if p_data is null then return; end if;
  categories := public.cms_text_array(p_data->'categoryIds');
  if nullif(p_data->>'primaryCategoryId','') is not null and not (p_data->>'primaryCategoryId'=any(categories)) then categories:=array_append(categories,p_data->>'primaryCategoryId'); end if;
  provinces:=public.cms_text_array(p_data->'provinceIds') || public.cms_text_array(p_data->'regionIds');
  if nullif(p_data->>'regionId','') is not null then provinces:=array_append(provinces,p_data->>'regionId'); end if;
  districts:=public.cms_text_array(p_data->'relatedDistrictIds') || public.cms_text_array(p_data->'districtIds');
  if nullif(p_data->>'districtId','') is not null then districts:=array_append(districts,p_data->>'districtId'); end if;
  -- Reuse explicit component assignments only. Source district names are not reliable administrative IDs.
  if p_collection='heritagePlaces' then
    for part in select value from jsonb_array_elements(case when jsonb_typeof(p_data->'components')='array' then p_data->'components' else '[]'::jsonb end) loop
      provinces:=provinces || public.cms_text_array(part->'regionIds');
      districts:=districts || public.cms_text_array(part->'districtIds');
      if nullif(part->>'regionId','') is not null then provinces:=array_append(provinces,part->>'regionId'); end if;
      if nullif(part->>'districtId','') is not null then districts:=array_append(districts,part->>'districtId'); end if;
    end loop;
  end if;
  select coalesce(array_agg(distinct item),'{}'::text[]) into provinces from unnest(provinces) item;
  select coalesce(array_agg(distinct item),'{}'::text[]) into districts from unnest(districts) item;
  labels:=public.cms_text_array(p_data->'tags');
  insert into public.cms_discovery_index(scope,collection,record_id,status,slug,title,summary,category_ids,province_ids,district_ids,tags,content_type,search_document)
  values(p_scope,p_collection,p_id,p_status,p_data->>'slug',coalesce(p_data->>'title',p_data->>'name',''),coalesce(p_data->>'summary',''),categories,provinces,districts,labels,coalesce(p_data->>'contentType',p_data->>'type',p_data->>'recordType',''),
    to_tsvector('simple',concat_ws(' ',p_data->>'title',p_data->>'name',p_data->>'summary',p_data->>'category',p_data->>'province',p_data->>'district',array_to_string(labels,' '))));
  -- Only authored forward relationships are indexed; no inverse state is written into content.
  foreach relation in array array['relatedHeritageIds','relatedDistrictIds','relatedStoryIds','relatedProjectIds','relatedProgrammeIds','categoryIds'] loop
    insert into public.cms_content_relationships(scope,collection,record_id,relationship,target_id,position)
    select p_scope,p_collection,p_id,relation,item,min(ordinality)::integer
    from unnest(public.cms_text_array(p_data->relation)) with ordinality u(item,ordinality)
    group by item;
  end loop;
  if p_collection='heritagePlaces' then
    for part,idx in select value,ordinality from jsonb_array_elements(case when jsonb_typeof(p_data->'components')='array' then p_data->'components' else '[]'::jsonb end) with ordinality loop
      -- Missing points remain NULL; never invent a centroid, identity or precision.
      if nullif(part->>'id','') is null then raise exception 'Heritage component requires a stable ID'; end if;
      insert into public.cms_heritage_components(scope,collection,record_id,component_id,position,latitude,longitude,coordinate_status,coordinate_source,data)
      values(p_scope,p_collection,p_id,part->>'id',idx::integer,(part->>'latitude')::numeric,(part->>'longitude')::numeric,part->>'coordinateStatus',part->>'coordinateSource',part);
    end loop;
  end if;
end; $$;

create function public.cms_discovery_trigger() returns trigger
language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if tg_table_name='cms_records' then
    if tg_op='DELETE' then perform public.cms_refresh_discovery('working',old.collection,old.id,old.status,null); return old; end if;
    if tg_op='UPDATE' and (old.collection,old.id) is distinct from (new.collection,new.id) then perform public.cms_refresh_discovery('working',old.collection,old.id,old.status,null); end if;
    perform public.cms_refresh_discovery('working',new.collection,new.id,new.status,new.data);
  else
    if tg_op='DELETE' then
      if old.content_kind='record' then perform public.cms_refresh_discovery('live',old.collection,old.record_id,'published',null); end if;
      return old;
    end if;
    if tg_op='UPDATE' and old.content_kind='record' and (old.content_kind,old.collection,old.record_id) is distinct from (new.content_kind,new.collection,new.record_id) then
      perform public.cms_refresh_discovery('live',old.collection,old.record_id,'published',null);
    end if;
    if new.content_kind='record' then perform public.cms_refresh_discovery('live',new.collection,new.record_id,'published',new.data); end if;
  end if;
  return new;
end; $$;
create trigger cms_working_discovery after insert or update or delete on public.cms_records for each row execute function public.cms_discovery_trigger();
create trigger cms_live_discovery after insert or update or delete on public.cms_live_snapshots for each row execute function public.cms_discovery_trigger();
select public.cms_refresh_discovery('working',collection,id,status,data) from public.cms_records;
select public.cms_refresh_discovery('live',collection,record_id,'published',data) from public.cms_live_snapshots where content_kind='record';

create table public.custom_tour_quote_requests (
  id text primary key check(id ~ '^VQ-[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'),
  request_data jsonb not null check(jsonb_typeof(request_data)='object'),
  origin text not null default 'Lahore',
  status text not null default 'new' check(status in ('new','reviewing','quoted','confirmed','closed')),
  internal_notes text not null default '' check(length(internal_notes)<=10000),
  quoted_amount numeric check(quoted_amount between 0 and 100000000),
  quote_currency text not null default 'PKR' check(quote_currency ~ '^[A-Z]{3}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),
  search_text text generated always as (lower(id || ' ' || coalesce(request_data->>'customerName','') || ' ' || coalesce(request_data->>'email','') || ' ' || coalesce(request_data->>'heritagePlaceIds',''))) stored,
  check(request_data - array['requestedDate','groupSize','durationPreference','heritagePlaceIds','customerName','email','phone','transportPreference','specialRequirements','notes'] = '{}'::jsonb),
  check(request_data ?& array['groupSize','heritagePlaceIds','customerName','email','phone','durationPreference']),
  check(jsonb_typeof(request_data->'customerName')='string' and jsonb_typeof(request_data->'email')='string' and jsonb_typeof(request_data->'phone')='string' and jsonb_typeof(request_data->'durationPreference')='string'),
  check(jsonb_typeof(request_data->'heritagePlaceIds')='array'),
  check(jsonb_array_length(request_data->'heritagePlaceIds') between 1 and 40),
  check(jsonb_typeof(request_data->'groupSize')='number' and (request_data->>'groupSize')::numeric between 1 and 200 and (request_data->>'groupSize')::numeric=trunc((request_data->>'groupSize')::numeric)),
  check(length(request_data->>'customerName') between 2 and 120),
  check(length(request_data->>'email') between 3 and 254),
  check(length(request_data->>'phone') between 7 and 40),
  check(length(request_data->>'durationPreference') between 1 and 120),
  check(length(coalesce(request_data->>'transportPreference',''))<=120),
  check(length(coalesce(request_data->>'specialRequirements',''))<=1500),
  check(length(coalesce(request_data->>'notes',''))<=3000),
  check(octet_length(request_data::text)<=32768)
);
create index custom_tour_quotes_status_date on public.custom_tour_quote_requests(status,created_at desc,id desc);
create index custom_tour_quotes_date on public.custom_tour_quote_requests(created_at desc,id desc);
-- Full-text index is available to a future guarded API; current bounded admin substring search is not falsely advertised as index-backed.
create index custom_tour_quotes_search on public.custom_tour_quote_requests using gin(to_tsvector('simple',search_text));

alter table public.cms_discovery_index enable row level security;
alter table public.cms_content_relationships enable row level security;
alter table public.cms_heritage_components enable row level security;
alter table public.custom_tour_quote_requests enable row level security;
revoke all on public.cms_discovery_index,public.cms_content_relationships,public.cms_heritage_components,public.custom_tour_quote_requests from public,anon,authenticated;
grant select,insert,update,delete on public.cms_discovery_index,public.cms_content_relationships,public.cms_heritage_components,public.custom_tour_quote_requests to service_role;
revoke all on function public.cms_text_array(jsonb),public.cms_refresh_discovery(text,text,text,text,jsonb),public.cms_discovery_trigger() from public,anon,authenticated;
grant execute on function public.cms_text_array(jsonb),public.cms_refresh_discovery(text,text,text,text,jsonb),public.cms_discovery_trigger() to service_role;
commit;
