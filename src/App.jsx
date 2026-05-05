import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import AgeGateModal from './components/AgeGateModal'
import Login from './pages/Login'
import Register from './pages/Register'
import DoctorDashboard from './pages/doctor/Dashboard'
import NewConsultation from './pages/doctor/NewConsultation'
import PatientDetail from './pages/doctor/PatientDetail'
import PatientDashboard from './pages/patient/Dashboard'
import ProgressTracker from './pages/patient/ProgressTracker'
import WellnessCheckin from './pages/patient/WellnessCheckin'
import Chat from './pages/patient/Chat'

export default function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [ageGateCleared, setAgeGateCleared] = useState(
    () => localStorage.getItem('pb_age_cleared') === 'true'
  )

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else { setProfile(null); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    setProfile(data)
    setLoading(false)
  }

  function handleAgeConfirm() {
    localStorage.setItem('pb_age_cleared', 'true')
    setAgeGateCleared(true)
  }

  if (!ageGateCleared) return <AgeGateModal onConfirm={handleAgeConfirm} />
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!session) {
    return (
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Login />} />
      </Routes>
    )
  }

  if (profile?.role === 'doctor') {
    return (
      <Routes>
        <Route path="/doctor" element={<DoctorDashboard profile={profile} />} />
        <Route path="/doctor/consulta/nueva" element={<NewConsultation profile={profile} />} />
        <Route path="/doctor/paciente/:id" element={<PatientDetail profile={profile} />} />
        <Route path="*" element={<Navigate to="/doctor" />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/patient" element={<PatientDashboard profile={profile} />} />
      <Route path="/patient/progreso" element={<ProgressTracker profile={profile} />} />
      <Route path="/patient/checkin" element={<WellnessCheckin profile={profile} />} />
      <Route path="/patient/chat" element={<Chat profile={profile} />} />
      <Route path="*" element={<Navigate to="/patient" />} />
    </Routes>
  )
}
