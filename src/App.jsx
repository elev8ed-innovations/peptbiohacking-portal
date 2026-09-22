import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LanguageProvider } from './context/LanguageContext'
import Login from './pages/Login'
import Register from './pages/Register'
import PatientDashboard from './pages/patient/Dashboard'
import ProgressTracker from './pages/patient/ProgressTracker'
import WellnessCheckin from './pages/patient/WellnessCheckin'
import Messages from './pages/patient/Messages'
import LabResults from './pages/patient/LabResults'
import Booking from './pages/patient/Booking'
import LightHealth from './pages/patient/LightHealth'
import DoctorDashboard from './pages/doctor/Dashboard'
import NewConsultation from './pages/doctor/NewConsultation'
import PatientDetail from './pages/doctor/PatientDetail'
import Inventario from './pages/doctor/Inventario'
import Calculadora from './pages/shared/Calculadora'
import EmailConfirmed from './pages/EmailConfirmed'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/patient/dashboard" element={<ProtectedRoute role="patient"><PatientDashboard /></ProtectedRoute>} />
          <Route path="/patient/progress" element={<ProtectedRoute role="patient"><ProgressTracker /></ProtectedRoute>} />
          <Route path="/patient/checkin" element={<ProtectedRoute role="patient"><WellnessCheckin /></ProtectedRoute>} />
          <Route path="/patient/messages" element={<ProtectedRoute role="patient"><Messages /></ProtectedRoute>} />
          <Route path="/patient/labs" element={<ProtectedRoute role="patient"><LabResults /></ProtectedRoute>} />
          <Route path="/patient/booking" element={<ProtectedRoute role="patient"><Booking /></ProtectedRoute>} />
          <Route path="/patient/light-health" element={<ProtectedRoute role="patient"><LightHealth /></ProtectedRoute>} />
          <Route path="/doctor/dashboard" element={<ProtectedRoute role="doctor"><DoctorDashboard /></ProtectedRoute>} />
          <Route path="/doctor/new-consultation" element={<ProtectedRoute role="doctor"><NewConsultation /></ProtectedRoute>} />
          <Route path="/doctor/inventario" element={<ProtectedRoute role="doctor"><Inventario /></ProtectedRoute>} />
          <Route path="/doctor/patient/:id" element={<ProtectedRoute role="doctor"><PatientDetail /></ProtectedRoute>} />
          <Route path="/calculator" element={<Calculadora />} />
          <Route path="/confirmed" element={<EmailConfirmed />} />
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  )
}
