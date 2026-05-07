import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useLang } from '../context/LanguageContext'

export default function Navbar({ role }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { lang, t, toggleLang } = useLang()
  const [userName, setUserName] = useState('')

  useEffect(() => {
    async function fetchName() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single()
        if (data?.full_name) setUserName(data.full_name.split(' ')[0])
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
      padding: '0 24px', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', height: '64px',
      position: 'sticky', top: 0, zIndex: 100,
    }}>
      {/* Wordmark */}
      <div style={{ cursor: 'pointer' }} onClick={() => navigate(role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard')}>
        <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '20px', fontWeight: 700, letterSpacing: '2px' }}>
          <span style={{ color: '#ffffff' }}>PEPT</span><span style={{ color: '#00C2A8' }}>BIO</span><span style={{ color: '#ffffff' }}>HACKING</span>
        </span>
      </div>

      {/* Nav Links */}
      <div style={{ display: 'flex', gap: '4px' }}>
        {links.map(link => (
          <button key={link.path} onClick={() => navigate(link.path)} style={{
            background: location.pathname === link.path ? 'rgba(0,194,168,0.15)' : 'transparent',
            border: location.pathname === link.path ? '1px solid rgba(0,194,168,0.4)' : '1px solid transparent',
            color: location.pathname === link.path ? '#00C2A8' : 'rgba(255,255,255,0.7)',
            padding: '6px 14px', borderRadius: '6px',
            fontFamily: 'Outfit, sans-serif', fontSize: '13px', cursor: 'pointer',
          }}>{link.label}</button>
        ))}
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {userName && (
          <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
            {t.welcome}, <span style={{ color: '#00C2A8', fontWeight: 600 }}>{userName}</span>
          </span>
        )}
        <button onClick={toggleLang} style={{
          background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.4)',
          color: '#C9A84C', padding: '5px 12px', borderRadius: '20px',
          fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: 600, cursor: 'pointer', letterSpacing: '1px',
        }}>{lang === 'es' ? 'EN' : 'ES'}</button>
        <button onClick={handleLogout} style={{
          background: 'transparent', border: '1px solid rgba(255,255,255,0.15)',
          color: 'rgba(255,255,255,0.5)', padding: '5px 12px', borderRadius: '6px',
          fontFamily: 'Outfit, sans-serif', fontSize: '12px', cursor: 'pointer',
        }}>{t.logout}</button>
      </div>
    </nav>
  )
}
