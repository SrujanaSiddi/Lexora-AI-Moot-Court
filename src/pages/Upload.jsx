import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconUpload, IconFileText, IconX, IconCheck, IconArrowRight, IconLightbulb } from '../components/icons'
import './Upload.css'

const STEPS = [
  { title: 'Upload your proposition', desc: 'Add the moot court problem statement as a PDF.' },
  { title: 'AI reads and structures it', desc: 'Lexora prepares a guided session around the case.' },
  { title: 'Start your mock practice', desc: 'Work through issues, laws, memorial and oral practice.' },
]

export default function Upload() {
  const [file, setFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)
  const navigate = useNavigate()

  const handleFile = (f) => {
    if (f && f.type === 'application/pdf') {
      setFile(f)
    } else {
      alert('Please upload a PDF file.')
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    handleFile(f)
  }

  const handleUpload = () => {
    if (file) {
      navigate('/practice', { state: { uploadedFile: file, fromUpload: true } })
    }
  }

  const handleRemove = () => {
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="upload-page">
      <div className="page-header">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <span>Learning</span>
        </nav>
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Upload Proposition</h1>
            <p className="page-desc">
              Upload your moot court proposition in PDF format to begin a guided practice session
              — or practice with a case from the library.
            </p>
          </div>
        </div>
      </div>

      <main className="upload-main">
        <div className="upload-grid">
          <div className="upload-col-main">
            <div
              className={`upload-area ${dragOver ? 'drag-over' : ''} ${file ? 'has-file' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current?.click() } }}
              aria-label="Upload a PDF proposition"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={(e) => handleFile(e.target.files[0])}
                style={{ display: 'none' }}
                aria-hidden="true"
              />

              {file ? (
                <div className="upload-file-info">
                  <span className="upload-file-icon">
                    <IconFileText size={30} />
                  </span>
                  <div className="upload-file-meta">
                    <p className="upload-filename">{file.name}</p>
                    <p className="upload-filesize">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <span className="badge badge-green"><IconCheck size={12} /> Ready</span>
                  <p className="upload-change">Click anywhere to replace the file</p>
                </div>
              ) : (
                <div className="upload-placeholder">
                  <span className="upload-drop-icon">
                    <IconUpload size={30} />
                  </span>
                  <p className="upload-text">Drag &amp; drop your proposition here</p>
                  <p className="upload-hint">or click to browse your files</p>
                  <span className="upload-formats">
                    <span className="badge badge-gray">PDF</span>
                    <span className="upload-formats-note">Document formats · Max 25 MB</span>
                  </span>
                </div>
              )}
            </div>

            {file && (
              <div className="upload-actions">
                <button className="btn btn-danger-soft" onClick={handleRemove}>
                  <IconX size={15} />
                  Remove file
                </button>
                <button className="btn btn-primary btn-lg" onClick={handleUpload}>
                  Start Practice Session
                  <IconArrowRight size={16} />
                </button>
              </div>
            )}
          </div>

          <aside className="upload-aside">
            <div className="card">
              <div className="card-head">
                <h2 className="card-title">How it works</h2>
              </div>
              <div className="card-body upload-steps">
                {STEPS.map((s, i) => (
                  <div className="upload-step" key={s.title}>
                    <span className="upload-step-num">{i + 1}</span>
                    <div>
                      <div className="upload-step-title">{s.title}</div>
                      <div className="upload-step-desc">{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card upload-tip">
              <div className="upload-tip-head">
                <span className="upload-tip-icon"><IconLightbulb size={18} /></span>
                <span className="badge badge-amber">Tip</span>
              </div>
              <p className="upload-tip-text">
                You can also pick a prepared proposition from the Case Library if you do not have your own yet.
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}