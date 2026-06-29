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

export default function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/patient/dashboard" element={<PatientDashboard />} />
          <Route path="/patient/progress" element={<ProgressTracker />} />
          <Route path="/patient/checkin" element={<WellnessCheckin />} />
          <Route path="/patient/messages" element={<Messages />} />
          <Route path="/patient/labs" element={<LabResults />} />
          <Route path="/patient/booking" element={<Booking />} />
          <Route path="/patient/light-health" element={<LightHealth />} />
          <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
          <Route path="/doctor/new-consultation" element={<NewConsultation />} />
          <Route path="/doctor/inventario" element={<Inventario />} />
          <Route path="/doctor/patient/:id" element={<PatientDetail />} />
          <Route path="/calculator" element={<Calculadora />} />
          <Route path="/confirmed" element={<EmailConfirmed />} />
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  )
}
