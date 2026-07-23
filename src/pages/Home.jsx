import { useNavigate } from 'react-router-dom'
import './Home.css'

const casePdfs = [
  {
    id: 1,
    file: 'kl proposition.pdf',
    title: 'KL Moot Court Proposition',
    area: 'Constitutional Law',
    difficulty: 'Intermediate',
    duration: '2-3 hours',
    description: 'A moot proposition dealing with constitutional rights and administrative law. Analyze fundamental rights violations and procedural fairness.',
    color: '#c9a84c',
  },
  {
    id: 2,
    file: 'casedata.pdf',
    title: 'Case Data Analysis',
    area: 'Criminal Law',
    difficulty: 'Advanced',
    duration: '3-4 hours',
    description: 'Examination of evidentiary standards and burden of proof in criminal proceedings. Involves cross-examination strategies and legal reasoning.',
    color: '#a0522d',
  },
  {
    id: 3,
    file: 'Online_MootCourt_COmpitition_2020.pdf',
    title: 'Online Moot Court Competition 2020',
    area: 'Environmental Law',
    difficulty: 'Beginner',
    duration: '1-2 hours',
    description: 'Dispute regarding environmental clearance and sustainable development. Covers pollution control regulations and statutory compliance.',
    color: '#6b8e23',
  },
  {
    id: 4,
    file: 'preposition-2nd-nlu-meg-national-moot-court-competition-1411768.pdf',
    title: '2nd NLU Meg National Moot Court',
    area: 'International Law',
    difficulty: 'Advanced',
    duration: '3-4 hours',
    description: 'Territorial dispute involving treaty interpretation and jurisdiction of international courts. Complex legal arguments required.',
    color: '#4682b4',
  },
]

export default function Home({ onMenuClick }) {
  const navigate = useNavigate()

  return (
    <div className="home">
      <header className="home-header">
        <div className="home-top">
          <h1 className="home-brand">Lexora</h1>
          <div className="home-icons">
            <button className="icon-btn" onClick={onMenuClick} title="Menu">
              <img src="/icons/dashboard.png" alt="Menu" />
            </button>
          </div>
        </div>
        <div className="home-title-section">
          <h2 className="home-heading">Explore some cases!</h2>
          <p className="home-subtitle">
            Every great advocate begins with preparation. Browse through our collection of moot court propositions and start your practice journey.
          </p>
        </div>
      </header>

      <main className="home-main">
        <div className="cases-grid">
          {casePdfs.map((c) => (
            <div key={c.id} className="case-card" style={{ borderTopColor: c.color }}>
              <div className="case-card-header">
                <span className="case-area" style={{ background: c.color }}>{c.area}</span>
                <span className="case-difficulty">{c.difficulty}</span>
              </div>
              <h3 className="case-title">{c.title}</h3>
              <p className="case-description">{c.description}</p>
              <div className="case-footer">
                <span className="case-duration">{c.duration}</span>
                <div className="case-actions">
                  <a
                    href={`/case-pdfs/${encodeURIComponent(c.file)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="case-btn case-btn-view"
                  >
                    View PDF
                  </a>
                  <button
                    className="case-btn"
                    onClick={() => navigate('/practice', { state: { caseData: c } })}
                  >
                    Open Case
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
