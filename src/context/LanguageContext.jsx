import { createContext, useContext, useState } from 'react'

const LanguageContext = createContext()

export const translations = {
  en: {
    // Nav
    dashboard: 'Dashboard',
    progress: 'Progress',
    checkin: 'Check-in',
    messages: 'Messages',
    labs: 'Lab Results',
    booking: 'Book Consult',
    lightHealth: 'Light & Rhythm',
    logout: 'Logout',
    patients: 'Patients',
    newConsult: 'New Consultation',
    // Auth
    welcome: 'Welcome',
    login: 'Sign In',
    register: 'Create Account',
    email: 'Email',
    password: 'Password',
    fullName: 'Full Name',
    accountType: 'Account Type',
    patient: 'Patient',
    doctor: 'Doctor',
    // Gate
    gateTitle: 'Medical Access Portal',
    gateAge: 'I confirm I am 18 years of age or older',
    gateWaiver: 'I acknowledge this platform provides physician-supervised peptide therapy under COFEPRIS regulations and consent to treatment terms',
    gateContinue: 'Continue to Portal',
    // Dashboard
    myProtocol: 'My Protocol',
    noProtocol: 'No active protocol yet. Your doctor will assign one after your consultation.',
    recentCheckins: 'Recent Check-ins',
    noCheckins: 'No check-ins recorded yet.',
    wellnessScore: 'Wellness Score',
    reorder: 'Reorder →',
    // Booking
    bookingTitle: 'Book a Consultation',
    bookingSubtitle: 'Schedule your 15-minute initial consultation with Dr. Fernando Valenzuela. Available Monday–Thursday, 8–9 AM.',
    // Light Health
    lightHealthTitle: 'Light & Circadian Health',
    lightHealthSubtitle: 'Optimize your body\'s natural rhythms to amplify your peptide protocol results.',
    // Intro Modal
    introTitle: 'Welcome to Your Peptide Journey',
    introDismiss: 'I understand — let\'s begin',
    // Messages
    messagesTitle: 'Messages',
    messagePlaceholder: 'Type a message...',
    send: 'Send',
    noMessages: 'No messages yet. Start the conversation.',
    // Labs
    labsTitle: 'Lab Results & Studies',
    uploadLab: 'Upload File',
    uploadHint: 'Upload blood work, scans, or any medical studies (PDF or image)',
    noLabs: 'No files uploaded yet.',
    uploading: 'Uploading...',
    // Doctor
    patientList: 'Patient List',
    todayAppts: 'Today\'s Appointments',
    noAppts: 'No appointments scheduled for today.',
    viewIntake: 'View Intake',
    joinMeet: 'Join Meet',
    startConsult: 'Start Consultation',
    aiSummary: 'AI Summary',
    generating: 'Generating...',
    summaryTitle: 'Patient Summary',
    noPatients: 'No patients registered yet.',
    consultations: 'Consultations',
    // Progress
    progressTitle: 'Progress Tracker',
    weight: 'Weight (kg)',
    energy: 'Energy Level',
    sleep: 'Sleep Quality',
    mood: 'Mood',
    notes: 'Notes',
    save: 'Save Entry',
    saved: 'Saved!',
  },
  es: {
    // Nav
    dashboard: 'Inicio',
    progress: 'Progreso',
    checkin: 'Check-in',
    messages: 'Mensajes',
    labs: 'Estudios',
    booking: 'Reservar Consulta',
    lightHealth: 'Luz & Ritmo',
    logout: 'Salir',
    patients: 'Pacientes',
    newConsult: 'Nueva Consulta',
    // Auth
    welcome: 'Bienvenido',
    login: 'Iniciar Sesión',
    register: 'Crear Cuenta',
    email: 'Correo',
    password: 'Contraseña',
    fullName: 'Nombre Completo',
    accountType: 'Tipo de Cuenta',
    patient: 'Paciente',
    doctor: 'Médico',
    // Gate
    gateTitle: 'Portal de Acceso Médico',
    gateAge: 'Confirmo que tengo 18 años o más',
    gateWaiver: 'Reconozco que esta plataforma ofrece terapia de péptidos supervisada por médico bajo regulaciones COFEPRIS y consiento los términos de tratamiento',
    gateContinue: 'Continuar al Portal',
    // Dashboard
    myProtocol: 'Mi Protocolo',
    noProtocol: 'Sin protocolo activo aún. Tu médico asignará uno después de la consulta.',
    recentCheckins: 'Check-ins Recientes',
    noCheckins: 'Sin check-ins registrados aún.',
    wellnessScore: 'Puntaje de Bienestar',
    reorder: 'Reordenar →',
    // Booking
    bookingTitle: 'Reservar una Consulta',
    bookingSubtitle: 'Agenda tu consulta inicial de 15 minutos con el Dr. Fernando Valenzuela. Disponible lunes–jueves, 8–9 AM.',
    // Light Health
    lightHealthTitle: 'Salud de Luz y Ritmo Circadiano',
    lightHealthSubtitle: 'Optimiza los ritmos naturales de tu cuerpo para amplificar los resultados de tu protocolo de péptidos.',
    // Intro Modal
    introTitle: 'Bienvenido a Tu Viaje de Péptidos',
    introDismiss: 'Entendido — ¡comencemos!',
    // Messages
    messagesTitle: 'Mensajes',
    messagePlaceholder: 'Escribe un mensaje...',
    send: 'Enviar',
    noMessages: 'Sin mensajes aún. Inicia la conversación.',
    // Labs
    labsTitle: 'Estudios y Resultados',
    uploadLab: 'Subir Archivo',
    uploadHint: 'Sube análisis de sangre, estudios o cualquier resultado médico (PDF o imagen)',
    noLabs: 'Sin archivos subidos aún.',
    uploading: 'Subiendo...',
    // Doctor
    patientList: 'Lista de Pacientes',
    todayAppts: 'Consultas de Hoy',
    noAppts: 'No hay consultas programadas para hoy.',
    viewIntake: 'Ver Intake',
    joinMeet: 'Unirse a Meet',
    startConsult: 'Iniciar Consulta',
    aiSummary: 'Resumen IA',
    generating: 'Generando...',
    summaryTitle: 'Resumen del Paciente',
    noPatients: 'Sin pacientes registrados aún.',
    consultations: 'Consultas',
    // Progress
    progressTitle: 'Seguimiento de Progreso',
    weight: 'Peso (kg)',
    energy: 'Nivel de Energía',
    sleep: 'Calidad de Sueño',
    mood: 'Estado de Ánimo',
    notes: 'Notas',
    save: 'Guardar',
    saved: '¡Guardado!',
  }
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    // Read from localStorage on init — default to 'es'
    return localStorage.getItem('pept_lang') || 'es'
  })

  const t = translations[lang]

  const toggleLang = () => {
    setLang(l => {
      const next = l === 'es' ? 'en' : 'es'
      localStorage.setItem('pept_lang', next)
      return next
    })
  }

  return (
    <LanguageContext.Provider value={{ lang, t, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLang() {
  return useContext(LanguageContext)
}
