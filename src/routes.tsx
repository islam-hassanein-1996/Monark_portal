import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { db } from './lib/supabase'
import { useSession } from './lib/auth'
import { fetchApp, fetchApps, resolveTarget, type PortalApp } from './lib/portal'
import { loadApps, saveApps } from './lib/offline'

export function Login() {
  const { session } = useSession()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const from = (location.state as { from?: string } | null)?.from ?? '/'
  if (session) return <Navigate to={from} replace />

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    const { error } = await db().auth.signInWithPassword({ email, password })
    setBusy(false)
    if (error) setError(error.message)
    else navigate(from, { replace: true })
  }

  return (
    <form className="card login" onSubmit={submit}>
      <h1>Sign in</h1>
      <label htmlFor="email">Email</label>
      <input
        id="email"
        type="email"
        autoComplete="username"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <label htmlFor="password">Password</label>
      <input
        id="password"
        type="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {error && <p role="alert" className="error">{error}</p>}
      <button type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      <p className="muted">Accounts are provisioned by an administrator.</p>
    </form>
  )
}

export function Dashboard() {
  const { session, profile } = useSession()
  const [apps, setApps] = useState<PortalApp[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isCached, setIsCached] = useState(false)
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true))

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    let live = true
    const uid = session?.user.id

    fetchApps()
      .then((data) => {
        if (!live) return
        setApps(data)
        setIsCached(false)
        setError(null)
        if (uid) saveApps(uid, data)
      })
      .catch((e: Error) => {
        if (!live) return
        if (uid) {
          const cached = loadApps(uid)
          if (cached) {
            setApps(cached)
            setIsCached(true)
            setError(null)
            return
          }
        }
        setError(e.message)
      })

    return () => {
      live = false
    }
  }, [session?.user.id])

  if (error) return <p role="alert" className="error">Could not load your apps: {error}</p>
  if (!apps) return <p className="muted">Loading apps…</p>

  const isOfflineMode = isCached || !isOnline

  if (apps.length === 0) {
    return (
      <>
        {isOfflineMode && (
          <div className="card offline-banner" role="status">
            Offline Mode — Viewing cached tools
          </div>
        )}
        <p className="muted">
          No applications are assigned to
          {profile ? ` the “${profile.role}” role` : ' your account'} yet.
        </p>
      </>
    )
  }

  return (
    <>
      {isOfflineMode && (
        <div className="card offline-banner" role="status">
          Offline Mode — Viewing cached tools
        </div>
      )}
      <ul className="grid">
        {apps.map((app) => {
          const target = resolveTarget(app)
          const isRedirectDisabled = app.kind === 'redirect' && !isOnline

          return (
            <li key={app.id} className={`card tile ${isRedirectDisabled ? 'disabled' : ''}`}>
              <span className="icon" aria-hidden="true">{app.icon ?? '▦'}</span>
              {isRedirectDisabled ? (
                <>
                  <span className="tile-title">{app.name}</span>
                  <span className="badge">Requires connection</span>
                </>
              ) : target.mode === 'external' ? (
                <a href={target.href} target="_blank" rel="noopener noreferrer">{app.name}</a>
              ) : (
                <Link to={`/a/${app.slug}`}>{app.name}</Link>
              )}
              {app.description && <p className="muted">{app.description}</p>}
            </li>
          )
        })}
      </ul>
    </>
  )
}

export function AppView() {
  const { slug = '' } = useParams()
  const [loaded, setLoaded] = useState<{ slug: string; app: PortalApp | null } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let live = true
    fetchApp(slug)
      .then((app) => live && setLoaded({ slug, app }))
      .catch((e: Error) => live && setError(e.message))
    return () => {
      live = false
    }
  }, [slug])

  // Keyed by slug so a stale in-flight response for a previous slug cannot land here.
  const app = loaded?.slug === slug ? loaded.app : undefined

  if (error) return <p role="alert" className="error">{error}</p>
  if (app === undefined) return <p className="muted">Loading…</p>
  // null covers both "no such slug" and "RLS hid this row" — the client cannot tell them apart.
  if (app === null) return <p role="alert" className="error">This application is not available for your account.</p>

  const target = resolveTarget(app)
  if (target.mode === 'blocked') {
    return <p role="alert" className="error">Blocked: {target.reason}</p>
  }
  if (target.mode === 'external') {
    return (
      <p>
        <a href={target.href} target="_blank" rel="noopener noreferrer">Open {app.name}</a>
      </p>
    )
  }

  return (
    <iframe
      className="embed"
      src={target.src}
      title={app.name}
      sandbox="allow-scripts allow-forms allow-same-origin allow-popups"
    />
  )
}
