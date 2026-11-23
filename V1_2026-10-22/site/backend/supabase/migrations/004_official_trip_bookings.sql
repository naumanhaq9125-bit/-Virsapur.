-- UNAPPLIED. Requires migrations 001–003 and explicit TRIP_BOOKINGS_ENABLED=true.
-- Reservations use server-only service-role access; anonymous clients cannot read PII or write rows directly.
begin;

create table public.official_trip_bookings (
  id text primary key check(id ~ '^VT-[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'),
  trip_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  trip_slug text not null,
  trip_title text not null,
  full_name text not null check(length(full_name) between 2 and 80),
  email text not null check(length(email) between 3 and 254),
  phone text not null default '' check(length(phone)<=40),
  seats integer not null check(seats between 1 and 10),
  status text not null default 'confirmed' check(status in ('confirmed','cancelled')),
  created_at timestamptz not null default now()
);
create index official_trip_bookings_inventory on public.official_trip_bookings(trip_id,status);
create index official_trip_bookings_recent on public.official_trip_bookings(created_at desc);

create function public.official_trip_seats_used(p_trip_id text) returns integer
language sql stable security definer set search_path=public,pg_temp as $$
  select coalesce(sum(seats),0)::integer from public.official_trip_bookings where trip_id=p_trip_id and status='confirmed';
$$;

create function public.create_official_trip_booking(
  p_booking_id text,p_trip_id text,p_trip_slug text,p_trip_title text,
  p_user_id uuid,p_full_name text,p_email text,p_phone text,p_seats integer
) returns setof public.official_trip_bookings
language plpgsql security definer set search_path=public,pg_temp as $$
declare trip jsonb; booked integer; capacity integer;
begin
  if p_trip_id !~ '^[a-zA-Z0-9_-]{1,160}$' or p_booking_id !~ '^VT-[0-9a-fA-F-]{36}$' then raise exception 'Invalid reservation details' using errcode='22023'; end if;
  if length(p_full_name) not between 2 and 80 or length(p_email) not between 3 and 254 or length(p_phone)>40 or p_seats not between 1 and 10 then raise exception 'Check your contact details and seat count' using errcode='22023'; end if;
  perform pg_advisory_xact_lock(hashtext('official-trip:'||p_trip_id));
  select data into trip from public.cms_live_snapshots where content_kind='record' and collection='events' and record_id=p_trip_id limit 1;
  if trip is null or trip->>'status'<>'published' or trip->>'scheduleType'<>'heritage-trip' or trip->>'registrationState'<>'open' or nullif(trip->>'end','') is null or (trip->>'end')::timestamptz<now() then raise exception 'Reservations are closed for this trip' using errcode='P0001'; end if;
  capacity:=nullif(trip->>'capacity','')::integer;
  select coalesce(sum(seats),0) into booked from public.official_trip_bookings where trip_id=p_trip_id and status='confirmed';
  if capacity is not null and booked+p_seats>capacity then raise exception 'Not enough seats remain for this reservation' using errcode='P0001'; end if;
  if p_user_id is null then raise exception 'Sign in is required to reserve seats' using errcode='28000'; end if;
  return query insert into public.official_trip_bookings(id,trip_id,user_id,trip_slug,trip_title,full_name,email,phone,seats,status)
    values(p_booking_id,p_trip_id,p_user_id,p_trip_slug,p_trip_title,p_full_name,p_email,p_phone,p_seats,'confirmed') returning *;
end; $$;

alter table public.official_trip_bookings enable row level security;
revoke all on public.official_trip_bookings from public,anon,authenticated;
grant select,insert,update,delete on public.official_trip_bookings to service_role;
revoke all on function public.create_official_trip_booking(text,text,text,text,uuid,text,text,text,integer) from public,anon,authenticated;
grant execute on function public.create_official_trip_booking(text,text,text,text,uuid,text,text,text,integer) to service_role;
revoke all on function public.official_trip_seats_used(text) from public,anon,authenticated;
grant execute on function public.official_trip_seats_used(text) to service_role;
commit;
