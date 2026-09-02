import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import { RequireAuth, SessionProvider, useSession } from './lib/auth'
import { db } from './lib/supabase'
import { AppView, Dashboard, Login } from './routes'

function Header() {
  const { session, profile } = useSession()
  if (!session) return null

  return (
    <header>
      <Link to="/" className="brand">Portal</Link>
      <span className="muted">{profile?.email ?? session.user.email}</span>
      {profile && <span className="badge">{profile.role}</span>}
      <button type="button" onClick={() => void db().auth.signOut()}>Sign out</button>
    </header>
  )
}

export default function App() {
  return (
    <SessionProvider>
      <BrowserRouter>
        <Header />
        <main>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<RequireAuth><Dashboard /></RequireAuth>} />
            <Route path="/a/:slug" element={<RequireAuth><AppView /></RequireAuth>} />
            <Route
              path="*"
              element={<p className="muted">Not found. <Link to="/">Back to portal</Link></p>}
            />
          </Routes>
        </main>
      </BrowserRouter>
    </SessionProvider>
  )
}
