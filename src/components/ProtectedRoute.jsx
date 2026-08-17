import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ProtectedRoute({ role, children }) {
  const [access, setAccess] = useState({ loading: true, role: null })

  useEffect(() => {
    let active = true

    async function verifyAccess() {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (!active) return
      if (userError || !user) {
        setAccess({ loading: false, role: null })
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!active) return
      setAccess({ loading: false, role: profileError ? null : profile?.role || null })
    }

    verifyAccess()
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active && !session) setAccess({ loading: false, role: null })
    })

    return () => {
      active = false
      authListener.subscription.unsubscribe()
    }
  }, [])

  if (access.loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#FAF7F2', display: 'grid', placeItems: 'center' }}>
        <div aria-label="Verificando acceso" style={{ width: '34px', height: '34px', border: '3px solid #E5E5E5', borderTopColor: '#00C2A8', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    )
  }

  if (!access.role) return <Navigate to="/login" replace />
  if (access.role !== role) {
    return <Navigate to={access.role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard'} replace />
  }

  return children
}
