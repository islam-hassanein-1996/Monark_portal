import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { Navigate, useLocation } from 'react-router-dom'
import { db } from './supabase'
import { fetchProfile, type Profile } from './portal'

type State = {
  session: Session | null
  /** undefined while loading, null when absent or unreadable. Display only. */
  profile: Profile | null | undefined
  loading: boolean
}

const SessionCtx = createContext<State>({ session: null, profile: undefined, loading: true })

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({ session: null, profile: undefined, loading: true })
  const loadedFor = useRef<string | null>(null)

  useEffect(() => {
    const auth = db().auth
    let live = true

    function apply(session: Session | null) {
      if (!live) return

      const uid = session?.user.id ?? null
      // Token refreshes re-emit the same user; don't refetch the profile for them.
      if (uid !== null && uid === loadedFor.current) {
        setState((prev) => ({ ...prev, session, loading: false }))
        return
      }

      loadedFor.current = uid
      setState({ session, profile: uid ? undefined : null, loading: false })
      if (!uid) return

      fetchProfile(uid)
        .then((profile) => {
          // A profile fetch that loses a race with sign-out must not be applied.
          if (live && loadedFor.current === uid) setState((prev) => ({ ...prev, profile }))
        })
        .catch(() => {
          if (live && loadedFor.current === uid) setState((prev) => ({ ...prev, profile: null }))
        })
    }

    auth.getSession().then(({ data }) => apply(data.session))
    const { data } = auth.onAuthStateChange((_event, session) => apply(session))

    return () => {
      live = false
      data.subscription.unsubscribe()
    }
  }, [])

  return <SessionCtx.Provider value={state}>{children}</SessionCtx.Provider>
}

export function useSession() {
  return useContext(SessionCtx)
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useSession()
  const location = useLocation()

  if (loading) return <p className="muted">Checking session…</p>
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <>{children}</>
}
