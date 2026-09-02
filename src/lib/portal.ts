import { db } from './supabase'

export type AppKind = 'static' | 'embed' | 'redirect'

export type PortalApp = {
  id: string
  slug: string
  name: string
  description: string | null
  url: string
  kind: AppKind
  icon: string | null
  sort_order: number
}

export type Profile = {
  id: string
  email: string | null
  role: string
}

export type Target =
  | { mode: 'iframe'; src: string }
  | { mode: 'external'; href: string }
  | { mode: 'blocked'; reason: string }

// url comes out of the database, so it is untrusted input to a navigation.
// Allowed: absolute http(s), or a same-origin path. `//host` and `/\host` are
// protocol-relative and would leave the origin, so they are rejected.
const ALLOWED = /^(https?:\/\/|\/(?![/\\]))/i

export function resolveTarget(app: Pick<PortalApp, 'kind' | 'url'>): Target {
  const raw = app.url.trim()

  const url = app.kind === 'static' && !raw.startsWith('/') ? `/pages/${raw}` : raw
  if (!ALLOWED.test(url)) return { mode: 'blocked', reason: `unsupported url scheme: ${raw}` }

  return app.kind === 'redirect' ? { mode: 'external', href: url } : { mode: 'iframe', src: url }
}

export async function fetchApps(): Promise<PortalApp[]> {
  // RLS decides which rows this user may see, so no permission filter is needed here.
  const { data, error } = await db()
    .from('portal_apps')
    .select('id, slug, name, description, url, kind, icon, sort_order')
    .order('sort_order', { ascending: true })

  if (error) throw error
  return (data ?? []) as PortalApp[]
}

export async function fetchApp(slug: string): Promise<PortalApp | null> {
  const { data, error } = await db()
    .from('portal_apps')
    .select('id, slug, name, description, url, kind, icon, sort_order')
    .eq('slug', slug)
    .maybeSingle()

  if (error) throw error
  return (data as PortalApp) ?? null
}

/**
 * The signed-in user's profile row. Roles are display-only on the client --
 * public.portal_apps RLS is what actually decides which apps come back.
 */
export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await db()
    .from('profiles')
    .select('id, email, role')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw error
  return (data as Profile) ?? null
}
