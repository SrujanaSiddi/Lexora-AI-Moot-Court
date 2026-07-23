import { useNavigate } from 'react-router-dom'
import './Dashboard.css'

export default function Dashboard({ onMenuClick }) {
  const navigate = useNavigate()

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div className="dashboard-top">
          <h1 className="dashboard-brand">Lexora</h1>
          <button className="icon-btn" onClick={onMenuClick} title="Menu">
            <img src="/icons/dashboard.png" alt="Menu" />
          </button>
        </div>
        <div className="dashboard-title-section">
          <h2 className="dashboard-heading">Your Dashboard</h2>
          <p className="dashboard-subtitle">Track your moot court preparation progress</p>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-welcome">
          <div className="welcome-card">
            <h3>Welcome to AI MootCoach</h3>
            <p>It looks like this is your first practice session. Start by exploring the Moot Library or upload your own moot proposition to begin learning.</p>
            <button className="welcome-btn" onClick={() => navigate('/')}>
              Explore Cases
            </button>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon-box">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <div className="stat-info">
              <h4>0</h4>
              <p>Practice Sessions</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-box">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <div className="stat-info">
              <h4>0</h4>
              <p>Cases Practiced</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-box">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.5">
                <line x1="18" y1="20" x2="18" y2="10"/>
                <line x1="12" y1="20" x2="12" y2="4"/>
                <line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
            </div>
            <div className="stat-info">
              <h4>--</h4>
              <p>Average Score</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-box">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div className="stat-info">
              <h4>0h</h4>
              <p>Practice Time</p>
            </div>
          </div>
        </div>

        <div className="readiness-section">
          <h3 className="section-title">Moot Readiness Report</h3>
          <div className="readiness-grid">
            {[
              { name: 'Issue Identification', pct: 0 },
              { name: 'Law Identification', pct: 0 },
              { name: 'Legal Research', pct: 0 },
              { name: 'Use of Precedents', pct: 0 },
              { name: 'Memorial Drafting', pct: 0 },
              { name: 'Oral Advocacy', pct: 0 },
              { name: 'Judicial Response', pct: 0 },
              { name: 'Courtroom Etiquette', pct: 0 },
            ].map((item) => (
              <div key={item.name} className="readiness-item">
                <div className="readiness-label">
                  <span>{item.name}</span>
                  <span>{item.pct}%</span>
                </div>
                <div className="readiness-bar">
                  <div className="readiness-fill" style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="history-section">
          <h3 className="section-title">Practice History</h3>
          <div className="empty-state">
            <p>No practice sessions yet. Start your first session to see your history here.</p>
            <button className="empty-btn" onClick={() => navigate('/')}>
              Start Practice
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
