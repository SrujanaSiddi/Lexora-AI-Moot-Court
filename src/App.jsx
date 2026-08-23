import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './utils/supabase'
import AppShell from './components/AppShell'
import Home from './pages/Home'
import Upload from './pages/Upload'
import Practice from './pages/Practice'
import Dashboard from './pages/Dashboard'
import OralArguments from './pages/OralArguments'
import Login from './pages/Login'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const demoUser = localStorage.getItem('demo_user')
    if (demoUser) {
      setUser(JSON.parse(demoUser))
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleDemoLogin = () => {
    const demoUser = { id: 'demo-user', email: 'demo@lexora.ai' }
    localStorage.setItem('demo_user', JSON.stringify(demoUser))
    setUser(demoUser)
  }

  const handleSignOut = async () => {
    localStorage.removeItem('demo_user')
    try {
      await supabase.auth.signOut()
    } catch {
      /* session already cleared locally */
    }
    setUser(null)
  }

  if (loading) {
    return (
      <div className="app-splash">
        <div className="app-splash-card">
          <span className="app-splash-name">Lexora</span>
        </div>
        <div className="spinner light" />
        <p className="app-splash-tag">Preparing your moot court workspace…</p>
      </div>
    )
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login onDemoLogin={handleDemoLogin} />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    )
  }

  return (
    <AppShell user={user} onSignOut={handleSignOut}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/practice" element={<Practice />} />
        <Route path="/dashboard" element={<Dashboard user={user} />} />
        <Route path="/oral-arguments" element={<OralArguments />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </AppShell>
  )
}

export default App