import { useNavigate } from 'react-router-dom'
import { IconDashboard, IconFileText, IconTarget, IconClock, IconArrowRight, IconBook } from '../components/icons'
import './Dashboard.css'

const READINESS = [
  { name: 'Issue Identification', pct: 0 },
  { name: 'Law Identification', pct: 0 },
  { name: 'Legal Research', pct: 0 },
  { name: 'Use of Precedents', pct: 0 },
  { name: 'Memorial Drafting', pct: 0 },
  { name: 'Oral Advocacy', pct: 0 },
  { name: 'Judicial Response', pct: 0 },
  { name: 'Courtroom Etiquette', pct: 0 },
]

const STATS = [
  { icon: IconFileText, value: '0', label: 'Practice Sessions' },
  { icon: IconDashboard, value: '0', label: 'Cases Practiced' },
  { icon: IconTarget, value: '--', label: 'Average Score' },
  { icon: IconClock, value: '0 hrs', label: 'Practice Time' },
]

export default function Dashboard({ user }) {
  const navigate = useNavigate()
  const name = user?.email?.split('@')[0] || 'Counsel'

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <span>Overview</span>
        </nav>
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-desc">
              Track your moot court preparation progress and readiness across every practice area.
            </p>
          </div>
        </div>
      </div>

      <main className="dashboard-main">
        <section className="welcome-banner">
          <div className="welcome-banner-copy">
            <h2 className="welcome-banner-title">Welcome back, {name}</h2>
            <p className="welcome-banner-desc">
              Start by exploring the Moot Library or upload your own proposition to begin learning.
              Lexora will guide you from issue identification to your final oral argument.
            </p>
            <div className="welcome-banner-actions">
              <button className="btn btn-primary" onClick={() => navigate('/')}>
                Explore Cases
                <IconArrowRight size={16} />
              </button>
              <button className="btn btn-ghost-light" onClick={() => navigate('/upload')}>
                Upload a Proposition
              </button>
            </div>
          </div>
          <div className="welcome-banner-art" aria-hidden="true">
            <IconBook size={86} />
          </div>
        </section>

        <section className="stats-grid">
          {STATS.map((s) => {
            const Icon = s.icon
            return (
              <div className="card stat-card" key={s.label}>
                <span className="stat-icon"><Icon size={20} /></span>
                <div className="stat-info">
                  <h3 className="stat-value">{s.value}</h3>
                  <p className="stat-label">{s.label}</p>
                </div>
              </div>
            )
          })}
        </section>

        <section className="readiness-section">
          <div className="section-head">
            <div>
              <h2 className="section-title">Moot Readiness Report</h2>
              <p className="section-desc">Your preparation level across core advocacy skills.</p>
            </div>
          </div>

          <div className="card">
            <div className="card-body readiness-grid">
              {READINESS.map((item) => (
                <div className="readiness-item" key={item.name}>
                  <div className="readiness-label">
                    <span>{item.name}</span>
                    <span>{item.pct}%</span>
                  </div>
                  <div className="progress">
                    <div className="progress-fill" style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))}
              <p className="readiness-hint">
                Scores appear after your first practice session. Complete your first moot session to build this report.
              </p>
            </div>
          </div>
        </section>

        <section className="history-section">
          <div className="section-head">
            <div>
              <h2 className="section-title">Practice History</h2>
              <p className="section-desc">A record of your completed moot court sessions.</p>
            </div>
          </div>

          <div className="card">
            <div className="empty-state">
              <span className="empty-state-icon"><IconDashboard size={24} /></span>
              <p className="empty-state-title">No practice sessions yet</p>
              <p className="empty-state-desc">
                Start your first session to see your history, scores, and judge feedback here.
              </p>
              <button className="btn btn-primary" onClick={() => navigate('/')}>
                Start Practice
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}