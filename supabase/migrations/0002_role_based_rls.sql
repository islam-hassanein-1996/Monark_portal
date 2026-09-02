-- 0002: role-based visibility for public.portal_apps.
--
-- Depends on 0001 (run that first). Roles live in public.profiles.role, which is
-- NOT NULL and defaults to 'viewer'. Reuses the existing SECURITY DEFINER helper
-- public.is_admin() rather than restating what "admin" means.
--
-- Visibility model, on portal_apps.allowed_roles:
--   NULL              -> visible to every signed-in user
--   array['editor']   -> visible to users whose profiles.role is in the array
--   array[]::text[]   -> visible to admins only
-- Admins also see rows with is_active = false.

alter table public.portal_apps
  add column if not exists allowed_roles text[];

comment on column public.portal_apps.allowed_roles is
  'NULL = any signed-in user. Otherwise profiles.role must appear in this array.';

-- Reading profiles.role from inside a policy has to get past the "read own
-- profile" policy on public.profiles, so this follows the SECURITY DEFINER
-- pattern already used by is_admin() and can_edit().
create or replace function public.portal_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.role from public.profiles p where p.id = auth.uid()
$$;

revoke all on function public.portal_role() from public;
grant execute on function public.portal_role() to authenticated;

-- 0001's interim policy let any signed-in user see every active app. Permissive
-- policies OR together, so it has to go or it would override the role check below.
drop policy if exists portal_apps_select_authenticated on public.portal_apps;

drop policy if exists portal_apps_select_by_role on public.portal_apps;
create policy portal_apps_select_by_role
  on public.portal_apps
  for select
  to authenticated
  using (
    is_active
    and (
      allowed_roles is null
      -- A signed-in user with no profiles row yields NULL here and matches nothing,
      -- so a missing profile fails closed.
      or public.portal_role() = any (allowed_roles)
    )
  );

drop policy if exists portal_apps_select_admin on public.portal_apps;
create policy portal_apps_select_admin
  on public.portal_apps
  for select
  to authenticated
  using (public.is_admin());

-- Registry writes stay off the API surface: no INSERT/UPDATE/DELETE grant to
-- `authenticated`, so portal_apps is editable only from the dashboard or with a
-- secret key. To let admins manage it in-app later, add those grants plus a
-- `for all to authenticated using (public.is_admin()) with check (public.is_admin())`
-- policy -- the grant alone changes nothing while RLS is on.

-- Restricting an app, for reference:
--   update public.portal_apps set allowed_roles = array['editor', 'admin'] where slug = 'reports';
