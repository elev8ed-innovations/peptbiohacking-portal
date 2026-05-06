import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import Register from './pages/Register'
import DoctorDashboard from './pages/doctor/Dashboard'
import NewConsultation from './pages/doctor/NewConsultation'
import PatientDetail from './pages/doctor/PatientDetail'
import PatientDashboard from './pages/patient/Dashboard'
import ProgressTracker from './pages/patient/ProgressTracker'
import WellnessCheckin from './pages/patient/WellnessCheckin'
import Chat from './pages/patient/Chat'

function ProtectedRoute({ children, allowedRole }) {
  const [session, setSession] = useState(undefined)
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else setProfile(null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId) => {
    const { data } = await supabase.from('profiles').select('role').eq('id', userId).single()
    setProfile(data)
  }

  if (session === undefined) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!session) return <Navigate to="/login" replace />
  if (allowedRole && profile && profile.role !== allowedRole) {
    return <Navigate to={profile.role === 'doctor' ? '/doctor' : '/patient'} replace />
  }
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/doctor" element={<ProtectedRoute allowedRole="doctor"><DoctorDashboard /></ProtectedRoute>} />
        <Route path="/doctor/consulta/nueva" element={<ProtectedRoute allowedRole="doctor"><NewConsultation /></ProtectedRoute>} />
        <Route path="/doctor/paciente/:id" element={<ProtectedRoute allowedRole="doctor"><PatientDetail /></ProtectedRoute>} />
        <Route path="/patient" element={<ProtectedRoute allowedRole="patient"><PatientDashboard /></ProtectedRoute>} />
        <Route path="/patient/progreso" element={<ProtectedRoute allowedRole="patient"><ProgressTracker /></ProtectedRoute>} />
        <Route path="/patient/checkin" element={<ProtectedRoute allowedRole="patient"><WellnessCheckin /></ProtectedRoute>} />
        <Route path="/patient/chat" element={<ProtectedRoute allowedRole="patient"><Chat /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
