import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Home from './pages/Home'
import Upload from './pages/Upload'
import Practice from './pages/Practice'
import Dashboard from './pages/Dashboard'
import './App.css'

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="app">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Routes>
        <Route path="/" element={<Home onMenuClick={() => setSidebarOpen(true)} />} />
        <Route path="/upload" element={<Upload onMenuClick={() => setSidebarOpen(true)} />} />
        <Route path="/practice" element={<Practice onMenuClick={() => setSidebarOpen(true)} />} />
        <Route path="/dashboard" element={<Dashboard onMenuClick={() => setSidebarOpen(true)} />} />
      </Routes>
    </div>
  )
}

export default App
