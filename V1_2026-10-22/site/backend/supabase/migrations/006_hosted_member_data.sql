-- Hosted member account data and booking/request extensions.
-- Apply only after 001–005. Runtime access is server-only through service_role.
begin;

create table if not exists public.member_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (length(full_name) between 2 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create or replace function public.virsapur_create_member_profile() returns trigger
language plpgsql security definer set search_path=public,pg_temp as $$
begin
  insert into public.member_profiles(user_id,full_name) values(new.id,left(coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'),''),'New member'),80)) on conflict (user_id) do nothing;
  return new;
end; $$;
drop trigger if exists virsapur_auth_member_profile on auth.users;
create trigger virsapur_auth_member_profile after insert on auth.users for each row execute function public.virsapur_create_member_profile();
insert into public.member_profiles(user_id,full_name)
  select id,left(coalesce(nullif(trim(raw_user_meta_data->>'full_name'),''),'Virsapur member'),80) from auth.users
  on conflict (user_id) do nothing;
create table if not exists public.member_places (
  user_id uuid not null references auth.users(id) on delete cascade,
  place_id text not null check (length(place_id) between 1 and 160),
  list_type text not null check (list_type in ('wishlist','visited')),
  created_at timestamptz not null default now(),
  primary key (user_id,place_id,list_type)
);
create index if not exists member_places_user_list_idx on public.member_places(user_id,list_type,created_at desc);
create table if not exists public.member_trips (
  user_id uuid not null references auth.users(id) on delete cascade,
  trip_id text not null check (length(trip_id) between 1 and 160),
  trip_data jsonb not null check (jsonb_typeof(trip_data)='object' and octet_length(trip_data::text)<=262144),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id,trip_id)
);
create index if not exists member_trips_user_updated_idx on public.member_trips(user_id,updated_at desc);
create table if not exists public.saved_articles (
  user_id uuid not null references auth.users(id) on delete cascade,
  article_id text not null check (length(article_id) between 1 and 160),
  saved_at timestamptz not null default now(),
  primary key (user_id,article_id)
);
create index if not exists saved_articles_user_saved_idx on public.saved_articles(user_id,saved_at desc);

alter table public.custom_tour_quote_requests
  add column if not exists request_type text not null default 'public_quote' check (request_type in ('public_quote','member_custom_trip')),
  add column if not exists member_user_id uuid references auth.users(id) on delete set null,
  add column if not exists member_trip_id text,
  add column if not exists custom_trip jsonb check (custom_trip is null or (jsonb_typeof(custom_trip)='object' and octet_length(custom_trip::text)<=32768));
create unique index if not exists member_custom_trip_active_idx on public.custom_tour_quote_requests(member_user_id,member_trip_id) where request_type='member_custom_trip' and status in ('new','reviewing','quoted','confirmed','approved','declined');
create index if not exists member_custom_trip_member_idx on public.custom_tour_quote_requests(member_user_id,created_at desc) where request_type='member_custom_trip';
drop index if exists public.custom_tour_quotes_search;
alter table public.custom_tour_quote_requests drop column if exists search_text;
alter table public.custom_tour_quote_requests add column search_text text generated always as (lower(id || ' ' || coalesce(request_data->>'customerName','') || ' ' || coalesce(request_data->>'email','') || ' ' || coalesce(request_data->>'heritagePlaceIds','') || ' ' || coalesce(custom_trip->>'tripName',''))) stored;
create index custom_tour_quotes_search on public.custom_tour_quote_requests using gin(to_tsvector('simple',search_text));

alter table public.official_trip_bookings add column if not exists payment_status text not null default 'not_required' check (payment_status in ('not_required','checkout_pending','paid','expired','failed','paid_needs_review'));
alter table public.official_trip_bookings add column if not exists stripe_session_id text;
alter table public.official_trip_bookings add column if not exists payment_intent_id text;
alter table public.official_trip_bookings add column if not exists payment_amount integer;
alter table public.official_trip_bookings add column if not exists payment_currency text;
alter table public.official_trip_bookings add column if not exists paid_at timestamptz;
alter table public.official_trip_bookings add column if not exists hold_expires_at timestamptz;
alter table public.official_trip_bookings add column if not exists reviewed_by uuid references auth.users(id);
alter table public.official_trip_bookings add column if not exists reviewed_at timestamptz;
alter table public.official_trip_bookings drop constraint if exists official_trip_bookings_status_check;
alter table public.official_trip_bookings add constraint official_trip_bookings_status_check check (status in ('pending','pending_payment','confirmed','declined','cancelled'));
create unique index if not exists official_trip_bookings_stripe_session_idx on public.official_trip_bookings(stripe_session_id) where stripe_session_id is not null;

create or replace function public.official_trip_seats_used(p_trip_id text) returns integer
language plpgsql security definer set search_path=public,pg_temp as $$
begin
  update public.official_trip_bookings set status='cancelled',payment_status='expired',hold_expires_at=null
    where trip_id=p_trip_id and status='pending_payment' and hold_expires_at is not null and hold_expires_at<=now();
  return (select coalesce(sum(seats),0)::integer from public.official_trip_bookings
    where trip_id=p_trip_id and status in ('pending','confirmed','pending_payment'));
end; $$;

create or replace function public.create_official_trip_booking(
  p_booking_id text,p_trip_id text,p_trip_slug text,p_trip_title text,
  p_user_id uuid,p_full_name text,p_email text,p_phone text,p_seats integer,p_status text
) returns setof public.official_trip_bookings
language plpgsql security definer set search_path=public,pg_temp as $$
declare trip jsonb; booked integer; capacity integer;
begin
  if p_trip_id !~ '^[a-zA-Z0-9][a-zA-Z0-9 _.-]{0,159}$' or p_booking_id !~ '^VT-[0-9a-fA-F-]{36}$' then raise exception 'Invalid reservation details' using errcode='22023'; end if;
  if p_status not in ('pending','pending_payment') or length(p_full_name) not between 2 and 80 or length(p_email) not between 3 and 254 or length(p_phone)>40 or p_seats not between 1 and 10 then raise exception 'Check your reservation details' using errcode='22023'; end if;
  if p_user_id is null then raise exception 'Sign in is required to reserve seats' using errcode='28000'; end if;
  perform pg_advisory_xact_lock(hashtext('official-trip:'||p_trip_id));
  select data into trip from public.cms_live_snapshots where content_kind='record' and collection='events' and record_id=p_trip_id limit 1;
  if trip is null or trip->>'status'<>'published' or trip->>'scheduleType'<>'heritage-trip' or trip->>'registrationState'<>'open' or nullif(trip->>'end','') is null or (trip->>'end')::timestamptz<now() then raise exception 'Reservations are closed for this trip' using errcode='P0001'; end if;
  capacity:=nullif(trip->>'capacity','')::integer;
  update public.official_trip_bookings set status='cancelled',payment_status='expired',hold_expires_at=null where trip_id=p_trip_id and status='pending_payment' and hold_expires_at is not null and hold_expires_at<=now();
  select coalesce(sum(seats),0) into booked from public.official_trip_bookings where trip_id=p_trip_id and status in ('pending','confirmed','pending_payment');
  if capacity is not null and booked+p_seats>capacity then raise exception 'Not enough seats remain for this reservation' using errcode='P0001'; end if;
  return query insert into public.official_trip_bookings(id,trip_id,user_id,trip_slug,trip_title,full_name,email,phone,seats,status,payment_status,payment_amount,payment_currency)
    values(p_booking_id,p_trip_id,p_user_id,p_trip_slug,p_trip_title,p_full_name,p_email,p_phone,p_seats,p_status,case when p_status='pending_payment' then 'checkout_pending' else 'not_required' end,case when p_status='pending_payment' then null else null end,null) returning *;
end; $$;

alter table public.member_profiles enable row level security;
alter table public.member_places enable row level security;
alter table public.member_trips enable row level security;
alter table public.saved_articles enable row level security;
revoke all on public.member_profiles,public.member_places,public.member_trips,public.saved_articles from public,anon,authenticated;
grant select,insert,update,delete on public.member_profiles,public.member_places,public.member_trips,public.saved_articles to service_role;
grant select,insert,update,delete on public.custom_tour_quote_requests,public.official_trip_bookings to service_role;
revoke all on function public.official_trip_seats_used(text) from public,anon,authenticated;
grant execute on function public.official_trip_seats_used(text) to service_role;
revoke all on function public.create_official_trip_booking(text,text,text,text,uuid,text,text,text,integer,text) from public,anon,authenticated;
grant execute on function public.create_official_trip_booking(text,text,text,text,uuid,text,text,text,integer,text) to service_role;
revoke all on function public.virsapur_create_member_profile() from public,anon,authenticated;
commit;
