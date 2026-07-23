import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import './Upload.css'

export default function Upload({ onMenuClick }) {
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

  return (
    <div className="upload-page">
      <header className="upload-header">
        <div className="upload-top">
          <h1 className="upload-brand">Lexora</h1>
          <button className="icon-btn" onClick={onMenuClick} title="Menu">
            <img src="/icons/dashboard.png" alt="Menu" />
          </button>
        </div>
        <div className="upload-title-section">
          <h2 className="upload-heading">Upload Your Proposition!</h2>
          <p className="upload-subtitle">
            Upload your moot court proposition in PDF format to begin your practice session.
          </p>
        </div>
      </header>

      <main className="upload-main">
        <div
          className={`upload-area ${dragOver ? 'drag-over' : ''} ${file ? 'has-file' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={(e) => handleFile(e.target.files[0])}
            style={{ display: 'none' }}
          />
          
          {file ? (
            <div className="upload-file-info">
              <div className="upload-icon-circle">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
              </div>
              <p className="upload-filename">{file.name}</p>
              <p className="upload-filesize">{(file.size / 1024).toFixed(1)} KB</p>
              <p className="upload-change">Click to change file</p>
            </div>
          ) : (
            <div className="upload-placeholder">
              <div className="upload-icon-circle">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
              <p className="upload-text">Upload a pdf</p>
              <p className="upload-hint">Drag and drop your file here or click to browse</p>
            </div>
          )}
        </div>

        {file && (
          <button className="upload-btn" onClick={handleUpload}>
            Start Practice Session
          </button>
        )}
      </main>
    </div>
  )
}
