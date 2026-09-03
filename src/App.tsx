import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import { RequireAuth, SessionProvider, useSession } from './lib/auth'
import { db } from './lib/supabase'
import { AppView, Dashboard, Login } from './routes'

function Header() {
  const { session, profile } = useSession()
  if (!session) return null

  return (
    <header className="app-header">
      <Link to="/" className="brand">Portal</Link>
      <div className="user-profile">
        <span className="muted user-email">{profile?.email ?? session.user.email}</span>
        {profile && <span className="badge">{profile.role}</span>}
      </div>
      <button type="button" onClick={() => void db().auth.signOut()}>Sign out</button>
    </header>
  )
}

export default function App() {
  return (
    <SessionProvider>
      <BrowserRouter>
        <div className="root-shell">
          <Header />
          <main className="main-content">
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
        </div>
      </BrowserRouter>
    </SessionProvider>
  )
}
