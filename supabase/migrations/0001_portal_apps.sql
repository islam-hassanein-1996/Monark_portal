-- 0001: portal app registry.
--
-- Additive only. Does not touch the existing public.profiles or public.workspaces.
--
-- Access model, staged deliberately:
--   * This migration grants SELECT to `authenticated` and nothing to `anon`, so the
--     registry is visible to any signed-in user and invisible to the public.
--   * No INSERT/UPDATE/DELETE policy exists, so with RLS on, the registry is
--     writable only through the dashboard or a secret/service key.
--   * Per-role visibility lands in 0002, once the real roles/permissions columns on
--     public.profiles are known. The frontend needs no change for that: it selects
--     the whole table and lets RLS decide which rows come back.

create table if not exists public.portal_apps (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]*$'),
  name        text not null,
  description text,
  -- static: a file under public/pages/, e.g. 'reports.html'
  -- embed:   absolute https url rendered in a sandboxed iframe
  -- redirect: absolute https url opened in a new tab
  url         text not null,
  kind        text not null check (kind in ('static', 'embed', 'redirect')),
  icon        text,
  sort_order  integer not null default 100,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table public.portal_apps enable row level security;

revoke all on public.portal_apps from anon;
grant select on public.portal_apps to authenticated;

drop policy if exists portal_apps_select_authenticated on public.portal_apps;
create policy portal_apps_select_authenticated
  on public.portal_apps
  for select
  to authenticated
  using (is_active);

insert into public.portal_apps (slug, name, description, url, kind, icon, sort_order)
values ('example', 'Example static page', 'Sample page served from public/pages/.', 'example.html', 'static', '▦', 10)
on conflict (slug) do nothing;
