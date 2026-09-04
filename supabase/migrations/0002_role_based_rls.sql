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

-- Clean up legacy security definer helper function to avoid optimization barrier.
drop function if exists public.portal_role();

-- 0001's interim policy let any signed-in user see every active app. Permissive
-- policies OR together, so it has to go or it would override the role check below.
drop policy if exists portal_apps_select_authenticated on public.portal_apps;

-- Direct subquery allows Postgres planner to evaluate (select role from profiles)
-- as an InitPlan once per query instead of invoking a SECURITY DEFINER function per row.
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
      or (select role from public.profiles where id = auth.uid()) = any (allowed_roles)
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
