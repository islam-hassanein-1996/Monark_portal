-- Portal schema introspection (read-only, safe to run).
--
-- Run in Supabase Studio -> SQL Editor against project gntvdgdpltvnowrexetb,
-- then paste the whole "info" column back. It reports every public table, its
-- columns, RLS state, policies, role grants, functions, and the auth user count.
--
-- Needed because publishable keys (sb_publishable_*) cannot read /rest/v1/
-- OpenAPI output, so the schema is not visible to the client at all.

with t as (
  select 1 ord, c.relname nm, '' sub,
         'TABLE   ' || rpad(c.relname, 30) || ' kind=' || c.relkind
           || ' rls=' || c.relrowsecurity || ' forced=' || c.relforcerowsecurity txt
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind in ('r', 'v', 'm', 'p', 'f')
),
c as (
  select 2 ord, table_name nm, ordinal_position::text sub,
         'COLUMN  ' || rpad(table_name, 30) || rpad(column_name, 26)
           || rpad(coalesce(udt_name, data_type), 16)
           || case when is_nullable = 'NO' then 'NOT NULL ' else '' end
           || coalesce('default=' || column_default, '') txt
  from information_schema.columns
  where table_schema = 'public'
),
p as (
  select 3 ord, tablename nm, policyname sub,
         'POLICY  ' || rpad(tablename, 30) || rpad(policyname, 34)
           || rpad(cmd, 8) || 'roles=' || array_to_string(roles, '+')
           || ' using=' || coalesce(qual, '-')
           || ' check=' || coalesce(with_check, '-') txt
  from pg_policies
  where schemaname = 'public'
),
g as (
  select 4 ord, table_name nm, grantee sub,
         'GRANT   ' || rpad(table_name, 30) || rpad(grantee, 16)
           || string_agg(privilege_type, ',' order by privilege_type) txt
  from information_schema.role_table_grants
  where table_schema = 'public' and grantee in ('anon', 'authenticated', 'service_role')
  group by table_name, grantee
),
f as (
  select 5 ord, pr.proname nm, pr.oid::text sub,
         'FUNC    ' || rpad(pr.proname, 30) || '(' || pg_get_function_arguments(pr.oid) || ') -> '
           || pg_get_function_result(pr.oid) || ' secdef=' || pr.prosecdef txt
  from pg_proc pr
  join pg_namespace n on n.oid = pr.pronamespace
  where n.nspname = 'public'
),
u as (
  select 6 ord, '' nm, '' sub, 'USERS   ' || count(*) || ' row(s) in auth.users' txt
  from auth.users
)
select txt as info
from (
  select * from t
  union all select * from c
  union all select * from p
  union all select * from g
  union all select * from f
  union all select * from u
) rows
order by ord, nm, sub;
