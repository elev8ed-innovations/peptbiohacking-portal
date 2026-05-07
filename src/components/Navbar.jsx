import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useLang } from '../context/LanguageContext'

export default function Navbar({ role }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { lang, t, toggleLang } = useLang()
  const [userName, setUserName] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    async function fetchName() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single()
        if (data?.full_name) {
          setUserName(data.full_name.split(' ')[0])
        }
      }
    }
    fetchName()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const patientLinks = [
    { path: '/patient/dashboard', label: t.dashboard },
    { path: '/patient/progress', label: t.progress },
    { path: '/patient/checkin', label: t.checkin },
    { path: '/patient/messages', label: t.messages },
    { path: '/patient/labs', label: t.labs },
  ]

  const doctorLinks = [
    { path: '/doctor/dashboard', label: t.patients },
    { path: '/doctor/new-consultation', label: t.newConsult },
  ]

  const links = role === 'doctor' ? doctorLinks : patientLinks

  return (
    <nav style={{
      background: 'linear-gradient(135deg, #0A1628 0%, #0D1F3C 100%)',
      borderBottom: '1px solid rgba(0,194,168,0.2)',
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '64px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '8px',
          background: 'linear-gradient(135deg, #00C2A8, #C9A84C)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Cormorant Garamond, serif', fontWeight: 700,
          fontSize: '18px', color: '#0A1628'
        }}>P</div>
        <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '18px', color: '#fff', fontWeight: 600, letterSpacing: '0.5px' }}>
          PeptBiohacking
        </span>
      </div>

      {/* Desktop Nav Links */}
      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }} className="nav-links">
        {links.map(link => (
          <button
            key={link.path}
            onClick={() => navigate(link.path)}
            style={{
              background: location.pathname === link.path ? 'rgba(0,194,168,0.15)' : 'transparent',
              border: location.pathname === link.path ? '1px solid rgba(0,194,168,0.4)' : '1px solid transparent',
              color: location.pathname === link.path ? '#00C2A8' : 'rgba(255,255,255,0.7)',
              padding: '6px 14px', borderRadius: '6px',
              fontFamily: 'Outfit, sans-serif', fontSize: '13px',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >{link.label}</button>
        ))}
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Greeting */}
        {userName && (
          <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
            {t.welcome}, <span style={{ color: '#00C2A8', fontWeight: 600 }}>{userName}</span>
          </span>
        )}

        {/* EN/ES Toggle */}
        <button
          onClick={toggleLang}
          style={{
            background: 'rgba(201,168,76,0.15)',
            border: '1px solid rgba(201,168,76,0.4)',
            color: '#C9A84C',
            padding: '5px 12px', borderRadius: '20px',
            fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: 600,
            cursor: 'pointer', letterSpacing: '1px',
            transition: 'all 0.2s',
          }}
        >{lang === 'es' ? 'EN' : 'ES'}</button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.15)',
            color: 'rgba(255,255,255,0.5)',
            padding: '5px 12px', borderRadius: '6px',
            fontFamily: 'Outfit, sans-serif', fontSize: '12px',
            cursor: 'pointer', transition: 'all 0.2s',
          }}
        >{t.logout}</button>
      </div>
    </nav>
  )
}
