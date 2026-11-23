-- Add explicit admin decisions for custom trip plan reviews.
-- Preserve legacy "confirmed" and "closed" records during rollout.
begin;

alter table public.custom_tour_quote_requests
  drop constraint if exists custom_tour_quote_requests_status_check;

alter table public.custom_tour_quote_requests
  add constraint custom_tour_quote_requests_status_check
  check (status in ('new','reviewing','quoted','confirmed','approved','declined','closed'));

commit;
