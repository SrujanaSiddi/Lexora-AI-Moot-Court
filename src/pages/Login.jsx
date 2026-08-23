import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import { IconBook, IconChat, IconMic, IconScale } from '../components/icons'
import './Login.css'

const FEATURES = [
  { icon: IconBook, title: 'Curated Case Library', desc: 'Practice with real moot propositions across various areas of law.' },
  { icon: IconChat, title: 'AI MootCourt Coach', desc: 'Structured, AI mentor-guided preparation from issues to memorial.' },
  { icon: IconMic, title: 'Live Oral Practice', desc: 'Argue before an AI bench with real voice recognition and feedback.' },
]

export default function Login({ onDemoLogin }) {
  const navigate = useNavigate()
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } }
        })
        if (error) throw error

        if (data.user && data.user.identities && data.user.identities.length === 0) {
          setError('An account with this email already exists')
          setLoading(false)
          return
        }

        if (data.session) {
          navigate('/')
        } else {
          setError('Account created! Sign in now.')
          setMode('signin')
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        navigate('/')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-shell">
        <aside className="login-brand-panel">
          <div className="login-brand-head">
            <span className="login-brand-name">Lexora</span>
          </div>

          <div className="login-brand-copy">
            <h1 className="login-brand-title">AI-Assisted Moot Court Practice Platform</h1>
            <p className="login-brand-sub">
              A structured legal learning workspace. Read propositions, build arguments, draft memorials,
              and argue before an AI bench — all in one place.
            </p>
          </div>

          <div className="login-features">
            {FEATURES.map((f) => {
              const Icon = f.icon
              return (
                <div className="login-feature" key={f.title}>
                  <span className="login-feature-icon"><Icon size={20} /></span>
                  <div>
                    <div className="login-feature-title">{f.title}</div>
                    <div className="login-feature-desc">{f.desc}</div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="login-brand-foot">
            <IconScale size={16} />
            <span>Built for law students and aspiring advocates.</span>
          </div>
        </aside>

        <div className="login-form-panel">
          <div className="login-card">
            <div className="login-card-head">
              <h2 className="login-title">{mode === 'signin' ? 'Welcome back' : 'Create your account'}</h2>
              <p className="login-subtitle">
                {mode === 'signin'
                  ? 'Sign in to continue your moot court preparation.'
                  : 'Join Lexora and start your structured practice journey.'}
              </p>
            </div>

            <form className="login-form" onSubmit={handleAuth}>
              {mode === 'signup' && (
                <div className="field">
                  <label className="field-label" htmlFor="login-name">Full Name</label>
                  <input
                    id="login-name"
                    className="input"
                    type="text"
                    placeholder="Enter your name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="field">
                <label className="field-label" htmlFor="login-email">Email</label>
                <input
                  id="login-email"
                  className="input"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label className="field-label" htmlFor="login-password">Password</label>
                <input
                  id="login-password"
                  className="input"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              {error && <div className={`form-message ${error.includes('created') ? 'success' : 'error'}`}>{error}</div>}

              <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading}>
                {loading && <span className="spinner light" />}
                {loading ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <div className="login-divider"><span>or</span></div>

            <button className="btn btn-outline btn-block" onClick={onDemoLogin}>
              Continue as Guest
            </button>

            <p className="login-toggle">
              {mode === 'signin' ? 'No account yet?' : 'Already have an account?'}{' '}
              <button onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError('') }}>
                {mode === 'signin' ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}