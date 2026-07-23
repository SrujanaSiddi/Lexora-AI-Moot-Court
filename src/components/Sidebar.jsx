import { useNavigate, useLocation } from 'react-router-dom'
import './Sidebar.css'

const menuItems = [
  { label: 'Home', path: '/', icon: 'dashboard' },
  { label: 'Prepare', path: '/upload', icon: 'upload' },
  { label: 'Doubts?', path: '/practice', icon: 'search' },
]

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate()
  const location = useLocation()

  const handleNav = (path) => {
    navigate(path)
    onClose()
  }

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'active' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2 className="sidebar-brand">Lexora</h2>
          <button className="sidebar-close" onClick={onClose}>&times;</button>
        </div>
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.path}
              className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => handleNav(item.path)}
            >
              <img src={`/icons/${item.icon}.png`} alt="" className="sidebar-item-icon" />
              <span className="sidebar-label">{item.label}</span>
            </button>
          ))}
          <a
            href="mailto:24eu04122@vrsec.ac.in"
            className="sidebar-item"
            onClick={onClose}
          >
            <img src="/icons/profile.png" alt="" className="sidebar-item-icon" />
            <span className="sidebar-label">Contact Us</span>
          </a>
        </nav>
      </aside>
    </>
  )
}
