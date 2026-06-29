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
        const { data } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
        if (data?.full_name) setUserName(data.full_name)
      }
    }
    fetchName()
  }, [])

  const handleLogout = async () => {
    setMenuOpen(false)
    await supabase.auth.signOut()
    navigate('/login')
  }

  const patientLinks = [
    { path: '/patient/dashboard', label: t.dashboard },
    { path: '/patient/progress', label: t.progress },
    { path: '/patient/checkin', label: t.checkin },
    { path: '/patient/messages', label: t.messages },
    { path: '/patient/labs', label: t.labs },
    { path: '/patient/booking', label: t.booking },
    { path: '/patient/light-health', label: t.lightHealth },
    { path: '/calculator', label: '🧮 ' + t.calculator || 'Calculator' },
  ]

  const doctorLinks = [
    { path: '/doctor/dashboard', label: t.patients },
    { path: '/doctor/new-consultation', label: t.newConsult },
    { path: '/doctor/inventario', label: '🛒 Inventario' },
    { path: '/calculator', label: '🧮 ' + t.calculator || 'Calculator' },
  ]

  const links = role === 'doctor' ? doctorLinks : patientLinks

  const isActive = (path) => location.pathname === path

  return (
    <nav style={{
      background: '#0A1628',
      borderBottom: '1px solid rgba(0,194,168,0.15)',
      position: 'sticky', top: 0, zIndex: 100,
    }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 20px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

        {/* Wordmark */}
        <div style={{ cursor: 'pointer', flexShrink: 0 }} onClick={() => navigate(role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard')}>
          <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '20px', fontWeight: 700, letterSpacing: '2px' }}>
            <span style={{ color: '#fff' }}>PEPT</span>
            <span style={{ color: '#00C2A8' }}>BIO</span>
            <span style={{ color: '#fff' }}>HACKING</span>
          </span>
        </div>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center" style={{ gap: '2px' }}>
          {links.map(link => (
            <button key={link.path} onClick={() => navigate(link.path)} style={{
              background: isActive(link.path) ? 'rgba(0,194,168,0.12)' : 'transparent',
              border: isActive(link.path) ? '1px solid rgba(0,194,168,0.35)' : '1px solid transparent',
              color: isActive(link.path) ? '#00C2A8' : 'rgba(255,255,255,0.65)',
              padding: '6px 12px', borderRadius: '7px',
              fontFamily: 'Outfit, sans-serif', fontSize: '13px', cursor: 'pointer',
              whiteSpace: 'nowrap', minHeight: '36px',
            }}>{link.label}</button>
          ))}
        </div>

        {/* Desktop Right */}
        <div className="hidden md:flex items-center" style={{ gap: '10px', flexShrink: 0 }}>
          {userName && (
            <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13px', color: 'rgba(255,255,255,0.55)' }}>
              {t.welcome}, <span style={{ color: '#00C2A8', fontWeight: 600 }}>{userName}</span>
            </span>
          )}
          <button onClick={toggleLang} style={{
            background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.4)',
            color: '#C9A84C', padding: '5px 12px', borderRadius: '20px',
            fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: 600, cursor: 'pointer', letterSpacing: '1px',
          }}>{lang === 'es' ? 'EN' : 'ES'}</button>
          <button onClick={handleLogout} style={{
            background: 'transparent', border: '1px solid rgba(255,255,255,0.15)',
            color: 'rgba(255,255,255,0.5)', padding: '5px 12px', borderRadius: '7px',
            fontFamily: 'Outfit, sans-serif', fontSize: '12px', cursor: 'pointer', minHeight: '32px',
          }}>{t.logout}</button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col justify-center items-center gap-1.5 cursor-pointer"
          style={{ width: '40px', height: '40px', background: 'none', border: 'none', padding: '4px' }}
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Menu"
        >
          <span style={{ display: 'block', width: '22px', height: '2px', background: 'rgba(255,255,255,0.8)', borderRadius: '2px' }} />
          <span style={{ display: 'block', width: '22px', height: '2px', background: 'rgba(255,255,255,0.8)', borderRadius: '2px' }} />
          <span style={{ display: 'block', width: '22px', height: '2px', background: 'rgba(255,255,255,0.8)', borderRadius: '2px' }} />
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setMenuOpen(false)} />
          <div style={{
            position: 'absolute', top: '64px', left: 0, right: 0, zIndex: 50,
            background: '#0A1628', borderBottom: '1px solid rgba(0,194,168,0.15)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          }}>
            {/* User + lang row */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                {userName && <p style={{ color: '#fff', fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '14px', margin: 0 }}>{userName}</p>}
                <p style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Outfit, sans-serif', fontSize: '12px', margin: 0, textTransform: 'capitalize' }}>{role}</p>
              </div>
              <button onClick={toggleLang} style={{
                background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.4)',
                color: '#C9A84C', padding: '5px 12px', borderRadius: '20px',
                fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
              }}>{lang === 'es' ? 'EN' : 'ES'}</button>
            </div>

            {/* Nav links */}
            {links.map(link => (
              <button key={link.path} onClick={() => { navigate(link.path); setMenuOpen(false) }} style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '14px 20px', minHeight: '48px',
                background: isActive(link.path) ? 'rgba(0,194,168,0.1)' : 'transparent',
                border: 'none', borderBottom: '1px solid rgba(255,255,255,0.04)',
                color: isActive(link.path) ? '#00C2A8' : 'rgba(255,255,255,0.7)',
                fontFamily: 'Outfit, sans-serif', fontSize: '15px', cursor: 'pointer',
              }}>{link.label}</button>
            ))}

            {/* Logout */}
            <button onClick={handleLogout} style={{
              display: 'block', width: '100%', textAlign: 'left',
              padding: '14px 20px', minHeight: '48px',
              background: 'transparent', border: 'none',
              color: 'rgba(255,255,255,0.45)', fontFamily: 'Outfit, sans-serif', fontSize: '15px', cursor: 'pointer',
            }}>{t.logout}</button>
          </div>
        </>
      )}
    </nav>
  )
}
