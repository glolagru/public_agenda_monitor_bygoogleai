-- Migration 202609130002: Review Entries, scoring, priority, and broader event types
alter table public.events drop constraint if exists events_event_type_check;
alter table public.events add constraint events_event_type_check check (event_type in ('hearing', 'judgment', 'appointment', 'panel', 'report', 'outlook', 'decision'));

alter table public.events add column if not exists suggested_score integer default 3 check (suggested_score between 1 and 5);
alter table public.events add column if not exists suggested_score_rule text;
alter table public.events add column if not exists suggested_score_adjustment numeric default 0;
alter table public.events add column if not exists group_approval_rate numeric default 0;
alter table public.events add column if not exists editorial_score integer check (editorial_score between 1 and 5);
alter table public.events add column if not exists manual_priority integer default 0;

create table if not exists public.review_entries (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  decision text not null check (decision in ('approved', 'rejected', 'updated', 'deferred')),
  editorial_score integer check (editorial_score between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

alter table public.review_entries enable row level security;
