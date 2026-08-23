import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  IconMenu,
  IconDashboard,
  IconBook,
  IconUpload,
  IconChat,
  IconMic,
  IconLogOut,
  IconChevronLeft,
  IconHelp,
  IconChevronDown,
} from './icons'
import './AppShell.css'

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [{ label: 'Dashboard', path: '/dashboard', icon: IconDashboard }],
  },
  {
    label: 'Learning',
    items: [
      { label: 'Case Library', path: '/', icon: IconBook },
      { label: 'Upload Proposition', path: '/upload', icon: IconUpload },
    ],
  },
  {
    label: 'Moot Court',
    items: [
      { label: 'Coach Session', path: '/practice', icon: IconChat },
      { label: 'Oral Arguments', path: '/oral-arguments', icon: IconMic },
    ],
  },
]

const PAGE_TITLES = {
  '/': 'Case Library',
  '/upload': 'Upload Proposition',
  '/practice': 'Coach Session',
  '/dashboard': 'Dashboard',
  '/oral-arguments': 'Oral Arguments',
}

function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate()
  const location = useLocation()

  const handleNav = (path) => {
    navigate(path)
    onClose()
  }

  return (
    <>
      <div
        className={`shell-overlay ${isOpen ? 'active' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`shell-sidebar ${isOpen ? 'open' : ''}`}
        aria-label="Primary navigation"
      >
        <div className="shell-sidebar-head">
          <a href="/" className="shell-wordmark" onClick={(e) => { e.preventDefault(); handleNav('/') }}>
            <span className="shell-wordmark-name">Lexora</span>
          </a>
          <button className="shell-collapse-btn shell-collapse-mobile" onClick={onClose} title="Close menu">
            <IconChevronLeft size={18} />
          </button>
        </div>

        <nav className="shell-nav">
          {NAV_GROUPS.map((group) => (
            <div className="shell-nav-group" key={group.label}>
              <div className="shell-nav-group-label">{group.label}</div>
              {group.items.map((item) => {
                const Icon = item.icon
                const active = location.pathname === item.path
                return (
                  <button
                    key={item.path}
                    className={`shell-nav-item ${active ? 'active' : ''}`}
                    onClick={() => handleNav(item.path)}
                    aria-current={active ? 'page' : undefined}
                  >
                    <span className="shell-nav-icon"><Icon size={19} /></span>
                    <span className="shell-nav-label">{item.label}</span>
                  </button>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="shell-sidebar-foot">
          <a href="mailto:24eu04122@vrsec.ac.in" className="shell-nav-item" title="Contact support">
            <span className="shell-nav-icon"><IconHelp size={19} /></span>
            <span className="shell-nav-label">Contact Support</span>
          </a>
        </div>
      </aside>
    </>
  )
}

function UserMenu({ user, onSignOut }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const email = user?.email || user?.user_metadata?.email || 'Guest'
  const name = user?.user_metadata?.full_name || email?.split('@')[0] || 'Counsel'
  const initial = (name || 'L').charAt(0).toUpperCase()

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  return (
    <div className="usermenu" ref={ref}>
      <button
        className="usermenu-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        title={email}
      >
        <span className="usermenu-avatar">{initial}</span>
        <span className="usermenu-meta">
          <span className="usermenu-name">{name}</span>
          <span className="usermenu-email">{email}</span>
        </span>
        <IconChevronDown size={16} />
      </button>
      {open && (
        <div className="usermenu-dropdown">
          <div className="usermenu-dropdown-head">
            <span className="usermenu-avatar">{initial}</span>
            <div>
              <div className="usermenu-name">{name}</div>
              <div className="usermenu-email">{email}</div>
            </div>
          </div>
          <div className="usermenu-divider" />
          <button className="usermenu-action" onClick={onSignOut}>
            <IconLogOut size={16} />
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}

export default function AppShell({ user, onSignOut, children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const title = PAGE_TITLES[location.pathname] || 'Lexora'

  const goHome = (e) => {
    e.preventDefault()
    if (location.pathname !== '/') navigate('/')
  }

  return (
    <div className="app-shell">
      <header className="shell-header">
        <button
          className="icon-btn shell-hamburger"
          onClick={() => setMobileOpen((o) => !o)}
          title="Toggle menu"
          aria-label="Toggle menu"
        >
          <IconMenu size={20} />
        </button>
        <a href="/" className="shell-header-brand" onClick={goHome}>
          <span className="shell-wordmark-name">Lexora</span>
        </a>
        <div className="shell-header-context">
          <span className="shell-header-title">{title}</span>
        </div>
        <div className="shell-header-right">
          <UserMenu user={user} onSignOut={onSignOut} />
        </div>
      </header>
      <div className="app-shell-body">
        <Sidebar
          isOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
        />
        <main className="app-shell-main" id="main">
          {children}
        </main>
      </div>
    </div>
  )
}