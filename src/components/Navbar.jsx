import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Navbar({ role }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const doctorLinks = [
    { to: '/doctor', label: 'Dashboard' },
    { to: '/doctor/consulta/nueva', label: 'Nueva Consulta' },
  ]

  const patientLinks = [
    { to: '/patient', label: 'Mi Portal' },
    { to: '/patient/progreso', label: 'Progreso' },
    { to: '/patient/checkin', label: 'Check-in' },
    { to: '/patient/chat', label: 'Mensajes' },
  ]

  const links = role === 'doctor' ? doctorLinks : patientLinks

  return (
    <nav className="bg-navy border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to={role === 'doctor' ? '/doctor' : '/patient'} className="font-display text-xl font-light tracking-widest text-white">
          PEPT<span className="text-teal">BIO</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6">
          {links.map(l => (
            <Link key={l.to} to={l.to}
              className={`text-sm font-medium transition-colors ${location.pathname === l.to ? 'text-teal' : 'text-white/50 hover:text-white'}`}>
              {l.label}
            </Link>
          ))}
          <button onClick={handleLogout} className="text-sm text-white/30 hover:text-white/60 transition-colors ml-2">
            Salir
          </button>
        </div>

        {/* Mobile menu button */}
        <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-white/60">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {menuOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-navy-light border-t border-white/10 px-4 py-3 space-y-2">
          {links.map(l => (
            <Link key={l.to} to={l.to} onClick={() => setMenuOpen(false)}
              className={`block py-2 text-sm font-medium transition-colors ${location.pathname === l.to ? 'text-teal' : 'text-white/60'}`}>
              {l.label}
            </Link>
          ))}
          <button onClick={handleLogout} className="block py-2 text-sm text-white/30 w-full text-left">Cerrar sesión</button>
        </div>
      )}
    </nav>
  )
}
