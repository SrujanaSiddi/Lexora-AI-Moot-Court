import { useNavigate } from 'react-router-dom'
import { IconBook, IconClock, IconArrowRight } from '../components/icons'
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
    color: '#8a6d1f',
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
    color: '#4d7c0f',
  },
  {
    id: 4,
    file: 'preposition-2nd-nlu-meg-national-moot-court-competition-1411768.pdf',
    title: '2nd NLU Meg National Moot Court',
    area: 'International Law',
    difficulty: 'Advanced',
    duration: '3-4 hours',
    description: 'Territorial dispute involving treaty interpretation and jurisdiction of international courts. Complex legal arguments required.',
    color: '#1d4ed8',
  },
]

const difficultyPill = (d) => {
  const map = {
    Beginner: 'pill-easy',
    Intermediate: 'pill-medium',
    Advanced: 'pill-hard',
  }
  return map[d] || 'pill-medium'
}

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="home-page">
      <div className="page-header">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <span>Learning</span>
        </nav>
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Case Library</h1>
            <p className="page-desc">
              Every great advocate begins with preparation. Browse the collection of moot court
              propositions and open one to begin a guided practice session.
            </p>
          </div>
          <div className="page-actions">
            <span className="badge badge-navy"><IconBook size={14} />{casePdfs.length} propositions available</span>
          </div>
        </div>
      </div>

      <main className="home-main">
        <div className="home-section-head">
          <div>
            <h2 className="section-title">Available Cases</h2>
            <p className="section-desc">Select a proposition to start your structured mock session.</p>
          </div>
        </div>

        <div className="cases-grid">
          {casePdfs.map((c) => (
            <article key={c.id} className="card case-card" style={{ '--case-accent': c.color }}>
              <div className="case-card-top">
                <span className="case-area-badge" style={{ backgroundColor: c.color }}>
                  {c.area}
                </span>
                <span className={`pill ${difficultyPill(c.difficulty)}`}>{c.difficulty}</span>
              </div>
              <h3 className="case-title">{c.title}</h3>
              <p className="case-description">{c.description}</p>
              <div className="case-card-foot">
                <span className="case-duration">
                  <IconClock size={14} />{c.duration}
                </span>
                <div className="case-actions">
                  <a
                    href={`/case-pdfs/${encodeURIComponent(c.file)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline btn-sm"
                  >
                    View PDF
                  </a>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => navigate('/practice', { state: { caseData: c } })}
                  >
                    Open Case
                    <IconArrowRight size={14} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  )
}